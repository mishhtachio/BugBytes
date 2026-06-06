import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

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

const mapIssuePriority = (priority) => {
  if (!priority) return 'MEDIUM';
  const p = priority.toUpperCase();
  const validPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  if (validPriority.includes(p)) return p;
  return 'MEDIUM';
};

const mapIssueType = (type) => {
  if (!type) return 'ISSUE';
  const t = type.toUpperCase();
  const validTypes = ['ISSUE', 'BUG', 'FEATURE'];
  if (validTypes.includes(t)) return t;
  return 'ISSUE';
};

const getProjectKey = (name, existingKeys = new Set()) => {
  let key = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (!key || key.length < 2) {
    key = "PROJ";
  }
  let uniqueKey = key;
  let counter = 1;
  while (existingKeys.has(uniqueKey)) {
    counter++;
    uniqueKey = `${key}${counter}`;
  }
  existingKeys.add(uniqueKey);
  return uniqueKey;
};

async function main() {
  const dbPath = path.resolve(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.log(`db.json not found at ${dbPath}, nothing to migrate.`);
    return;
  }

  console.log('Reading db.json...');
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(rawData);

  // Clear existing tables to prevent clashes on reset/new migrations
  console.log('Clearing database tables...');
  await prisma.notification.deleteMany({});
  await prisma.projectActivity.deleteMany({});
  await prisma.personalTodo.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.projectInvitation.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Migrating Users...');
  for (const user of db.users || []) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        username: user.username || null,
      },
    });
  }
  console.log(`Migrated ${db.users?.length || 0} users.`);

  console.log('Migrating Workspaces...');
  for (const ws of db.workspaces || []) {
    const members = db.workspaceMembers?.filter(m => m.workspaceId === ws.id) || [];
    const creatorMember = members.find(m => m.role === 'admin') || members[0];
    const creatorId = creatorMember ? creatorMember.userId : (db.users?.[0]?.id || 'system-git');

    await prisma.workspace.create({
      data: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        isPublic: false,
        creatorId,
        createdAt: ws.createdAt ? new Date(ws.createdAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.workspaces?.length || 0} workspaces.`);

  console.log('Migrating Workspace Members...');
  for (const member of db.workspaceMembers || []) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: member.workspaceId,
        userId: member.userId,
        role: mapWorkspaceRole(member.role),
      },
    });
  }
  console.log(`Migrated ${db.workspaceMembers?.length || 0} workspace members.`);

  console.log('Migrating Projects...');
  const projectKeys = {};
  const usedKeys = new Set();
  for (const p of db.projects || []) {
    const key = getProjectKey(p.name, usedKeys);
    projectKeys[p.id] = key;

    await prisma.project.create({
      data: {
        id: p.id,
        workspaceId: p.workspaceId,
        creatorId: p.creatorId || (db.users?.[0]?.id || 'system-git'),
        name: p.name,
        description: p.description || null,
        key,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.projects?.length || 0} projects.`);

  console.log('Migrating Project Members...');
  for (const member of db.projectMembers || []) {
    await prisma.projectMember.create({
      data: {
        projectId: member.projectId,
        userId: member.userId,
        role: mapProjectRole(member.role),
      },
    });
  }
  console.log(`Migrated ${db.projectMembers?.length || 0} project members.`);

  console.log('Migrating Project Invitations...');
  for (const invitation of db.projectInvitations || []) {
    await prisma.projectInvitation.create({
      data: {
        id: invitation.id,
        projectId: invitation.projectId,
        workspaceId: invitation.workspaceId,
        email: invitation.email,
        invitedBy: invitation.invitedBy,
        role: mapProjectRole(invitation.role),
        status: mapInvitationStatus(invitation.status),
        createdAt: invitation.createdAt ? new Date(invitation.createdAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.projectInvitations?.length || 0} project invitations.`);

  console.log('Pre-mapping Issue IDs project-wise...');
  const issueIdMap = {};
  const projectIssueCounters = {};

  const sortedIssues = [...(db.issues || [])].sort((a, b) => {
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });

  for (const issue of sortedIssues) {
    const projId = issue.projectId;
    const projKey = projectKeys[projId] || 'ISS';

    if (!projectIssueCounters[projId]) {
      projectIssueCounters[projId] = 0;
    }
    projectIssueCounters[projId]++;
    const issueNum = projectIssueCounters[projId];
    
    const newId = `${projKey}-${issueNum}`;
    issueIdMap[issue.id] = { id: newId, number: issueNum };
  }

  console.log('Migrating Issues...');
  for (const issue of db.issues || []) {
    const mapping = issueIdMap[issue.id] || { id: issue.id, number: 1 };

    await prisma.issue.create({
      data: {
        id: mapping.id,
        issueNumber: mapping.number,
        workspaceId: issue.workspaceId,
        projectId: issue.projectId,
        title: issue.title,
        description: issue.description || '',
        status: mapIssueStatus(issue.status),
        priority: mapIssuePriority(issue.priority),
        type: mapIssueType(issue.type),
        assigneeId: issue.assigneeId || null,
        creatorId: issue.creatorId || 'system-git',
        bugSeverity: issue.bugSeverity || null,
        bugEnv: issue.bugEnv || null,
        featureScope: issue.featureScope || null,
        storyPoints: issue.storyPoints ? parseInt(issue.storyPoints, 10) : null,
        tags: issue.tags || [],
        createdAt: issue.createdAt ? new Date(issue.createdAt) : new Date(),
        updatedAt: issue.updatedAt ? new Date(issue.updatedAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.issues?.length || 0} issues.`);

  console.log('Migrating Comments...');
  for (const c of db.comments || []) {
    const mappedIssue = issueIdMap[c.issueId];
    const newIssueId = mappedIssue ? mappedIssue.id : c.issueId;

    let content = c.content || '';
    for (const [oldId, mapped] of Object.entries(issueIdMap)) {
      content = content.replace(new RegExp(oldId, 'g'), mapped.id);
    }

    await prisma.comment.create({
      data: {
        id: c.id,
        issueId: newIssueId,
        userId: c.userId,
        content,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.comments?.length || 0} comments.`);

  console.log('Migrating Personal Todos...');
  for (const t of db.personalTodos || []) {
    await prisma.personalTodo.create({
      data: {
        id: t.id,
        projectId: t.projectId,
        userId: t.userId,
        text: t.text,
        completed: !!t.completed,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.personalTodos?.length || 0} personal todos.`);

  console.log('Migrating Project Activities...');
  for (const act of db.projectActivities || []) {
    let message = act.message || '';
    for (const [oldId, mapped] of Object.entries(issueIdMap)) {
      message = message.replace(new RegExp(oldId, 'g'), mapped.id);
    }

    await prisma.projectActivity.create({
      data: {
        id: act.id,
        projectId: act.projectId,
        userId: act.userId || null,
        userName: act.userName,
        message,
        createdAt: act.createdAt ? new Date(act.createdAt) : new Date(),
      },
    });
  }
  console.log(`Migrated ${db.projectActivities?.length || 0} project activities.`);

  console.log('Data migration complete.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
