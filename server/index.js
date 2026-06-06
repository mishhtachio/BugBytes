import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("CLERK_PUBLISHABLE_KEY in index.js:", !!process.env.CLERK_PUBLISHABLE_KEY, "Length:", process.env.CLERK_PUBLISHABLE_KEY?.length);
console.log("CLERK_SECRET_KEY in index.js:", !!process.env.CLERK_SECRET_KEY, "Length:", process.env.CLERK_SECRET_KEY?.length);

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

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log(`Auth Header: Bearer present, length: ${token.length}`);
    const decoded = decodeJwtPayload(token);
    if (decoded) {
      const nowSec = Math.floor(Date.now() / 1000);
      console.log(`JWT Payload:`, {
        iss: decoded.iss,
        sub: decoded.sub,
        iat: decoded.iat,
        exp: decoded.exp,
        nbf: decoded.nbf,
        systemTimeSec: nowSec,
        timeDifferenceSec: nowSec - decoded.iat,
        isExpiredBySystemTime: nowSec > decoded.exp
      });
      console.log(`JWT Times (ISO):`, {
        iatISO: new Date(decoded.iat * 1000).toISOString(),
        expISO: new Date(decoded.exp * 1000).toISOString(),
        systemTimeISO: new Date().toISOString()
      });
    } else {
      console.log(`JWT Payload: Could not decode token structure.`);
    }
  } else {
    console.log(`Auth Header: ${authHeader ? 'Unknown format' : 'None'}`);
  }
  next();
});

// Initialize Clerk Middleware
app.use(clerkMiddleware());

// Auth inspector middleware
app.use((req, res, next) => {
  const auth = getAuth(req);
  console.log("getAuth(req) keys:", Object.keys(auth || {}));
  console.log("getAuth(req) state:", { userId: auth?.userId, hasSession: !!auth?.sessionId });
  if (auth && auth.error) {
    console.error("Clerk Auth Verification Error:", auth.error.message || auth.error);
  }
  next();
});

// Database configuration
const dbPath = path.resolve(__dirname, './db.json');

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initial = {
        users: [],
        workspaces: [],
        workspaceMembers: [],
        projects: [],
        issues: [],
        comments: [],
        projectMembers: [],
        projectInvitations: [],
        personalTodos: [],
        projectActivities: []
      };

      fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let modified = false;
    if (!db.projectMembers) {
      db.projectMembers = [];
      modified = true;
    }
    if (!db.projectInvitations) {
      db.projectInvitations = [];
      modified = true;
    }
    if (!db.personalTodos) {
      db.personalTodos = [];
      modified = true;
    }
    if (!db.projectActivities) {
      db.projectActivities = [];
      modified = true;
    }
    if (db.projects) {
      db.projects.forEach(p => {
        if (!p.creatorId) {
          // Skip projects with no creator
        }
        const hasMember = db.projectMembers.some(m => m.projectId === p.id && m.userId === p.creatorId);
        if (!hasMember) {
          db.projectMembers.push({ projectId: p.id, userId: p.creatorId, role: "Lead" });
          modified = true;
        }
      });
    }
    if (db.projectMembers) {
      db.projectMembers.forEach(pm => {
        if (!pm.role) {
          const project = db.projects.find(p => p.id === pm.projectId);
          if (project && project.creatorId === pm.userId) {
            pm.role = "Lead";
          } else {
            pm.role = "Member";
          }
          modified = true;
        }
      });
    }
    if (db.issues) {
      db.issues.forEach(i => {
        if (!i.type) {
          i.type = "bug";
          modified = true;
        }
        if (!i.tags) {
          i.tags = [];
          modified = true;
        }
      });
    }
    if (modified) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }
    return db;
  } catch (err) {
    console.error("DB Read Error:", err);
    return { users: [], workspaces: [], workspaceMembers: [], projects: [], issues: [], comments: [], projectMembers: [], projectInvitations: [], personalTodos: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("DB Write Error:", err);
  }
}

function logProjectActivity(db, projectId, userId, message, customUserName = null) {
  let userName = "System";
  if (customUserName) {
    userName = customUserName;
  } else if (userId) {
    const user = db.users.find(u => u.id === userId);
    userName = user ? (user.username || user.name) : "System";
  }

  const activity = {
    id: 'act-' + Math.random().toString(36).substring(2, 9),
    projectId,
    userId: userId || null,
    userName,
    message,
    createdAt: new Date().toISOString()
  };

  if (!db.projectActivities) {
    db.projectActivities = [];
  }
  db.projectActivities.push(activity);
}

// Authentication Middleware via Clerk JWT session token verification
async function authenticateToken(req, res, next) {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return res.status(401).json({ error: "Access token required / Unauthenticated Clerk Session" });
  }

  const db = readDb();
  let activeUser = db.users.find(u => u.id === auth.userId);

  // If user is not found by ID, let's fetch details from Clerk to get their real email!
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

    // Now check if a placeholder user exists with this email!
    const placeholderUser = db.users.find(u => u.email === email && u.id.startsWith("invited-"));
    if (placeholderUser) {
      console.log(`Migrating placeholder user ${placeholderUser.id} to Clerk ID ${auth.userId}`);
      const oldId = placeholderUser.id;
      
      // Update the placeholder user's properties to the actual user
      placeholderUser.id = auth.userId;
      placeholderUser.name = name;
      placeholderUser.username = username;
      placeholderUser.avatar = getInitials(name);
      
      // Update workspaceMembers references
      db.workspaceMembers.forEach(m => {
        if (m.userId === oldId) m.userId = auth.userId;
      });

      // Update projectMembers references
      if (db.projectMembers) {
        db.projectMembers.forEach(pm => {
          if (pm.userId === oldId) pm.userId = auth.userId;
        });
      }

      // Update issues references
      db.issues.forEach(i => {
        if (i.assigneeId === oldId) i.assigneeId = auth.userId;
        if (i.creatorId === oldId) i.creatorId = auth.userId;
      });

      // Update comments references
      db.comments.forEach(c => {
        if (c.userId === oldId) c.userId = auth.userId;
      });

      activeUser = placeholderUser;
      writeDb(db);
    } else {
      // Create a brand new user
      activeUser = {
        id: auth.userId,
        name: name,
        email: email,
        passwordHash: 'clerk-managed',
        avatar: getInitials(name),
        username: username
      };
      db.users.push(activeUser);
      writeDb(db);
    }
  }

  // If the user already exists, but their email is still the fallback email, let's try to update it!
  if (activeUser && activeUser.email.endsWith("@clerk.dev") && activeUser.email.startsWith("user-")) {
    const clerkUser = await fetchClerkUser(auth.userId);
    if (clerkUser) {
      const primaryEmailObj = clerkUser.email_addresses?.find(e => e.id === clerkUser.primary_email_address_id);
      const email = (primaryEmailObj?.email_address || "").toLowerCase().trim();
      if (email && email !== activeUser.email) {
        console.log(`Updating fallback email for ${activeUser.id} to ${email}`);
        
        // Also check if we can migrate a placeholder user with this email
        const placeholderUser = db.users.find(u => u.email === email && u.id.startsWith("invited-"));
        if (placeholderUser) {
          console.log(`Migrating placeholder user ${placeholderUser.id} to existing user ${auth.userId}`);
          const oldId = placeholderUser.id;
          
          db.workspaceMembers.forEach(m => {
            if (m.userId === oldId) m.userId = auth.userId;
          });
          if (db.projectMembers) {
            db.projectMembers.forEach(pm => {
              if (pm.userId === oldId) pm.userId = auth.userId;
            });
          }
          db.issues.forEach(i => {
            if (i.assigneeId === oldId) i.assigneeId = auth.userId;
            if (i.creatorId === oldId) i.creatorId = auth.userId;
          });
          db.comments.forEach(c => {
            if (c.userId === oldId) c.userId = auth.userId;
          });
          db.users = db.users.filter(u => u.id !== oldId);
        }

        activeUser.email = email;
        writeDb(db);
      }
    }
  }

  // Sync name changes from Clerk claims to local database (if claims are present)
  const claims = auth.sessionClaims;
  if (activeUser && claims?.name && activeUser.name !== claims.name) {
    console.log(`Syncing name change from Clerk: ${activeUser.name} -> ${claims.name}`);
    activeUser.name = claims.name;
    activeUser.avatar = getInitials(claims.name);
    writeDb(db);
  }

  req.user = activeUser;
  next();
}

// ---------------- API Routes ----------------

// Fetch authenticated profile info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar } });
});

// Users list (teammates dropdown populate)
app.get('/api/users', authenticateToken, (req, res) => {
  const db = readDb();
  const safeUsers = db.users.map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar }));
  res.json({ users: safeUsers });
});

// Workspaces
app.get('/api/workspaces', authenticateToken, (req, res) => {
  const db = readDb();
  const membershipIds = db.workspaceMembers
    .filter(m => m.userId === req.user.id)
    .map(m => m.workspaceId);

  const list = db.workspaces.filter(w => membershipIds.includes(w.id));
  res.json({ workspaces: list });
});

app.get('/api/workspaces/explore', authenticateToken, (req, res) => {
  const db = readDb();
  const memberWorkspaceIds = db.workspaceMembers
    .filter(m => m.userId === req.user.id)
    .map(m => m.workspaceId);

  const exploreList = db.workspaces.filter(w => !memberWorkspaceIds.includes(w.id));
  res.json({ workspaces: exploreList });
});

app.post('/api/workspaces/:id/join', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const ws = db.workspaces.find(w => w.id === id);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  const isAlreadyMember = db.workspaceMembers.some(
    m => m.workspaceId === ws.id && m.userId === req.user.id
  );

  if (isAlreadyMember) {
    return res.status(400).json({ error: "You are already a member of this workspace" });
  }

  db.workspaceMembers.push({
    workspaceId: ws.id,
    userId: req.user.id,
    role: "member"
  });

  writeDb(db);
  res.json({ workspace: ws });
});

app.post('/api/workspaces', authenticateToken, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Workspace name is required" });

  const db = readDb();
  const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
  
  if (db.workspaces.some(w => w.slug === slug)) {
    return res.status(400).json({ error: "A workspace with this name or slug already exists" });
  }

  const newWorkspace = {
    id: crypto.randomUUID(),
    name: name.trim(),
    slug,
    createdAt: new Date().toISOString()
  };

  db.workspaces.push(newWorkspace);
  db.workspaceMembers.push({
    workspaceId: newWorkspace.id,
    userId: req.user.id,
    role: "admin"
  });

  writeDb(db);
  res.json({ workspace: newWorkspace });
});

app.get('/api/workspaces/:slug/members', authenticateToken, (req, res) => {
  const { slug } = req.params;
  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  const memberIds = db.workspaceMembers
    .filter(m => m.workspaceId === ws.id)
    .map(m => m.userId);

  const members = db.users
    .filter(u => memberIds.includes(u.id))
    .map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar }));

  res.json({ members });
});

app.post('/api/workspaces/:slug/members', authenticateToken, (req, res) => {
  const { slug } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Member email is required" });

  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  const targetUser = db.users.find(u => u.email === email.toLowerCase().trim());
  if (!targetUser) return res.status(404).json({ error: "User not found with this email" });

  const isAlreadyMember = db.workspaceMembers.some(
    m => m.workspaceId === ws.id && m.userId === targetUser.id
  );

  if (isAlreadyMember) {
    return res.status(400).json({ error: "User is already a member of this workspace" });
  }

  db.workspaceMembers.push({
    workspaceId: ws.id,
    userId: targetUser.id,
    role: "member"
  });

  writeDb(db);
  res.json({ member: { id: targetUser.id, name: targetUser.name, email: targetUser.email, avatar: targetUser.avatar } });
});

app.delete('/api/workspaces/:slug/members/:userId', authenticateToken, (req, res) => {
  const { slug, userId } = req.params;
  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  // Cannot remove yourself
  if (userId === req.user.id) {
    return res.status(400).json({ error: "You cannot remove yourself from the workspace" });
  }

  // Check if the target is an admin (prevent removing workspace creator/admin)
  const targetMembership = db.workspaceMembers.find(
    m => m.workspaceId === ws.id && m.userId === userId
  );
  if (!targetMembership) {
    return res.status(404).json({ error: "User is not a member of this workspace" });
  }
  if (targetMembership.role === "admin") {
    return res.status(403).json({ error: "Cannot remove a workspace admin" });
  }

  // Remove from workspace members
  db.workspaceMembers = db.workspaceMembers.filter(
    m => !(m.workspaceId === ws.id && m.userId === userId)
  );

  // Also remove from all projects in this workspace
  const workspaceProjectIds = db.projects
    .filter(p => p.workspaceId === ws.id)
    .map(p => p.id);

  if (db.projectMembers) {
    db.projectMembers = db.projectMembers.filter(
      pm => !(workspaceProjectIds.includes(pm.projectId) && pm.userId === userId)
    );
  }

  writeDb(db);
  res.json({ success: true });
});

// Projects
app.get('/api/workspaces/:slug/projects', authenticateToken, (req, res) => {
  const { slug } = req.params;
  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  const memberProjectIds = (db.projectMembers || [])
    .filter(pm => pm.userId === req.user.id)
    .map(pm => pm.projectId);

  const projects = db.projects.filter(p => 
    p.workspaceId === ws.id && 
    (p.creatorId === req.user.id || memberProjectIds.includes(p.id))
  );
  res.json({ projects });
});

app.post('/api/workspaces/:slug/projects', authenticateToken, (req, res) => {
  const { slug } = req.params;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  const newProject = {
    id: crypto.randomUUID(),
    workspaceId: ws.id,
    name: name.trim(),
    description: description ? description.trim() : "",
    creatorId: req.user.id,
    createdAt: new Date().toISOString()
  };

  db.projects.push(newProject);
  
  if (!db.projectMembers) db.projectMembers = [];
  db.projectMembers.push({
    projectId: newProject.id,
    userId: req.user.id,
    role: "Lead"
  });

  writeDb(db);
  res.json({ project: newProject });
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.projects = db.projects.filter(p => p.id !== id);
  db.issues = db.issues.filter(i => i.projectId !== id); // Cascade delete issues
  db.projectMembers = (db.projectMembers || []).filter(pm => pm.projectId !== id); // Cascade delete memberships
  writeDb(db);
  res.json({ success: true });
});

// Project Members
app.get('/api/projects/:id/members', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const projectMembersForProject = (db.projectMembers || []).filter(pm => pm.projectId === id);
  const memberIds = projectMembersForProject.map(pm => pm.userId);

  const members = db.users
    .filter(u => memberIds.includes(u.id))
    .map(u => {
      const pm = projectMembersForProject.find(pMember => pMember.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        isPending: false,
        role: pm ? pm.role || "Member" : "Member"
      };
    });

  // Fetch pending invitations
  const pendingInvs = (db.projectInvitations || [])
    .filter(inv => inv.projectId === id && inv.status === 'pending');

  const pendingMembers = pendingInvs.map(inv => {
    const placeholderUser = db.users.find(u => u.email === inv.email);
    return {
      id: placeholderUser?.id || `invited-temp-${inv.id}`,
      name: placeholderUser?.name || inv.email.split('@')[0],
      email: inv.email,
      avatar: "I",
      isPending: true,
      role: inv.role || "Member"
    };
  });

  res.json({ members: [...members, ...pendingMembers], creatorId: project.creatorId });
});

app.post('/api/projects/:id/members', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Member email is required" });

  const db = readDb();
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // Only project creator can invite/add members
  if (project.creatorId !== req.user.id) {
    return res.status(403).json({ error: "Only the project creator can invite others to join this project" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const assignedRole = role || "Member";

  // If already a project member
  let targetUser = db.users.find(u => u.email === cleanEmail);
  if (targetUser) {
    const isProjectMember = (db.projectMembers || []).some(
      pm => pm.projectId === id && pm.userId === targetUser.id
    );
    if (isProjectMember) {
      return res.status(400).json({ error: "User is already a member of this project" });
    }
  }

  // If invitation already pending
  if (!db.projectInvitations) db.projectInvitations = [];
  const existingInv = db.projectInvitations.find(
    inv => inv.projectId === id && inv.email === cleanEmail && inv.status === 'pending'
  );
  if (existingInv) {
    return res.status(400).json({ error: "An invitation has already been sent to this user" });
  }

  // Create placeholder user if they don't exist
  if (!targetUser) {
    const name = cleanEmail.split('@')[0];
    targetUser = {
      id: "invited-" + crypto.randomUUID(),
      name: name,
      email: cleanEmail,
      passwordHash: 'clerk-managed',
      avatar: "I"
    };
    db.users.push(targetUser);
  }

  // Create invitation
  const newInvitation = {
    id: crypto.randomUUID(),
    projectId: id,
    workspaceId: project.workspaceId,
    email: cleanEmail,
    status: 'pending',
    invitedBy: req.user.id,
    role: assignedRole,
    createdAt: new Date().toISOString()
  };
  db.projectInvitations.push(newInvitation);

  writeDb(db);
  res.json({ 
    message: "Invitation sent successfully", 
    member: {
      id: targetUser.id,
      name: targetUser.name,
      email: cleanEmail,
      avatar: "I",
      isPending: true,
      role: assignedRole
    }
  });
});

app.delete('/api/projects/:id/members/:userId', authenticateToken, (req, res) => {
  const { id, userId } = req.params;
  const db = readDb();
  
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // Only project creator can remove members
  if (project.creatorId !== req.user.id) {
    return res.status(403).json({ error: "Only the project creator can remove members from this project" });
  }

  // Prevent creator from removing themselves
  if (project.creatorId === userId) {
    return res.status(400).json({ error: "The project creator cannot be removed from the project" });
  }

  // Remove from projectMembers
  if (db.projectMembers) {
    db.projectMembers = db.projectMembers.filter(
      pm => !(pm.projectId === id && pm.userId === userId)
    );
  }

  // Also decline/remove any pending invitations for this user's email if they haven't accepted yet
  const targetUser = db.users.find(u => u.id === userId);
  if (targetUser && db.projectInvitations) {
    db.projectInvitations = db.projectInvitations.filter(
      inv => !(inv.projectId === id && inv.email === targetUser.email.toLowerCase().trim())
    );
  }

  writeDb(db);
  res.json({ success: true });
});

app.put('/api/projects/:id/members/:userId/role', authenticateToken, (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: "Role is required" });

  const db = readDb();
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // Only project creator can assign roles
  if (project.creatorId !== req.user.id) {
    return res.status(403).json({ error: "Only the project creator can assign member roles" });
  }

  // Find membership
  if (!db.projectMembers) db.projectMembers = [];
  const membership = db.projectMembers.find(pm => pm.projectId === id && pm.userId === userId);
  if (!membership) return res.status(404).json({ error: "Member not found in project" });

  membership.role = role;
  writeDb(db);
  res.json({ success: true, role });
});

app.get('/api/projects/:id/activity', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // Verify access
  const isMember = project.creatorId === req.user.id ||
    (db.projectMembers || []).some(pm => pm.projectId === id && pm.userId === req.user.id);
  if (!isMember) {
    return res.status(403).json({ error: "You are not a member of this project" });
  }

  const activities = (db.projectActivities || [])
    .filter(act => act.projectId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ activities });
});

// Personal Todos inside a Project
app.get('/api/projects/:id/todos', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.personalTodos) db.personalTodos = [];
  const todos = db.personalTodos.filter(t => t.projectId === id && t.userId === req.user.id);
  res.json({ todos });
});

app.post('/api/projects/:id/todos', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const db = readDb();
  if (!db.personalTodos) db.personalTodos = [];
  const newTodo = {
    id: crypto.randomUUID(),
    projectId: id,
    userId: req.user.id,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  db.personalTodos.push(newTodo);
  writeDb(db);
  res.json({ todo: newTodo });
});

app.put('/api/projects/:id/todos/:todoId', authenticateToken, (req, res) => {
  const { todoId } = req.params;
  const { completed } = req.body;
  if (completed === undefined) return res.status(400).json({ error: "completed status is required" });

  const db = readDb();
  if (!db.personalTodos) db.personalTodos = [];
  const todo = db.personalTodos.find(t => t.id === todoId && t.userId === req.user.id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });

  todo.completed = completed;
  writeDb(db);
  res.json({ success: true, todo });
});

app.delete('/api/projects/:id/todos/:todoId', authenticateToken, (req, res) => {
  const { todoId } = req.params;
  const db = readDb();
  if (!db.personalTodos) db.personalTodos = [];
  const todoIdx = db.personalTodos.findIndex(t => t.id === todoId && t.userId === req.user.id);
  if (todoIdx === -1) return res.status(404).json({ error: "Todo not found" });

  db.personalTodos.splice(todoIdx, 1);
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/users/sync', authenticateToken, (req, res) => {
  const { name, username, avatar, email } = req.body;
  const db = readDb();
  let user = db.users.find(u => u.id === req.user.id);
  if (user) {
    let modified = false;
    if (name !== undefined && user.name !== name) {
      user.name = name;
      modified = true;
    }
    if (username !== undefined && user.username !== username) {
      user.username = username;
      modified = true;
    }
    if (avatar !== undefined && user.avatar !== avatar) {
      user.avatar = avatar;
      modified = true;
    }
    if (email && email.toLowerCase().trim() !== user.email) {
      const cleanEmail = email.toLowerCase().trim();
      
      // Migrate placeholder user if one exists with this email
      const placeholderUser = db.users.find(u => u.email === cleanEmail && u.id.startsWith("invited-"));
      if (placeholderUser) {
        console.log(`POST /api/users/sync: Migrating placeholder user ${placeholderUser.id} to Clerk ID ${req.user.id}`);
        const oldId = placeholderUser.id;
        
        db.workspaceMembers.forEach(m => {
          if (m.userId === oldId) m.userId = req.user.id;
        });
        if (db.projectMembers) {
          db.projectMembers.forEach(pm => {
            if (pm.userId === oldId) pm.userId = req.user.id;
          });
        }
        db.issues.forEach(i => {
          if (i.assigneeId === oldId) i.assigneeId = req.user.id;
          if (i.creatorId === oldId) i.creatorId = req.user.id;
        });
        db.comments.forEach(c => {
          if (c.userId === oldId) c.userId = req.user.id;
        });
        db.users = db.users.filter(u => u.id !== oldId);
      }
      
      user.email = cleanEmail;
      modified = true;
    }
    if (modified) {
      writeDb(db);
    }
  }
  res.json({ success: true, user });
});

// Project Invitations Management
app.get('/api/invitations', authenticateToken, (req, res) => {
  const db = readDb();
  const userEmail = req.user.email.toLowerCase().trim();
  
  if (!db.projectInvitations) db.projectInvitations = [];
  const pending = db.projectInvitations.filter(
    inv => inv.email === userEmail && inv.status === 'pending'
  );
  
  const detailed = pending.map(inv => {
    const proj = db.projects.find(p => p.id === inv.projectId);
    const ws = db.workspaces.find(w => w.id === inv.workspaceId);
    const inviter = db.users.find(u => u.id === inv.invitedBy);
    return {
      id: inv.id,
      projectId: inv.projectId,
      workspaceId: inv.workspaceId,
      projectName: proj?.name || "Unknown Project",
      workspaceName: ws?.name || "Unknown Workspace",
      inviterName: inviter?.name || "A teammate",
      createdAt: inv.createdAt
    };
  });
  res.json({ invitations: detailed });
});

app.post('/api/invitations/:id/accept', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.projectInvitations) db.projectInvitations = [];
  
  const invIdx = db.projectInvitations.findIndex(inv => inv.id === id);
  if (invIdx === -1) return res.status(404).json({ error: "Invitation not found" });
  
  const invitation = db.projectInvitations[invIdx];
  if (invitation.email !== req.user.email.toLowerCase().trim()) {
    return res.status(403).json({ error: "This invitation was sent to a different email address" });
  }

  invitation.status = 'accepted';

  // Ensure they are in the workspace
  const isWorkspaceMember = db.workspaceMembers.some(
    m => m.workspaceId === invitation.workspaceId && m.userId === req.user.id
  );
  if (!isWorkspaceMember) {
    db.workspaceMembers.push({
      workspaceId: invitation.workspaceId,
      userId: req.user.id,
      role: "member"
    });
  }

  // Ensure they are in the project
  if (!db.projectMembers) db.projectMembers = [];
  const isProjectMember = db.projectMembers.some(
    pm => pm.projectId === invitation.projectId && pm.userId === req.user.id
  );
  if (!isProjectMember) {
    db.projectMembers.push({
      projectId: invitation.projectId,
      userId: req.user.id,
      role: invitation.role || "Member"
    });
  }

  writeDb(db);
  res.json({ success: true });
});

app.post('/api/invitations/:id/decline', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.projectInvitations) db.projectInvitations = [];
  
  const invIdx = db.projectInvitations.findIndex(inv => inv.id === id);
  if (invIdx === -1) return res.status(404).json({ error: "Invitation not found" });
  
  const invitation = db.projectInvitations[invIdx];
  if (invitation.email !== req.user.email.toLowerCase().trim()) {
    return res.status(403).json({ error: "This invitation was sent to a different email address" });
  }

  invitation.status = 'declined';
  writeDb(db);
  res.json({ success: true });
});

// Issues
app.get('/api/workspaces/:slug/issues', authenticateToken, (req, res) => {
  const { slug } = req.params;
  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  // Only return issues from projects the user is a member of
  const memberProjectIds = (db.projectMembers || [])
    .filter(pm => pm.userId === req.user.id)
    .map(pm => pm.projectId);

  const allowedProjectIds = db.projects
    .filter(p => p.workspaceId === ws.id && (p.creatorId === req.user.id || memberProjectIds.includes(p.id)))
    .map(p => p.id);

  const issues = db.issues.filter(i => i.workspaceId === ws.id && allowedProjectIds.includes(i.projectId));
  res.json({ issues });
});

app.post('/api/workspaces/:slug/issues', authenticateToken, (req, res) => {
  const { slug } = req.params;
  const { 
    projectId, title, description, status, priority, assigneeId,
    type, bugSeverity, bugEnv, featureScope, storyPoints, tags
  } = req.body;

  if (!title) return res.status(400).json({ error: "Issue title is required" });

  const db = readDb();
  const ws = db.workspaces.find(w => w.slug === slug);
  if (!ws) return res.status(404).json({ error: "Workspace not found" });

  const targetProjectId = projectId || (db.projects.find(p => p.workspaceId === ws.id)?.id || "default-project");
  const project = db.projects.find(p => p.id === targetProjectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // Verify creator is a member of the project
  const isCreatorProjMember = project.creatorId === req.user.id || 
    (db.projectMembers || []).some(pm => pm.projectId === targetProjectId && pm.userId === req.user.id);
  if (!isCreatorProjMember) {
    return res.status(403).json({ error: "You are not a member of this project" });
  }

  // Verify assignee (if provided) is a member of the project
  const finalAssigneeId = assigneeId || req.user.id;
  const isAssigneeProjMember = project.creatorId === finalAssigneeId || 
    (db.projectMembers || []).some(pm => pm.projectId === targetProjectId && pm.userId === finalAssigneeId);
  if (!isAssigneeProjMember) {
    return res.status(400).json({ error: "Assignee must be a member of the project" });
  }

  const workspaceIssues = db.issues.filter(i => i.workspaceId === ws.id);
  const nextNumber = workspaceIssues.length > 0 
    ? Math.max(...workspaceIssues.map(i => Number(i.id.split('-')[1]) || 0)) + 1
    : 1;

  const prefix = ws.name.slice(0, 2).toUpperCase().replace(/[^\w]/g, 'BB');
  const issueId = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

  const newIssue = {
    id: issueId,
    projectId: targetProjectId,
    workspaceId: ws.id,
    title: title.trim(),
    description: description ? description.trim() : "",
    status: status || "todo",
    priority: priority || "medium",
    assigneeId: finalAssigneeId,
    creatorId: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: type || "bug",
    bugSeverity: bugSeverity || undefined,
    bugEnv: bugEnv || undefined,
    featureScope: featureScope || undefined,
    storyPoints: storyPoints || undefined,
    tags: tags || []
  };

  db.issues.push(newIssue);
  logProjectActivity(db, targetProjectId, req.user.id, `created issue ${issueId}`);
  writeDb(db);
  res.json({ issue: newIssue });
});

app.put('/api/issues/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const patch = req.body;

  const db = readDb();
  const idx = db.issues.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Issue not found" });

  const issue = db.issues[idx];
  const targetProjectId = patch.projectId || issue.projectId;
  const project = db.projects.find(p => p.id === targetProjectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // Verify caller has access to the project
  const isCallerMember = project.creatorId === req.user.id ||
    (db.projectMembers || []).some(pm => pm.projectId === targetProjectId && pm.userId === req.user.id);
  if (!isCallerMember) {
    return res.status(403).json({ error: "You are not a member of this project" });
  }

  // If assigneeId is being updated, verify they are a member of the project
  if (patch.assigneeId) {
    const isAssigneeMember = project.creatorId === patch.assigneeId ||
      (db.projectMembers || []).some(pm => pm.projectId === targetProjectId && pm.userId === patch.assigneeId);
    if (!isAssigneeMember) {
      return res.status(400).json({ error: "Assignee must be a member of the project" });
    }
  }

  const oldIssue = db.issues[idx];
  const updatedIssue = {
    ...oldIssue,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  if (patch.type && patch.type !== oldIssue.type) {
    if (patch.type === "bug") {
      updatedIssue.featureScope = undefined;
      updatedIssue.storyPoints = undefined;
    } else {
      updatedIssue.bugSeverity = undefined;
      updatedIssue.bugEnv = undefined;
    }
  }

  if (patch.status && patch.status !== oldIssue.status) {
    const statusLabels = {
      todo: "Todo",
      "in-progress": "In Progress",
      review: "Review",
      done: "Done"
    };
    const actMsg = patch.status === 'done'
      ? `completed issue ${id}`
      : `moved issue ${id} to ${statusLabels[patch.status] || patch.status}`;
    logProjectActivity(db, targetProjectId, req.user.id, actMsg);
  }

  db.issues[idx] = updatedIssue;
  writeDb(db);
  res.json({ issue: updatedIssue });
});

app.delete('/api/issues/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.issues = db.issues.filter(i => i.id !== id);
  db.comments = db.comments.filter(c => c.issueId !== id); // Cascade delete comments
  writeDb(db);
  res.json({ success: true });
});

// Comments
app.get('/api/issues/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const comments = db.comments.filter(c => c.issueId === id);
  res.json({ comments });
});

app.post('/api/issues/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Comment content is required" });

  const db = readDb();
  const newComment = {
    id: crypto.randomUUID(),
    issueId: id,
    userId: req.user.id,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  writeDb(db);
  res.json({ comment: newComment });
});

app.delete('/api/comments/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const db = readDb();

  const comment = db.comments.find(c => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  const issue = db.issues.find(i => i.id === comment.issueId);
  if (!issue) {
    if (comment.userId === req.user.id) {
      db.comments = db.comments.filter(c => c.id !== commentId);
      writeDb(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Associated issue not found" });
  }

  const project = db.projects.find(p => p.id === issue.projectId);
  if (!project) {
    if (comment.userId === req.user.id) {
      db.comments = db.comments.filter(c => c.id !== commentId);
      writeDb(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Associated project not found" });
  }

  const isProjectCreator = project.creatorId === req.user.id;
  const isCommentAuthor = comment.userId === req.user.id;

  if (isProjectCreator || isCommentAuthor) {
    db.comments = db.comments.filter(c => c.id !== commentId);
    writeDb(db);
    return res.json({ success: true });
  }

  return res.status(403).json({ error: "You do not have permission to delete this comment" });
});

// Public Webhook for Git Integration (GitHub/GitLab)
app.post('/api/webhooks/git', (req, res) => {
  const event = req.headers['x-github-event'] || 'push';
  const db = readDb();
  const logs = [];
  const updatedIssues = [];

  const issueRegex = /\b([A-Z]{2,}-\d+)\b/gi;
  const fixKeywords = /\b(fix|fixes|fixed|resolve|resolves|resolved|close|closes|closed)\b/i;

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
        const idx = db.issues.findIndex(i => i.id === issueId);
        if (idx === -1) {
          logs.push(`Issue ${issueId} not found in database.`);
          continue;
        }

        const issue = db.issues[idx];
        const isFix = fixKeywords.test(message);
        const newStatus = isFix ? 'done' : 'in-progress';
        const oldStatus = issue.status;

        if (oldStatus !== newStatus) {
          issue.status = newStatus;
          issue.updatedAt = new Date().toISOString();
          updatedIssues.push({ id: issueId, oldStatus, newStatus });

          const statusLabels = {
            todo: "Todo",
            "in-progress": "In Progress",
            review: "Review",
            done: "Done"
          };
          const actMsg = newStatus === 'done'
            ? `completed issue ${issueId} via git commit`
            : `moved issue ${issueId} to ${statusLabels[newStatus] || newStatus} via git commit`;
          logProjectActivity(db, issue.projectId, null, actMsg, authorName);
        }

        const cleanMessage = message.replace(issueRegex, '').replace(/[\s-:\(\)]*$/, '').trim();
        const content = `💻 **Git Commit** pushed to branch \`${branch}\` by **${authorName}** (\`${shortSha}\`):\n> ${cleanMessage || 'Linked commit'}\n\n[View Commit Details](${commitUrl})`;
        
        const systemComment = {
          id: crypto.randomUUID(),
          issueId: issue.id,
          userId: 'system-git',
          content,
          createdAt: new Date().toISOString()
        };

        if (!db.users.some(u => u.id === 'system-git')) {
          db.users.push({
            id: 'system-git',
            name: 'Git Integration',
            email: 'git@bugbytes.io',
            avatar: 'GP'
          });
        }

        db.comments.push(systemComment);
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
        const idx = db.issues.findIndex(i => i.id === issueId);
        if (idx === -1) {
          logs.push(`Issue ${issueId} not found in database.`);
          continue;
        }

        const issue = db.issues[idx];
        const oldStatus = issue.status;
        let newStatus = oldStatus;
        let content = '';

        if (action === 'opened' || action === 'reopened') {
          newStatus = 'review';
          content = `🔀 **Pull Request #${number}** opened by **${authorName}**:\n> **${title}**\n\n[View Pull Request](${htmlUrl})`;
        } else if (action === 'closed') {
          if (merged) {
            newStatus = 'done';
            content = `✅ **Pull Request #${number}** merged by **${authorName}** - issue marked as Done.\n\n[View Pull Request](${htmlUrl})`;
          } else {
            content = `❌ **Pull Request #${number}** closed without merging by **${authorName}**.\n\n[View Pull Request](${htmlUrl})`;
          }
        }

        if (content) {
          if (oldStatus !== newStatus) {
            issue.status = newStatus;
            issue.updatedAt = new Date().toISOString();
            updatedIssues.push({ id: issueId, oldStatus, newStatus });

            let actMsg = '';
            if (newStatus === 'done') {
              actMsg = `completed issue ${issueId} via merging PR #${number}`;
            } else if (newStatus === 'review') {
              actMsg = `moved issue ${issueId} to Review via opening PR #${number}`;
            } else {
              const statusLabels = {
                todo: "Todo",
                "in-progress": "In Progress",
                review: "Review",
                done: "Done"
              };
              actMsg = `moved issue ${issueId} to ${statusLabels[newStatus] || newStatus} via PR #${number}`;
            }
            logProjectActivity(db, issue.projectId, null, actMsg, authorName);
          }

          if (action === 'closed' && merged) {
            logProjectActivity(db, issue.projectId, null, `merged PR #${number}`, authorName);
          }

          const systemComment = {
            id: crypto.randomUUID(),
            issueId: issue.id,
            userId: 'system-git',
            content,
            createdAt: new Date().toISOString()
          };

          if (!db.users.some(u => u.id === 'system-git')) {
            db.users.push({
              id: 'system-git',
              name: 'Git Integration',
              email: 'git@bugbytes.io',
              avatar: 'GP'
            });
          }

          db.comments.push(systemComment);
          logs.push(`Processed PR #${number} (${action}) for issue ${issueId}: transitioned to ${newStatus}.`);
        }
      }
    }
  } else {
    return res.status(400).json({ error: `Unsupported git event type: ${event}` });
  }

  writeDb(db);
  res.json({ success: true, logs, updatedIssues });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 BugBytes Backend running on http://localhost:${PORT}`);
});
