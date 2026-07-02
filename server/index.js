import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

console.log("CLERK_PUBLISHABLE_KEY in index.js:", !!process.env.CLERK_PUBLISHABLE_KEY, "Length:", process.env.CLERK_PUBLISHABLE_KEY?.length);
console.log("CLERK_SECRET_KEY in index.js:", !!process.env.CLERK_SECRET_KEY, "Length:", process.env.CLERK_SECRET_KEY?.length);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper to decode JWT payload without verification
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

// Helper to get initials from name
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map(n => n[0]).join('').toUpperCase() || "U";
}

// Fetch Clerk User helper
async function fetchClerkUser(userId) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      console.warn("CLERK_SECRET_KEY is missing, cannot fetch Clerk user details.");
      return null;
    }
    const response = await axios.get(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`
      }
    });
    return response.data;
  } catch (err) {
    console.error(`Error fetching user ${userId} from Clerk:`, err.response?.data || err.message);
    return null;
  }
}

const mapWorkspaceRole = (role) => {
  if (!role) return 'MEMBER';
  const r = role.toUpperCase();
  if (r === 'ADMIN') return 'ADMIN';
  return 'MEMBER';
};

const mapProjectRole = (role) => {
  if (!role) return 'MEMBER';
  const r = role.toUpperCase().replace(/\s+/g, '_');
  const validRoles = ['LEAD', 'DEVELOPER', 'DESIGNER', 'QA', 'PRODUCT_MANAGER', 'MEMBER'];
  if (validRoles.includes(r)) return r;
  return 'MEMBER';
};

const mapProjectRoleToUi = (role) => {
  const mapping = {
    LEAD: "Lead",
    DEVELOPER: "Developer",
    DESIGNER: "Designer",
    QA: "QA",
    PRODUCT_MANAGER: "Product Manager",
    MEMBER: "Member"
  };
  return mapping[role] || "Member";
};

const mapInvitationStatus = (status) => {
  if (!status) return 'PENDING';
  const s = status.toUpperCase();
  const validStatus = ['PENDING', 'ACCEPTED', 'DECLINED'];
  if (validStatus.includes(s)) return s;
  return 'PENDING';
};

const mapIssueStatus = (status) => {
  if (!status) return 'TODO';
  const s = status.toUpperCase().replace(/-/g, '_');
  const validStatus = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  if (validStatus.includes(s)) return s;
  return 'TODO';
};

const mapIssueStatusToUi = (status) => {
  const mapping = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    REVIEW: "review",
    DONE: "done"
  };
  return mapping[status] || "todo";
};

const mapIssuePriority = (priority) => {
  if (!priority) return 'MEDIUM';
  const p = priority.toUpperCase();
  const validPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  if (validPriority.includes(p)) return p;
  return 'MEDIUM';
};

const mapIssuePriorityToUi = (priority) => {
  const mapping = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent"
  };
  return mapping[priority] || "medium";
};

const mapIssueType = (type) => {
  if (!type) return 'ISSUE';
  const t = type.toUpperCase();
  const validTypes = ['ISSUE', 'BUG', 'FEATURE'];
  if (validTypes.includes(t)) return t;
  return 'ISSUE';
};

const mapIssueTypeToUi = (type) => {
  const mapping = {
    ISSUE: "issue",
    BUG: "bug",
    FEATURE: "feature"
  };
  return mapping[type] || "issue";
};

const mapIssueToUi = (i) => {
  if (!i) return null;
  return {
    ...i,
    status: mapIssueStatusToUi(i.status),
    priority: mapIssuePriorityToUi(i.priority),
    type: mapIssueTypeToUi(i.type),
    storyPoints: i.storyPoints ? String(i.storyPoints) : undefined
  };
};

async function logProjectActivity(projectId, userId, message, customUserName = null) {
  let userName = "System";
  if (customUserName) {
    userName = customUserName;
  } else if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    userName = user ? (user.username || user.name) : "System";
  }

  try {
    await prisma.projectActivity.create({
      data: {
        projectId,
        userId: userId || null,
        userName,
        message,
      }
    });
  } catch (err) {
    console.error("Error logging project activity:", err);
  }
}

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = decodeJwtPayload(token);
    if (decoded) {
      const nowSec = Math.floor(Date.now() / 1000);
      console.log(`JWT Sub claim: ${decoded.sub}, Expired: ${nowSec > decoded.exp}`);
    }
  }
  next();
});

app.use(clerkMiddleware());

app.use((req, res, next) => {
  const auth = getAuth(req);
  console.log("getAuth(req) state:", { userId: auth?.userId, hasSession: !!auth?.sessionId });
  next();
});

// Authentication Middleware via Clerk JWT session token verification
async function authenticateToken(req, res, next) {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return res.status(401).json({ error: "Access token required / Unauthenticated Clerk Session" });
  }

  try {
    let activeUser = await prisma.user.findUnique({ where: { id: auth.userId } });

    if (!activeUser) {
      let email = "";
      let name = "";
      let username = "";

      const clerkUser = await fetchClerkUser(auth.userId);
      if (clerkUser) {
        const primaryEmailObj = clerkUser.email_addresses?.find(e => e.id === clerkUser.primary_email_address_id);
        email = (primaryEmailObj?.email_address || "").toLowerCase().trim();
        name = `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || clerkUser.username || email.split('@')[0];
        username = clerkUser.username || "";
      }

      if (!email) {
        email = `user-${auth.userId.slice(-6)}@clerk.dev`;
      }
      if (!name) {
        name = email.split('@')[0];
      }

      const placeholderUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { startsWith: "invited-" }
        }
      });

      if (placeholderUser) {
        console.log(`Migrating placeholder user ${placeholderUser.id} to Clerk ID ${auth.userId}`);
        const oldId = placeholderUser.id;

        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              id: auth.userId,
              name: name,
              email: email,
              avatar: getInitials(name),
              username: username || null,
            }
          });

          await tx.workspaceMember.updateMany({
            where: { userId: oldId },
            data: { userId: auth.userId }
          });

          await tx.projectMember.updateMany({
            where: { userId: oldId },
            data: { userId: auth.userId }
          });

          await tx.issue.updateMany({
            where: { assigneeId: oldId },
            data: { assigneeId: auth.userId }
          });
          await tx.issue.updateMany({
            where: { creatorId: oldId },
            data: { creatorId: auth.userId }
          });

          await tx.comment.updateMany({
            where: { userId: oldId },
            data: { userId: auth.userId }
          });

          await tx.personalTodo.updateMany({
            where: { userId: oldId },
            data: { userId: auth.userId }
          });

          await tx.projectActivity.updateMany({
            where: { userId: oldId },
            data: { userId: auth.userId }
          });

          await tx.user.delete({
            where: { id: oldId }
          });
        });

        activeUser = await prisma.user.findUnique({ where: { id: auth.userId } });
      } else {
        activeUser = await prisma.user.create({
          data: {
            id: auth.userId,
            name: name,
            email: email,
            avatar: getInitials(name),
            username: username || null
          }
        });
      }
    }


    if (activeUser && activeUser.email.endsWith("@clerk.dev") && activeUser.email.startsWith("user-")) {
      const clerkUser = await fetchClerkUser(auth.userId);
      if (clerkUser) {
        const primaryEmailObj = clerkUser.email_addresses?.find(e => e.id === clerkUser.primary_email_address_id);
        const email = (primaryEmailObj?.email_address || "").toLowerCase().trim();
        if (email && email !== activeUser.email) {
          console.log(`Updating fallback email for ${activeUser.id} to ${email}`);

          const placeholderUser = await prisma.user.findFirst({
            where: {
              email: email,
              id: { startsWith: "invited-" }
            }
          });

          if (placeholderUser) {
            console.log(`Migrating placeholder user ${placeholderUser.id} to existing user ${auth.userId}`);
            const oldId = placeholderUser.id;

            await prisma.$transaction(async (tx) => {
              await tx.workspaceMember.updateMany({
                where: { userId: oldId },
                data: { userId: auth.userId }
              });
              await tx.projectMember.updateMany({
                where: { userId: oldId },
                data: { userId: auth.userId }
              });
              await tx.issue.updateMany({
                where: { assigneeId: oldId },
                data: { assigneeId: auth.userId }
              });
              await tx.issue.updateMany({
                where: { creatorId: oldId },
                data: { creatorId: auth.userId }
              });
              await tx.comment.updateMany({
                where: { userId: oldId },
                data: { userId: auth.userId }
              });
              await tx.personalTodo.updateMany({
                where: { userId: oldId },
                data: { userId: auth.userId }
              });
              await tx.projectActivity.updateMany({
                where: { userId: oldId },
                data: { userId: auth.userId }
              });

              await tx.user.delete({
                where: { id: oldId }
              });
            });
          }

          activeUser = await prisma.user.update({
            where: { id: auth.userId },
            data: { email: email }
          });
        }
      }
    }


    const claims = auth.sessionClaims;
    if (activeUser && claims?.name && activeUser.name !== claims.name) {
      console.log(`Syncing name change from Clerk: ${activeUser.name} -> ${claims.name}`);
      activeUser = await prisma.user.update({
        where: { id: auth.userId },
        data: {
          name: claims.name,
          avatar: getInitials(claims.name)
        }
      });
    }

    req.user = activeUser;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
}

// ---------------- API Routes ----------------

// Fetch authenticated profile info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar } });
});


app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, avatar: true }
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Workspaces
app.get('/api/workspaces', authenticateToken, async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      select: { workspaceId: true }
    });
    const workspaceIds = memberships.map(m => m.workspaceId);
    const list = await prisma.workspace.findMany({
      where: { id: { in: workspaceIds } }
    });
    res.json({ workspaces: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workspaces/explore', authenticateToken, async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      select: { workspaceId: true }
    });
    const workspaceIds = memberships.map(m => m.workspaceId);
    const exploreList = await prisma.workspace.findMany({
      where: { id: { notIn: workspaceIds } }
    });
    res.json({ workspaces: exploreList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspaces/:id/join', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const ws = await prisma.workspace.findUnique({ where: { id } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const isAlreadyMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: req.user.id
        }
      }
    });

    if (isAlreadyMember) {
      return res.status(400).json({ error: "You are already a member of this workspace" });
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId: req.user.id,
        role: 'MEMBER'
      }
    });

    res.json({ workspace: ws });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspaces', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Workspace name is required" });

  const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');

  try {
    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: "A workspace with this name or slug already exists" });
    }

    const newWorkspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug,
          creatorId: req.user.id
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId: req.user.id,
          role: 'ADMIN'
        }
      });

      return ws;
    });

    res.json({ workspace: newWorkspace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workspaces/:slug/members', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const memberships = await prisma.workspaceMember.findMany({
      where: { workspaceId: ws.id },
      include: { user: true }
    });

    const members = memberships.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar
    }));

    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspaces/:slug/members', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Member email is required" });

  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (!targetUser) return res.status(404).json({ error: "User not found with this email" });

    const isAlreadyMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: ws.id,
          userId: targetUser.id
        }
      }
    });

    if (isAlreadyMember) {
      return res.status(400).json({ error: "User is already a member of this workspace" });
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: targetUser.id,
        role: 'MEMBER'
      }
    });

    res.json({
      member: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/workspaces/:slug/members/:userId', authenticateToken, async (req, res) => {
  const { slug, userId } = req.params;

  if (userId === req.user.id) {
    return res.status(400).json({ error: "You cannot remove yourself from the workspace" });
  }

  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: ws.id,
          userId: userId
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ error: "User is not a member of this workspace" });
    }
    if (membership.role === 'ADMIN') {
      return res.status(403).json({ error: "Cannot remove a workspace admin" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId: ws.id,
            userId: userId
          }
        }
      });

      const projects = await tx.project.findMany({
        where: { workspaceId: ws.id },
        select: { id: true }
      });
      const projectIds = projects.map(p => p.id);

      await tx.projectMember.deleteMany({
        where: {
          projectId: { in: projectIds },
          userId: userId
        }
      });
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Projects
app.get('/api/workspaces/:slug/projects', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const memberMemberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true }
    });
    const memberProjectIds = memberMemberships.map(pm => pm.projectId);

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: ws.id,
        OR: [
          { creatorId: req.user.id },
          { id: { in: memberProjectIds } }
        ]
      }
    });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspaces/:slug/projects', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  const { name, description, key: userKey } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const newProject = await prisma.$transaction(async (tx) => {
      // Generate a short unique key (2-10 characters) from project name or custom userKey
      let key = "";
      if (userKey && typeof userKey === 'string') {
        key = userKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      }
      if (!key || key.length < 2) {
        key = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      }
      if (!key || key.length < 2) {
        key = "PROJ";
      }
      let uniqueKey = key;
      let counter = 1;
      while (true) {
        const existing = await tx.project.findFirst({
          where: {
            workspaceId: ws.id,
            key: uniqueKey
          }
        });
        if (!existing) break;
        counter++;
        uniqueKey = `${key}${counter}`;
      }

      const project = await tx.project.create({
        data: {
          workspaceId: ws.id,
          name: name.trim(),
          description: description ? description.trim() : "",
          creatorId: req.user.id,
          key: uniqueKey
        }
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: req.user.id,
          role: 'LEAD'
        }
      });

      return project;
    });

    res.json({ project: newProject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.creatorId !== req.user.id) {
      return res.status(403).json({ error: "Only the project creator can delete this project" });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project Members
app.get('/api/projects/:id/members', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: true }
    });

    const members = projectMembers.map(pm => ({
      id: pm.user.id,
      name: pm.user.name,
      email: pm.user.email,
      avatar: pm.user.avatar,
      isPending: false,
      role: mapProjectRoleToUi(pm.role)
    }));

    const pendingInvs = await prisma.projectInvitation.findMany({
      where: { projectId: id, status: 'PENDING' }
    });

    const pendingMembers = await Promise.all(pendingInvs.map(async (inv) => {
      const placeholderUser = await prisma.user.findFirst({
        where: { email: inv.email }
      });
      return {
        id: placeholderUser?.id || `invited-temp-${inv.id}`,
        name: placeholderUser?.name || inv.email.split('@')[0],
        email: inv.email,
        avatar: "I",
        isPending: true,
        role: mapProjectRoleToUi(inv.role)
      };
    }));

    res.json({ members: [...members, ...pendingMembers], creatorId: project.creatorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/members', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Member email is required" });

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.creatorId !== req.user.id) {
      return res.status(403).json({ error: "Only the project creator can invite others to join this project" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const mappedRole = mapProjectRole(role || "Member");

    let targetUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (targetUser) {
      const isProjectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId: targetUser.id
          }
        }
      });
      if (isProjectMember) {
        return res.status(400).json({ error: "User is already a member of this project" });
      }
    }

    const existingInv = await prisma.projectInvitation.findFirst({
      where: { projectId: id, email: cleanEmail, status: 'PENDING' }
    });
    if (existingInv) {
      return res.status(400).json({ error: "An invitation has already been sent to this user" });
    }

    if (!targetUser) {
      const name = cleanEmail.split('@')[0];
      targetUser = await prisma.user.create({
        data: {
          id: "invited-" + crypto.randomUUID(),
          name: name,
          email: cleanEmail,
          avatar: "I",
          username: null
        }
      });
    }

    await prisma.projectInvitation.create({
      data: {
        projectId: id,
        workspaceId: project.workspaceId,
        email: cleanEmail,
        status: 'PENDING',
        invitedBy: req.user.id,
        role: mappedRole
      }
    });

    res.json({
      message: "Invitation sent successfully",
      member: {
        id: targetUser.id,
        name: targetUser.name,
        email: cleanEmail,
        avatar: "I",
        isPending: true,
        role: role || "Member"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id/members/:userId', authenticateToken, async (req, res) => {
  const { id, userId } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.creatorId !== req.user.id) {
      return res.status(403).json({ error: "Only the project creator can remove members from this project" });
    }

    if (project.creatorId === userId) {
      return res.status(400).json({ error: "The project creator cannot be removed from the project" });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.deleteMany({
        where: { projectId: id, userId: userId }
      });

      if (targetUser) {
        await tx.projectInvitation.deleteMany({
          where: { projectId: id, email: targetUser.email.toLowerCase().trim() }
        });
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id/members/:userId/role', authenticateToken, async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.creatorId !== req.user.id) {
      return res.status(403).json({ error: "Only the project creator can assign member roles" });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId
        }
      }
    });
    if (!membership) return res.status(404).json({ error: "Member not found in project" });

    const mappedRole = mapProjectRole(role);
    await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId
        }
      },
      data: { role: mappedRole }
    });

    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id/activity', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isMember = project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId: req.user.id
          }
        }
      });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    const activities = await prisma.projectActivity.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Personal Todos inside a Project
app.get('/api/projects/:id/todos', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const todos = await prisma.personalTodo.findMany({
      where: { projectId: id, userId: req.user.id }
    });
    res.json({ todos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/todos', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const newTodo = await prisma.personalTodo.create({
      data: {
        projectId: id,
        userId: req.user.id,
        text: text.trim(),
        completed: false
      }
    });
    res.json({ todo: newTodo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id/todos/:todoId', authenticateToken, async (req, res) => {
  const { todoId } = req.params;
  const { completed } = req.body;
  if (completed === undefined) return res.status(400).json({ error: "completed status is required" });

  try {
    const todo = await prisma.personalTodo.findFirst({
      where: { id: todoId, userId: req.user.id }
    });
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    const updated = await prisma.personalTodo.update({
      where: { id: todoId },
      data: { completed: !!completed }
    });
    res.json({ success: true, todo: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id/todos/:todoId', authenticateToken, async (req, res) => {
  const { todoId } = req.params;
  try {
    const todo = await prisma.personalTodo.findFirst({
      where: { id: todoId, userId: req.user.id }
    });
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    await prisma.personalTodo.delete({ where: { id: todoId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/sync', authenticateToken, async (req, res) => {
  const { name, username, avatar, email } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const data = {};
    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username || null;
    if (avatar !== undefined) data.avatar = avatar;

    if (email && email.toLowerCase().trim() !== user.email) {
      const cleanEmail = email.toLowerCase().trim();
      data.email = cleanEmail;

      const placeholderUser = await prisma.user.findFirst({
        where: { email: cleanEmail, id: { startsWith: "invited-" } }
      });

      if (placeholderUser) {
        console.log(`POST /api/users/sync: Migrating placeholder user ${placeholderUser.id} to Clerk ID ${req.user.id}`);
        const oldId = placeholderUser.id;

        await prisma.$transaction(async (tx) => {
          await tx.workspaceMember.updateMany({
            where: { userId: oldId },
            data: { userId: req.user.id }
          });
          await tx.projectMember.updateMany({
            where: { userId: oldId },
            data: { userId: req.user.id }
          });
          await tx.issue.updateMany({
            where: { assigneeId: oldId },
            data: { assigneeId: req.user.id }
          });
          await tx.issue.updateMany({
            where: { creatorId: oldId },
            data: { creatorId: req.user.id }
          });
          await tx.comment.updateMany({
            where: { userId: oldId },
            data: { userId: req.user.id }
          });
          await tx.personalTodo.updateMany({
            where: { userId: oldId },
            data: { userId: req.user.id }
          });
          await tx.projectActivity.updateMany({
            where: { userId: oldId },
            data: { userId: req.user.id }
          });

          await tx.user.delete({ where: { id: oldId } });
        });
      }
    }

    if (Object.keys(data).length > 0) {
      user = await prisma.user.update({
        where: { id: req.user.id },
        data
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project Invitations Management
app.get('/api/invitations', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();

    const pending = await prisma.projectInvitation.findMany({
      where: { email: userEmail, status: 'PENDING' },
      include: { project: true, workspace: true }
    });

    const detailed = await Promise.all(pending.map(async (inv) => {
      const inviter = await prisma.user.findUnique({
        where: { id: inv.invitedBy }
      });
      return {
        id: inv.id,
        projectId: inv.projectId,
        workspaceId: inv.workspaceId,
        projectName: inv.project?.name || "Unknown Project",
        workspaceName: inv.workspace?.name || "Unknown Workspace",
        inviterName: inviter?.name || "A teammate",
        createdAt: inv.createdAt
      };
    }));

    res.json({ invitations: detailed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invitations/:id/accept', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await prisma.projectInvitation.findUnique({ where: { id } });
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });

    if (invitation.email !== req.user.email.toLowerCase().trim()) {
      return res.status(403).json({ error: "This invitation was sent to a different email address" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectInvitation.update({
        where: { id },
        data: { status: 'ACCEPTED' }
      });

      const workspaceMember = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: req.user.id
          }
        }
      });
      if (!workspaceMember) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: req.user.id,
            role: 'MEMBER'
          }
        });
      }

      const projectMember = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId: req.user.id
          }
        }
      });
      if (!projectMember) {
        await tx.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: req.user.id,
            role: invitation.role
          }
        });
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invitations/:id/decline', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await prisma.projectInvitation.findUnique({ where: { id } });
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });

    if (invitation.email !== req.user.email.toLowerCase().trim()) {
      return res.status(403).json({ error: "This invitation was sent to a different email address" });
    }

    await prisma.projectInvitation.update({
      where: { id },
      data: { status: 'DECLINED' }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Issues
app.get('/api/workspaces/:slug/issues', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    const memberMemberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true }
    });
    const memberProjectIds = memberMemberships.map(pm => pm.projectId);

    const allowedProjects = await prisma.project.findMany({
      where: {
        workspaceId: ws.id,
        OR: [
          { creatorId: req.user.id },
          { id: { in: memberProjectIds } }
        ]
      },
      select: { id: true }
    });
    const allowedProjectIds = allowedProjects.map(p => p.id);


    const issues = await prisma.issue.findMany({
      where: {
        workspaceId: ws.id,
        projectId: { in: allowedProjectIds }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ issues: issues.map(mapIssueToUi) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspaces/:slug/issues', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  const {
    projectId, title, description, status, priority, assigneeId,
    type, bugSeverity, bugEnv, featureScope, storyPoints, tags
  } = req.body;

  if (!title) return res.status(400).json({ error: "Issue title is required" });

  try {
    const ws = await prisma.workspace.findUnique({ where: { slug } });
    if (!ws) return res.status(404).json({ error: "Workspace not found" });

    let targetProjectId = projectId;
    if (!targetProjectId) {
      const firstProj = await prisma.project.findFirst({ where: { workspaceId: ws.id } });
      targetProjectId = firstProj?.id || "default-project";
    }

    const project = await prisma.project.findUnique({ where: { id: targetProjectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isCreatorProjMember = project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: targetProjectId,
            userId: req.user.id
          }
        }
      });

    if (!isCreatorProjMember) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    const finalAssigneeId = assigneeId || req.user.id;
    const isAssigneeProjMember = project.creatorId === finalAssigneeId ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: targetProjectId,
            userId: finalAssigneeId
          }
        }
      });

    if (!isAssigneeProjMember) {
      return res.status(400).json({ error: "Assignee must be a member of the project" });
    }


    const projectIssues = await prisma.issue.findMany({
      where: { projectId: targetProjectId },
      select: { issueNumber: true }
    });

    const nextNumber = projectIssues.length > 0
      ? Math.max(...projectIssues.map(i => i.issueNumber)) + 1
      : 1;


    const prefix = project.key || "PROJ";
    const issueKey = `${prefix}-${nextNumber}`;

    const newIssue = await prisma.issue.create({
      data: {
        issueKey,
        issueNumber: nextNumber,
        projectId: targetProjectId,
        workspaceId: ws.id,
        title: title.trim(),
        description: description ? description.trim() : "",
        status: mapIssueStatus(status || "todo"),
        priority: mapIssuePriority(priority || "medium"),
        type: mapIssueType(type || "issue"),
        assigneeId: finalAssigneeId,
        creatorId: req.user.id,
        bugSeverity: bugSeverity || null,
        bugEnv: bugEnv || null,
        featureScope: featureScope || null,
        storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
        tags: tags || []
      }
    });

    await logProjectActivity(targetProjectId, req.user.id, `created issue ${issueKey}`);
    res.json({ issue: mapIssueToUi(newIssue) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:projectId/issues/duplicates', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { title } = req.query;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.json({ duplicates: [] });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isMember = project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id
          }
        }
      });
    if (!isMember) return res.status(403).json({ error: "You are not a member of this project" });

    const activeIssues = await prisma.issue.findMany({
      where: {
        projectId,
        status: { not: 'DONE' }
      }
    });

    const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "with", "after"]);

    const getWordTokens = (str) => {
      return str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length >= 3 && !STOP_WORDS.has(word));
    };

    const calculateSimilarity = (titleA, titleB) => {
      const cleanA = titleA.toLowerCase().trim();
      const cleanB = titleB.toLowerCase().trim();

      const substringBoost = (cleanA.includes(cleanB) || cleanB.includes(cleanA)) ? 0.5 : 0.0;

      const tokensA = getWordTokens(titleA);
      const tokensB = getWordTokens(titleB);

      let jaccard = 0;
      if (tokensA.length > 0 && tokensB.length > 0) {
        const setA = new Set(tokensA);
        const setB = new Set(tokensB);
        const intersection = [...setA].filter(x => setB.has(x)).length;
        const union = new Set([...setA, ...setB]).size;
        jaccard = intersection / union;
      }

      return Math.min(1.0, substringBoost + jaccard);
    };

    const duplicates = activeIssues
      .map(issue => ({
        issue: mapIssueToUi(issue),
        similarity: calculateSimilarity(issue.title, title)
      }))
      .filter(item => item.similarity >= 0.25)
      .sort((a, b) => b.similarity - a.similarity);

    res.json({ duplicates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/issues/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const patch = req.body;

  try {
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const targetProjectId = patch.projectId || issue.projectId;
    const project = await prisma.project.findUnique({ where: { id: targetProjectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isCallerMember = project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: targetProjectId,
            userId: req.user.id
          }
        }
      });

    if (!isCallerMember) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    if (patch.assigneeId) {
      const isAssigneeMember = project.creatorId === patch.assigneeId ||
        await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: targetProjectId,
              userId: patch.assigneeId
            }
          }
        });
      if (!isAssigneeMember) {
        return res.status(400).json({ error: "Assignee must be a member of the project" });
      }
    }

    const data = {};
    if (patch.title !== undefined) data.title = patch.title.trim();
    if (patch.description !== undefined) data.description = patch.description.trim();
    if (patch.status !== undefined) data.status = mapIssueStatus(patch.status);
    if (patch.priority !== undefined) data.priority = mapIssuePriority(patch.priority);
    if (patch.type !== undefined) data.type = mapIssueType(patch.type);
    if (patch.assigneeId !== undefined) data.assigneeId = patch.assigneeId;
    if (patch.bugSeverity !== undefined) data.bugSeverity = patch.bugSeverity || null;
    if (patch.bugEnv !== undefined) data.bugEnv = patch.bugEnv || null;
    if (patch.featureScope !== undefined) data.featureScope = patch.featureScope || null;
    if (patch.storyPoints !== undefined) data.storyPoints = patch.storyPoints ? parseInt(patch.storyPoints, 10) : null;
    if (patch.tags !== undefined) data.tags = patch.tags;

    if (patch.type && patch.type !== issue.type) {
      if (patch.type === "bug") {
        data.featureScope = null;
        data.storyPoints = null;
      } else if (patch.type === "feature") {
        data.bugSeverity = null;
        data.bugEnv = null;
      } else {
        data.bugSeverity = null;
        data.bugEnv = null;
        data.featureScope = null;
        data.storyPoints = null;
      }
    }

    let projectChanged = false;

    if (patch.projectId !== undefined && patch.projectId !== issue.projectId) {
      const targetProjIssues = await prisma.issue.findMany({
        where: { projectId: patch.projectId },
        select: { issueNumber: true }
      });
      const nextNumber = targetProjIssues.length > 0
        ? Math.max(...targetProjIssues.map(i => i.issueNumber)) + 1
        : 1;

      const newIssueKey = `${project.key}-${nextNumber}`;

      data.projectId = patch.projectId;
      data.issueNumber = nextNumber;
      data.issueKey = newIssueKey;
      projectChanged = true;
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data
    });

    if (projectChanged) {
      const oldProj = await prisma.project.findUnique({ where: { id: issue.projectId } });
      await logProjectActivity(issue.projectId, req.user.id, `moved issue ${issue.issueKey} to project "${project.name}"`);
      await logProjectActivity(patch.projectId, req.user.id, `moved issue ${updatedIssue.issueKey} here from project "${oldProj?.name || 'Unknown'}"`);
    } else if (patch.status && mapIssueStatus(patch.status) !== issue.status) {
      const statusLabels = {
        todo: "Todo",
        "in-progress": "In Progress",
        review: "Review",
        done: "Done"
      };
      const actMsg = patch.status === 'done'
        ? `completed issue ${updatedIssue.issueKey}`
        : `moved issue ${updatedIssue.issueKey} to ${statusLabels[patch.status] || patch.status}`;
      await logProjectActivity(targetProjectId, req.user.id, actMsg);
    }

    res.json({ issue: mapIssueToUi(updatedIssue) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/issues/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const isMember = issue.project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: issue.projectId,
            userId: req.user.id
          }
        }
      });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of the project containing this issue" });
    }

    await prisma.issue.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments
app.get('/api/issues/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const isMember = issue.project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: issue.projectId,
            userId: req.user.id
          }
        }
      });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of the project containing this issue" });
    }

    const comments = await prisma.comment.findMany({
      where: { issueId: id }
    });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/issues/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Comment content is required" });

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const isMember = issue.project.creatorId === req.user.id ||
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: issue.projectId,
            userId: req.user.id
          }
        }
      });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of the project containing this issue" });
    }

    const newComment = await prisma.comment.create({
      data: {
        issueId: id,
        userId: req.user.id,
        content: content.trim()
      }
    });
    res.json({ comment: newComment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { issue: { include: { project: true } } }
    });
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isProjectCreator = comment.issue.project.creatorId === req.user.id;
    const isCommentAuthor = comment.userId === req.user.id;

    if (isProjectCreator || isCommentAuthor) {
      await prisma.comment.delete({ where: { id: commentId } });
      return res.json({ success: true });
    }

    return res.status(403).json({ error: "You do not have permission to delete this comment" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/webhooks/git', async (req, res) => {
  const event = req.headers['x-github-event'] || 'push';
  const logs = [];
  const updatedIssues = [];

  const issueRegex = /\b([A-Z]{2,}-\d+)\b/gi;
  const fixKeywords = /\b(fix|fixes|fixed|resolve|resolves|resolved|close|closes|closed)\b/i;

  try {
    let systemGit = await prisma.user.findUnique({ where: { id: 'system-git' } });
    if (!systemGit) {
      await prisma.user.create({
        data: {
          id: 'system-git',
          name: 'Git Integration',
          email: 'git@bugbytes.io',
          avatar: 'GP'
        }
      });
    }

    if (event === 'push') {
      const { commits, ref } = req.body;
      if (!commits || !Array.isArray(commits)) {
        return res.status(400).json({ error: "Invalid commits payload" });
      }

      const branch = ref ? ref.replace('refs/heads/', '') : 'main';

      for (const commit of commits) {
        const message = commit.message || '';
        const authorName = commit.author?.name || 'git-author';
        const commitUrl = commit.url || '#';
        const shortSha = commit.id ? commit.id.slice(0, 7) : 'commit';

        const matches = message.match(issueRegex);
        if (!matches) continue;

        const issueIds = [...new Set(matches.map(m => m.toUpperCase()))];

        for (const issueId of issueIds) {
          const issue = await prisma.issue.findFirst({ where: { issueKey: issueId } });
          if (!issue) {
            logs.push(`Issue ${issueId} not found in database.`);
            continue;
          }

          const isFix = fixKeywords.test(message);
          const newStatus = isFix ? 'DONE' : 'IN_PROGRESS';
          const oldStatus = issue.status;

          if (oldStatus !== newStatus) {
            await prisma.issue.update({
              where: { id: issueId },
              data: { status: newStatus }
            });
            updatedIssues.push({ id: issueId, oldStatus, newStatus });

            const statusLabels = {
              TODO: "Todo",
              IN_PROGRESS: "In Progress",
              REVIEW: "Review",
              DONE: "Done"
            };
            const actMsg = newStatus === 'DONE'
              ? `completed issue ${issueId} via git commit`
              : `moved issue ${issueId} to ${statusLabels[newStatus] || newStatus} via git commit`;
            await logProjectActivity(issue.projectId, null, actMsg, authorName);
          }

          const cleanMessage = message.replace(issueRegex, '').replace(/[\s-:\(\)]*$/, '').trim();
          const content = `💻 **Git Commit** pushed to branch \`${branch}\` by **${authorName}** (\`${shortSha}\`):\n> ${cleanMessage || 'Linked commit'}\n\n[View Commit Details](${commitUrl})`;

          await prisma.comment.create({
            data: {
              issueId: issue.id,
              userId: 'system-git',
              content
            }
          });

          logs.push(`Processed commit ${shortSha} for issue ${issueId}: transitioned to ${newStatus}.`);
        }
      }
    } else if (event === 'pull_request') {
      const { action, pull_request, number } = req.body;
      if (!pull_request) {
        return res.status(400).json({ error: "Invalid pull_request payload" });
      }

      const title = pull_request.title || '';
      const body = pull_request.body || '';
      const htmlUrl = pull_request.html_url || '#';
      const authorName = pull_request.user?.login || 'git-user';
      const merged = pull_request.merged || false;

      const fullText = `${title} ${body}`;
      const matches = fullText.match(issueRegex);

      if (matches) {
        const issueIds = [...new Set(matches.map(m => m.toUpperCase()))];

        for (const issueId of issueIds) {
          const issue = await prisma.issue.findFirst({ where: { issueKey: issueId } });
          if (!issue) {
            logs.push(`Issue ${issueId} not found in database.`);
            continue;
          }

          const oldStatus = issue.status;
          let newStatus = oldStatus;
          let content = '';

          if (action === 'opened' || action === 'reopened') {
            newStatus = 'REVIEW';
            content = `🔀 **Pull Request #${number}** opened by **${authorName}**:\n> **${title}**\n\n[View Pull Request](${htmlUrl})`;
          } else if (action === 'closed') {
            if (merged) {
              newStatus = 'DONE';
              content = `✅ **Pull Request #${number}** merged by **${authorName}** - issue marked as Done.\n\n[View Pull Request](${htmlUrl})`;
            } else {
              content = `❌ **Pull Request #${number}** closed without merging by **${authorName}**.\n\n[View Pull Request](${htmlUrl})`;
            }
          }

          if (content) {
            if (oldStatus !== newStatus) {
              await prisma.issue.update({
                where: { id: issueId },
                data: { status: newStatus }
              });
              updatedIssues.push({ id: issueId, oldStatus, newStatus });

              let actMsg = '';
              if (newStatus === 'DONE') {
                actMsg = `completed issue ${issueId} via merging PR #${number}`;
              } else if (newStatus === 'REVIEW') {
                actMsg = `moved issue ${issueId} to Review via opening PR #${number}`;
              } else {
                const statusLabels = {
                  TODO: "Todo",
                  IN_PROGRESS: "In Progress",
                  REVIEW: "Review",
                  DONE: "Done"
                };
                actMsg = `moved issue ${issueId} to ${statusLabels[newStatus] || newStatus} via PR #${number}`;
              }
              await logProjectActivity(issue.projectId, null, actMsg, authorName);
            }

            if (action === 'closed' && merged) {
              await logProjectActivity(issue.projectId, null, `merged PR #${number}`, authorName);
            }

            await prisma.comment.create({
              data: {
                issueId: issue.id,
                userId: 'system-git',
                content
              }
            });

            logs.push(`Processed PR #${number} (${action}) for issue ${issueId}: transitioned to ${newStatus}.`);
          }
        }
      }
    } else {
      return res.status(400).json({ error: `Unsupported git event type: ${event}` });
    }

    res.json({ success: true, logs, updatedIssues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 BugBytes Backend running on http://localhost:${PORT}`);
});
