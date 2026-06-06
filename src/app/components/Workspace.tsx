import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, LogOut, MessageSquare, Plus, Search, UserRound, Trash2, Folder, List, LayoutGrid, Activity, Globe, Bell, Settings } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useUser, UserProfile } from "@clerk/clerk-react";

type IssueStatus = "todo" | "in-progress" | "review" | "done";
type IssuePriority = "urgent" | "high" | "medium" | "low";
type IssueType = "bug" | "feature";

type WorkspaceType = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type ProjectType = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt: string;
  creatorId?: string;
};

type Issue = {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  type: IssueType;
  bugSeverity?: "critical" | "major" | "minor";
  bugEnv?: "production" | "staging" | "development";
  featureScope?: "epic" | "task" | "improvement";
  storyPoints?: "1pt" | "2pt" | "3pt" | "5pt" | "8pt";
  tags?: string[];
};

type CommentType = {
  id: string;
  issueId: string;
  userId: string;
  content: string;
  createdAt: string;
};

type UserType = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username?: string;
  isPending?: boolean;
  role?: string;
};

type TodoType = {
  id: string;
  projectId: string;
  userId: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

const statusLabels: Record<IssueStatus, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

const priorityColors: Record<IssuePriority, string> = {
  urgent: "#ff3b3b",
  high: "#f5a623",
  medium: "var(--accent-color)",
  low: "#555555",
};

const ACCENT_COLORS = [
  { name: "Cyber Blue", value: "#4d9eff" },
  { name: "Neon Green", value: "#00ff88" },
  { name: "Electric Cyan", value: "#00f0ff" },
  { name: "Hot Pink", value: "#ff007f" },
  { name: "Vibrant Magenta", value: "#d946ef" },
  { name: "Purple Rain", value: "#8b5cf6" },
  { name: "Solar Yellow", value: "#facc15" },
  { name: "Sunset Orange", value: "#ff5e00" }
];

export function Workspace() {
  const { logout, user, apiFetch } = useAuth();

  // Text Size Scaling State
  const [textSize, setTextSize] = useState<"small" | "medium" | "large" | "xl">(() => {
    return (window.localStorage.getItem("bugbytes.text_size") as any) || "small";
  });

  useEffect(() => {
    const scale = textSize === "small" ? 1.15 : textSize === "medium" ? 1.3 : textSize === "large" ? 1.45 : 1.6;
    document.documentElement.style.setProperty("--text-scale", String(scale));
    document.documentElement.style.setProperty("--font-size", `${16 * scale}px`);
  }, [textSize]);

  // Accent Color State
  const [accentColor, setAccentColor] = useState<string>(() => {
    return window.localStorage.getItem("bugbytes.accent_color") || "#4d9eff";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [accentColor]);

  // Sidebar Width States
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = window.localStorage.getItem("bugbytes.left_sidebar_width");
    return saved ? parseInt(saved, 10) : 260;
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = window.localStorage.getItem("bugbytes.right_sidebar_width");
    return saved ? parseInt(saved, 10) : 360;
  });

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(450, startWidth + deltaX));
      setLeftWidth(newWidth);
      window.localStorage.setItem("bugbytes.left_sidebar_width", String(newWidth));
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(260, Math.min(600, startWidth + deltaX));
      setRightWidth(newWidth);
      window.localStorage.setItem("bugbytes.right_sidebar_width", String(newWidth));
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  // Core Data States
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);
  const [activeWs, setActiveWs] = useState<WorkspaceType | null>(null);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [activeProjId, setActiveProjId] = useState<string>("dashboard"); // "dashboard" or project.id
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<UserType[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  // Page View Modes & Onboarding Form states
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Roles, Personal Workspace, and Bug/Feature states
  const [projectTab, setProjectTab] = useState<"board" | "personal" | "activity">("board");
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [personalTodos, setPersonalTodos] = useState<TodoType[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newType, setNewType] = useState<IssueType>("bug");
  const [newProjMemberRole, setNewProjMemberRole] = useState<string>("Member");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showExploreWorkspaces, setShowExploreWorkspaces] = useState(false);
  const [exploreWorkspaces, setExploreWorkspaces] = useState<WorkspaceType[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [projMembers, setProjMembers] = useState<UserType[]>([]);
  const [projCreatorId, setProjCreatorId] = useState<string>("");
  const [newProjMemberEmail, setNewProjMemberEmail] = useState("");

  // Profile Editor States
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // General Settings State
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);


  // Inbox / Invitations States
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInbox, setShowInbox] = useState(false);
  const [activeIssueProjMembers, setActiveIssueProjMembers] = useState<UserType[]>([]);

  // Issues Creation & Filters states
  const [newTitle, setNewTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");
  const [query, setQuery] = useState("");

  // Loading indicator states
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // 1. Initial Load: Workspaces & Users List
  useEffect(() => {
    async function loadInitial() {
      try {
        const wsData = await apiFetch("/api/workspaces");
        setWorkspaces(wsData.workspaces);
        if (wsData.workspaces.length > 0) {
          // Fallback to last active workspace if saved
          const lastActive = window.localStorage.getItem("bugbytes.active_workspace_slug");
          const found = wsData.workspaces.find((w: any) => w.slug === lastActive);
          setActiveWs(found || wsData.workspaces[0]);
        }

        const usersData = await apiFetch("/api/users");
        setAllUsers(usersData.users);
      } catch (err) {
        console.error("Initial load failed:", err);
      }
    }
    loadInitial();
  }, []);

  // 2. Load Workspace Context data on Active Workspace Change
  useEffect(() => {
    if (!activeWs) return;

    window.localStorage.setItem("bugbytes.active_workspace_slug", activeWs.slug);

    async function loadWorkspaceData() {
      setLoadingWorkspace(true);
      try {
        const projsData = await apiFetch(`/api/workspaces/${activeWs.slug}/projects`);
        setProjects(projsData.projects);

        const issuesData = await apiFetch(`/api/workspaces/${activeWs.slug}/issues`);
        setIssues(issuesData.issues);

        const membersData = await apiFetch(`/api/workspaces/${activeWs.slug}/members`);
        setMembers(membersData.members);

        // Reset state
        setActiveProjId("dashboard");
        setSelectedId("");
        setComments([]);
      } catch (err) {
        console.error("Load workspace data failed:", err);
      } finally {
        setLoadingWorkspace(false);
      }
    }
    loadWorkspaceData();
  }, [activeWs]);

  // 3. Load Comments when selected issue changes
  useEffect(() => {
    if (!selectedId) {
      setComments([]);
      return;
    }
    async function loadComments() {
      try {
        const data = await apiFetch(`/api/issues/${selectedId}/comments`);
        setComments(data.comments);
      } catch (err) {
        console.error("Load comments failed:", err);
      }
    }
    loadComments();
  }, [selectedId]);

  // Load Project Members for the selected issue
  useEffect(() => {
    if (!selectedId) {
      setActiveIssueProjMembers([]);
      return;
    }
    const currentIssue = issues.find(i => i.id === selectedId);
    if (!currentIssue) {
      setActiveIssueProjMembers([]);
      return;
    }
    async function loadIssueProjMembers() {
      try {
        const data = await apiFetch(`/api/projects/${currentIssue.projectId}/members`);
        // Only keep members who are not pending
        setActiveIssueProjMembers(data.members.filter((m: any) => !m.isPending));
      } catch (err) {
        console.error("Failed to load issue project members:", err);
      }
    }
    loadIssueProjMembers();
  }, [selectedId, issues]);

  // Action: Create Workspace
  async function handleCreateWorkspace(e: FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const data = await apiFetch("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: newWorkspaceName })
      });
      setWorkspaces(prev => [...prev, data.workspace]);
      setActiveWs(data.workspace);
      setNewWorkspaceName("");
      setShowWorkspaceForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create workspace");
    }
  }

  // Action: Invite Member to Workspace
  async function handleInviteMember(e: FormEvent) {
    e.preventDefault();
    if (!activeWs || !newMemberEmail.trim()) return;
    try {
      const data = await apiFetch(`/api/workspaces/${activeWs.slug}/members`, {
        method: "POST",
        body: JSON.stringify({ email: newMemberEmail })
      });
      setMembers(prev => [...prev, data.member]);
      setNewMemberEmail("");
      setShowMemberForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  // Action: Remove Member from Workspace
  async function handleRemoveWorkspaceMember(userId: string) {
    if (!activeWs) return;
    const member = members.find(m => m.id === userId);
    const memberName = member ? (member.username || member.name) : "this user";
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
      return;
    }
    try {
      await apiFetch(`/api/workspaces/${activeWs.slug}/members/${userId}`, {
        method: "DELETE"
      });
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  // Action: Create Project
  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!activeWs || !newProjectName.trim()) return;
    try {
      const data = await apiFetch(`/api/workspaces/${activeWs.slug}/projects`, {
        method: "POST",
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
      });
      setProjects(prev => [...prev, data.project]);
      setActiveProjId(data.project.id);
      setNewProjectName("");
      setNewProjectDesc("");
      setShowProjectForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  // Action: Delete Project
  async function handleDeleteProject(projectId: string) {
    if (!window.confirm("Are you sure you want to delete this project? All associated issues and comments will also be permanently deleted.")) {
      return;
    }
    try {
      await apiFetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setIssues(prev => prev.filter(i => i.projectId !== projectId));
      if (activeProjId === projectId) {
        setActiveProjId("dashboard");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  // Action: Fetch explore workspaces
  async function handleFetchExploreWorkspaces() {
    setLoadingExplore(true);
    try {
      const data = await apiFetch("/api/workspaces/explore");
      setExploreWorkspaces(data.workspaces);
    } catch (err) {
      console.error("Failed to fetch explore workspaces:", err);
    } finally {
      setLoadingExplore(false);
    }
  }

  // Action: Join Workspace
  async function handleJoinWorkspace(workspaceId: string) {
    try {
      const data = await apiFetch(`/api/workspaces/${workspaceId}/join`, {
        method: "POST"
      });
      setWorkspaces(prev => [...prev, data.workspace]);
      setActiveWs(data.workspace);
      setShowExploreWorkspaces(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join workspace");
    }
  }

  // Helper to fetch Project Activities
  async function fetchProjectActivities() {
    if (activeProjId === "dashboard") return;
    setLoadingActivities(true);
    try {
      const activitiesData = await apiFetch(`/api/projects/${activeProjId}/activity`);
      setActivities(activitiesData.activities || []);
    } catch (err) {
      console.error("Failed to load project activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  }

  // Load Project Members, Personal Todos, and Activities when activeProjId changes
  useEffect(() => {
    if (activeProjId === "dashboard") {
      setProjMembers([]);
      setProjCreatorId("");
      setPersonalTodos([]);
      setActivities([]);
      setProjectTab("board");
      return;
    }

    async function loadProjectDetails() {
      try {
        const membersData = await apiFetch(`/api/projects/${activeProjId}/members`);
        setProjMembers(membersData.members);
        setProjCreatorId(membersData.creatorId);

        const todosData = await apiFetch(`/api/projects/${activeProjId}/todos`);
        setPersonalTodos(todosData.todos || []);

        const activitiesData = await apiFetch(`/api/projects/${activeProjId}/activity`);
        setActivities(activitiesData.activities || []);
      } catch (err) {
        console.error("Failed to load project details:", err);
      }
    }
    loadProjectDetails();
  }, [activeProjId]);

  // Refresh activities when switching to the activity tab
  useEffect(() => {
    if (projectTab === "activity") {
      fetchProjectActivities();
    }
  }, [projectTab]);

  // Action: Invite Member to Project
  async function handleInviteProjMember(e: FormEvent) {
    e.preventDefault();
    if (activeProjId === "dashboard" || !newProjMemberEmail.trim()) return;
    try {
      const data = await apiFetch(`/api/projects/${activeProjId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: newProjMemberEmail, role: newProjMemberRole })
      });
      setProjMembers(prev => [...prev, data.member]);

      setNewProjMemberEmail("");
      setNewProjMemberRole("Member");
      alert(`Success! Invited ${data.member.email} to join the project team as a ${data.member.role}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to invite project member");
    }
  }

  async function handleRemoveProjMember(userId: string) {
    if (activeProjId === "dashboard") return;
    const member = projMembers.find(m => m.id === userId);
    const memberName = member ? member.name : "this user";
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }
    try {
      await apiFetch(`/api/projects/${activeProjId}/members/${userId}`, {
        method: "DELETE"
      });
      setProjMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  // Action: Update Project Member Role
  async function handleUpdateMemberRole(userId: string, role: string) {
    if (activeProjId === "dashboard") return;
    try {
      setProjMembers(prev => prev.map(m => m.id === userId ? { ...m, role } : m));
      await apiFetch(`/api/projects/${activeProjId}/members/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role })
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update member role");
      const data = await apiFetch(`/api/projects/${activeProjId}/members`);
      setProjMembers(data.members);
    }
  }

  // Action: Add Personal Todo
  async function handleAddPersonalTodo(e: FormEvent) {
    e.preventDefault();
    if (activeProjId === "dashboard" || !newTodoText.trim()) return;
    try {
      const data = await apiFetch(`/api/projects/${activeProjId}/todos`, {
        method: "POST",
        body: JSON.stringify({ text: newTodoText })
      });
      setPersonalTodos(prev => [...prev, data.todo]);
      setNewTodoText("");
    } catch (err) {
      console.error("Failed to add personal todo:", err);
    }
  }

  // Action: Toggle Personal Todo
  async function handleTogglePersonalTodo(todoId: string, completed: boolean) {
    if (activeProjId === "dashboard") return;
    try {
      setPersonalTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed } : t));
      await apiFetch(`/api/projects/${activeProjId}/todos/${todoId}`, {
        method: "PUT",
        body: JSON.stringify({ completed })
      });
    } catch (err) {
      console.error("Failed to toggle personal todo:", err);
      const todosData = await apiFetch(`/api/projects/${activeProjId}/todos`);
      setPersonalTodos(todosData.todos || []);
    }
  }

  // Action: Delete Personal Todo
  async function handleDeletePersonalTodo(todoId: string) {
    if (activeProjId === "dashboard") return;
    try {
      setPersonalTodos(prev => prev.filter(t => t.id !== todoId));
      await apiFetch(`/api/projects/${activeProjId}/todos/${todoId}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete personal todo:", err);
      const todosData = await apiFetch(`/api/projects/${activeProjId}/todos`);
      setPersonalTodos(todosData.todos || []);
    }
  }

  const { user: clerkUser } = useUser();

  // Pre-fill profile fields when profile editor opens
  useEffect(() => {
    if (clerkUser) {
      setEditFirstName(clerkUser.firstName || "");
      setEditLastName(clerkUser.lastName || "");
      setEditUsername(clerkUser.username || "");
    }
  }, [clerkUser, showProfileEditor]);

  // Action: Update User Profile via Clerk
  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!clerkUser) return;
    setUpdatingProfile(true);
    try {
      const params: any = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim()
      };
      if (editUsername.trim()) {
        params.username = editUsername.trim();
      }
      await clerkUser.update(params);
      setShowProfileEditor(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      // Catch username configuration or verification errors and fallback to just name update
      const errStr = (err.message || "").toLowerCase();
      const hasVerificationError = errStr.includes("verification") || (err.errors && err.errors.some((e: any) => (e.message || "").toLowerCase().includes("verification")));
      const isUsernameError = 
        errStr.includes("username") ||
        (err.errors && err.errors.some((e: any) => (e.message || "").toLowerCase().includes("username"))) ||
        (err.errors && err.errors.some((e: any) => e.meta && e.meta.paramName === "username"));

      if (isUsernameError || hasVerificationError) {
        try {
          await clerkUser.update({
            firstName: editFirstName.trim(),
            lastName: editLastName.trim()
          });
          setShowProfileEditor(false);
          if (hasVerificationError) {
            alert("Names updated! (Note: Setting a username failed because Clerk requires additional verification. Please set up a password or verify your email/session first.)");
          } else {
            alert("Names updated! (Note: Username configuration is disabled in your Clerk dashboard.)");
          }
          return;
        } catch (subErr) {
          alert(subErr instanceof Error ? subErr.message : "Failed to update profile");
          return;
        }
      }
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  }

  // Fetch pending project invitations
  useEffect(() => {
    async function loadInvitations() {
      try {
        const data = await apiFetch("/api/invitations");
        setInvitations(data.invitations);
      } catch (err) {
        console.error("Failed to load invitations:", err);
      }
    }
    if (user) {
      loadInvitations();
    }
  }, [user]);

  // Action: Accept Invitation
  async function handleAcceptInvitation(invId: string) {
    try {
      await apiFetch(`/api/invitations/${invId}/accept`, {
        method: "POST"
      });
      setInvitations(prev => prev.filter(inv => inv.id !== invId));
      
      // Refresh workspaces to load newly joined workspace
      const wsData = await apiFetch("/api/workspaces");
      setWorkspaces(wsData.workspaces);
      alert("Invitation accepted! You have successfully joined the project team.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  }

  // Action: Decline Invitation
  async function handleDeclineInvitation(invId: string) {
    try {
      await apiFetch(`/api/invitations/${invId}/decline`, {
        method: "POST"
      });
      setInvitations(prev => prev.filter(inv => inv.id !== invId));
      alert("Invitation declined.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to decline invitation");
    }
  }

  // Action: Create Issue
  async function handleCreateIssue(e: FormEvent) {
    e.preventDefault();
    if (!activeWs || !newTitle.trim()) return;
    try {
      const body = {
        title: newTitle,
        projectId: activeProjId !== "dashboard" ? activeProjId : projects[0]?.id || "default-project",
        status: "todo",
        priority: "medium",
        assigneeId: user?.id,
        type: newType
      };
      const data = await apiFetch(`/api/workspaces/${activeWs.slug}/issues`, {
        method: "POST",
        body: JSON.stringify(body)
      });
      setIssues(prev => [data.issue, ...prev]);
      setSelectedId(data.issue.id);
      setNewTitle("");
      fetchProjectActivities();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create issue");
    }
  }

  // Action: Update Issue attributes
  async function handleUpdateIssue(id: string, patch: Partial<Issue>) {
    // Ask for confirmation when marking issue done
    if (patch.status === "done") {
      const confirmed = window.confirm("Are you sure you want to mark this issue as done?");
      if (!confirmed) return;
    }

    // Update local state first for instant response
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    try {
      await apiFetch(`/api/issues/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch)
      });
      fetchProjectActivities();
    } catch (err) {
      console.error("Failed to sync issue update to backend:", err);
    }
  }

  // Action: Delete Issue
  async function handleDeleteIssue(id: string) {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    setIssues(prev => prev.filter(i => i.id !== id));
    setSelectedId("");
    try {
      await apiFetch(`/api/issues/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete issue on backend:", err);
    }
  }

  // Action: Add Comment
  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !commentText.trim()) return;
    try {
      const data = await apiFetch(`/api/issues/${selectedId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText })
      });
      setComments(prev => [...prev, data.comment]);
      setCommentText("");
    } catch (err) {
      console.error("Add comment failed:", err);
    }
  }

  // Action: Delete Comment
  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await apiFetch(`/api/comments/${commentId}`, {
        method: "DELETE"
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Delete comment failed:", err);
    }
  }

  // Active Project Context
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === activeProjId) || null;
  }, [projects, activeProjId]);

  // Filter Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // If we are in project view, filter issues belonging to this project
      const matchesProject = activeProjId === "dashboard" || issue.projectId === activeProjId;
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === "all" || issue.assigneeId === assigneeFilter;

      const titleMatch = issue.title.toLowerCase().includes(query.toLowerCase());
      const descMatch = issue.description.toLowerCase().includes(query.toLowerCase());
      const idMatch = issue.id.toLowerCase().includes(query.toLowerCase());

      return matchesProject && matchesStatus && matchesPriority && matchesAssignee && (titleMatch || descMatch || idMatch);
    });
  }, [issues, query, activeProjId, statusFilter, priorityFilter, assigneeFilter]);

  // Selected Issue Context
  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedId) || null;
  }, [issues, selectedId]);

  // Dashboard Stats Calculations
  const dashboardStats = useMemo(() => {
    const active = issues.filter(i => i.status !== "done").length;
    const completed = issues.filter(i => i.status === "done").length;
    const progress = issues.length > 0 ? Math.round((completed / issues.length) * 100) : 0;
    return { active, completed, progress };
  }, [issues]);

  // Dashboard Lists
  const assignedToMeIssues = useMemo(() => {
    return issues.filter(i => i.assigneeId === user?.id && i.status !== "done");
  }, [issues, user]);

  const recentActivityIssues = useMemo(() => {
    return [...issues].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  }, [issues]);

  const myProjIssues = useMemo(() => {
    return issues.filter(i => i.projectId === activeProjId && i.assigneeId === user?.id);
  }, [issues, activeProjId, user]);

  const myCompletedIssues = useMemo(() => {
    return myProjIssues.filter(i => i.status === "done").length;
  }, [myProjIssues]);

  const myInProgressIssues = useMemo(() => {
    return myProjIssues.filter(i => i.status === "in-progress").length;
  }, [myProjIssues]);

  const completionProgress = useMemo(() => {
    return myProjIssues.length > 0 ? Math.round((myCompletedIssues / myProjIssues.length) * 100) : 0;
  }, [myProjIssues, myCompletedIssues]);

  // Render Workspace Onboarding if workspaces list is completely empty
  if (workspaces.length === 0 && !loadingWorkspace) {
    return (
      <main style={{ minHeight: "100vh", background: "#080808", color: "#f2f2f2", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: "460px", width: "100%", border: "1px solid #222222", background: "#0d0d0d", padding: "2.5rem", borderRadius: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.03em" }}>
              <span style={{ width: 9, height: 9, background: "var(--accent-color)", borderRadius: "50%" }} />
              BUGBYTES
            </div>
            <button type="button" onClick={logout} title="Sign out" style={{ background: "transparent", border: "1px solid #222222", color: "#999999", padding: "0.3rem 0.6rem", fontSize: "calc(10px * var(--text-scale))", cursor: "pointer", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LogOut size={12} /> SIGN OUT
            </button>
          </div>

          <h2 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(1.5rem * var(--text-scale))", color: "#f2f2f2", margin: "0 0 0.5rem 0", textTransform: "uppercase", letterSpacing: "-0.03em" }}>GET STARTED</h2>
          <p style={{ color: "#999999", fontSize: "calc(13px * var(--text-scale))", lineHeight: "1.7", margin: "0 0 1.5rem 0" }}>
            Create a new workspace for your team, or explore and join an existing one.
          </p>

          {/* Create Workspace */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "var(--accent-color)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Create New Workspace</div>
            <form onSubmit={handleCreateWorkspace} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input 
                value={newWorkspaceName} 
                onChange={e => setNewWorkspaceName(e.target.value)} 
                placeholder="Workspace Name (e.g. Acme Tech, Squad 4)" 
                required
                style={{ width: "100%", background: "#111111", border: "1px solid #222222", color: "#f2f2f2", padding: "0.85rem", outline: "none", fontSize: "calc(13px * var(--text-scale))" }}
              />
              <button type="submit" style={{ width: "100%", background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.85rem", fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(11px * var(--text-scale))", letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase" }}>
                Create Workspace
              </button>
            </form>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: 1, background: "#222" }} />
            <span style={{ color: "#555", fontSize: "calc(10px * var(--text-scale))", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#222" }} />
          </div>

          {/* Explore & Join */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (!showExploreWorkspaces) handleFetchExploreWorkspaces();
                setShowExploreWorkspaces(!showExploreWorkspaces);
              }}
              style={{ width: "100%", background: "transparent", border: "1px solid #222222", color: "#cccccc", padding: "0.85rem", fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: "calc(11px * var(--text-scale))", letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-color)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#222222"; e.currentTarget.style.color = "#cccccc"; }}
            >
              <Globe size={14} /> Explore & Join a Workspace
            </button>

            {showExploreWorkspaces && (
              <div style={{ marginTop: "0.75rem", border: "1px solid #222", background: "#111", padding: "0.75rem", maxHeight: "200px", overflowY: "auto" }}>
                {loadingExplore ? (
                  <div style={{ color: "var(--accent-color)", fontSize: "calc(11px * var(--text-scale))", textAlign: "center", padding: "1rem", fontFamily: "monospace" }}>Loading workspaces...</div>
                ) : exploreWorkspaces.length === 0 ? (
                  <div style={{ color: "#777", fontSize: "calc(12px * var(--text-scale))", textAlign: "center", padding: "0.5rem" }}>No workspaces available to join yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {exploreWorkspaces.map(ws => (
                      <div key={ws.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.6rem", border: "1px solid #222", background: "#0d0d0d" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "calc(12px * var(--text-scale))", fontWeight: "bold", color: "#fff" }}>{ws.name}</span>
                          <span style={{ fontSize: "calc(9px * var(--text-scale))", color: "#777", fontFamily: "monospace" }}>/{ws.slug}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleJoinWorkspace(ws.id)}
                          style={{ background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.3rem 0.6rem", fontSize: "calc(10px * var(--text-scale))", fontWeight: "bold", cursor: "pointer", fontFamily: "'Archivo', sans-serif" }}
                        >
                          JOIN
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "#f2f2f2", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header bar */}
      <header style={{ height: 60, borderBottom: "1px solid #222222", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", background: "#080808", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.03em" }}>
            <span style={{ width: 9, height: 9, background: "var(--accent-color)", borderRadius: "50%" }} />
            BUGBYTES
          </div>

          {/* Workspace Switcher dropdown */}
          {activeWs && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))" }}>/</span>
              <select
                value={activeWs.id}
                onChange={(e) => {
                  const ws = workspaces.find(w => w.id === e.target.value);
                  if (ws) setActiveWs(ws);
                }}
                style={{ background: "#111111", border: "1px solid #222222", color: "#f2f2f2", padding: "0.4rem 0.75rem", fontSize: "calc(12px * var(--text-scale))", outline: "none", cursor: "pointer", fontWeight: 700 }}
              >
                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button 
                type="button" 
                onClick={() => {
                  setShowWorkspaceForm(!showWorkspaceForm);
                  setShowExploreWorkspaces(false);
                  setShowInbox(false);
                  setShowGeneralSettings(false);
                }} 
                title="New workspace"
                style={{ background: "transparent", border: "none", color: showWorkspaceForm ? "var(--accent-color)" : "#555555", cursor: "pointer", display: "grid", placeItems: "center" }}
                onMouseEnter={e => { if (!showWorkspaceForm) e.currentTarget.style.color = "#f2f2f2"; }}
                onMouseLeave={e => { if (!showWorkspaceForm) e.currentTarget.style.color = "#555555"; }}
              >
                <Plus size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowExploreWorkspaces(!showExploreWorkspaces);
                  setShowWorkspaceForm(false);
                  setShowInbox(false);
                  setShowGeneralSettings(false);
                  if (!showExploreWorkspaces) {
                    handleFetchExploreWorkspaces();
                  }
                }} 
                title="Explore and join workspaces"
                style={{ background: "transparent", border: "none", color: showExploreWorkspaces ? "var(--accent-color)" : "#555555", cursor: "pointer", display: "grid", placeItems: "center" }}
                onMouseEnter={e => { if (!showExploreWorkspaces) e.currentTarget.style.color = "#f2f2f2"; }}
                onMouseLeave={e => { if (!showExploreWorkspaces) e.currentTarget.style.color = "#555555"; }}
              >
                <Globe size={14} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Inbox dropdown button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setShowInbox(!showInbox);
                setShowProfileEditor(false);
                setShowWorkspaceForm(false);
                setShowExploreWorkspaces(false);
                setShowGeneralSettings(false);
              }}
              title="Inbox"
              style={{
                background: "transparent",
                border: "1px solid #222222",
                color: invitations.length > 0 ? "var(--accent-color)" : "#999999",
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                position: "relative",
                outline: "none"
              }}
              onMouseEnter={e => { if (invitations.length === 0) e.currentTarget.style.color = "#f2f2f2"; }}
              onMouseLeave={e => { if (invitations.length === 0) e.currentTarget.style.color = "#999999"; }}
            >
              <Bell size={15} />
              {invitations.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#ff3b3b",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: "calc(9px * var(--text-scale))",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: "bold"
                }}>
                  {invitations.length}
                </span>
              )}
            </button>
            {showInbox && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 360,
                background: "#0d0d0d",
                border: "1px solid #222222",
                zIndex: 100,
                maxHeight: 480,
                overflowY: "auto",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
              }}>
                {/* Header */}
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #222222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "var(--accent-color)", letterSpacing: "0.1em", textTransform: "uppercase" }}>INBOX</span>
                  <span style={{ fontSize: "calc(10px * var(--text-scale))", color: "#777777", fontFamily: "'DM Mono', monospace" }}>{invitations.length} notification{invitations.length !== 1 ? "s" : ""}</span>
                </div>
                {/* Invitation items */}
                {invitations.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#555555", fontSize: "calc(12px * var(--text-scale))", fontFamily: "'DM Mono', monospace" }}>All caught up!</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {invitations.map(inv => (
                      <div key={inv.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #1a1a1a", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ fontSize: "calc(12px * var(--text-scale))", color: "#cccccc", lineHeight: "1.5" }}>
                          <span style={{ color: "#ffffff", fontWeight: "bold" }}>{inv.inviterName}</span> invited you to join <strong style={{ color: "var(--accent-color)" }}>{inv.projectName}</strong> in <span style={{ color: "#ffffff" }}>{inv.workspaceName}</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              handleAcceptInvitation(inv.id);
                            }}
                            style={{
                              flex: 1,
                              background: "var(--accent-color)",
                              color: "#080808",
                              border: "none",
                              padding: "0.35rem",
                              fontSize: "calc(10px * var(--text-scale))",
                              fontWeight: "bold",
                              cursor: "pointer",
                              fontFamily: "'Archivo', sans-serif"
                            }}
                          >
                            ACCEPT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDeclineInvitation(inv.id);
                            }}
                            style={{
                              flex: 1,
                              background: "transparent",
                              border: "1px solid #333333",
                              color: "#999999",
                              padding: "0.35rem",
                              fontSize: "calc(10px * var(--text-scale))",
                              cursor: "pointer",
                              fontFamily: "'Archivo', sans-serif"
                            }}
                          >
                            DECLINE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowProfileEditor(!showProfileEditor);
              setShowWorkspaceForm(false);
              setShowExploreWorkspaces(false);
              setShowInbox(false);
              setShowGeneralSettings(false);
            }}
            title="Edit profile settings"
            style={{ background: "transparent", border: "none", padding: 0, margin: 0, display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", color: "inherit", outline: "none" }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(11px * var(--text-scale))", color: "#999999" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent-color)"} onMouseLeave={e => e.currentTarget.style.color = "#999999"}>{user?.username || user?.name || user?.email}</div>
            <div style={{ width: 30, height: 30, background: "var(--accent-color)", color: "#080808", display: "grid", placeItems: "center", fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(11px * var(--text-scale))" }}>
              {user?.avatar || "U"}
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowGeneralSettings(!showGeneralSettings);
              setShowProfileEditor(false);
              setShowWorkspaceForm(false);
              setShowExploreWorkspaces(false);
              setShowInbox(false);
            }}
            title="General Settings"
            style={{
              background: "transparent",
              border: "1px solid #222222",
              color: "#999999",
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              outline: "none"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#f2f2f2"}
            onMouseLeave={e => e.currentTarget.style.color = "#999999"}
          >
            <Settings size={15} />
          </button>
          <button type="button" onClick={logout} title="Sign out" style={{ background: "transparent", border: "1px solid #222222", color: "#999999", width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer" }}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${rightWidth}px`, minHeight: "calc(100vh - 60px)" }} className="grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* Workspace Sidebar */}
        <aside style={{ position: "relative", borderRight: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Left Sidebar Drag Handle */}
          <div
            onMouseDown={startResizeLeft}
            style={{
              position: "absolute",
              top: 0,
              right: "-4px",
              width: "8px",
              height: "100%",
              cursor: "col-resize",
              zIndex: 50,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          />
          
          {/* Workspace Onboarding Form Modal Inline */}
          {showWorkspaceForm && (
            <div style={{ border: "1px solid #222222", background: "#111111", padding: "1rem", borderRadius: "2px" }}>
              <form onSubmit={handleCreateWorkspace}>
                <div style={{ fontSize: "calc(10px * var(--text-scale))", color: "#999999", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "0.5rem" }}>Create Workspace</div>
                <input 
                  value={newWorkspaceName} 
                  onChange={e => setNewWorkspaceName(e.target.value)} 
                  placeholder="Workspace Name" 
                  style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(12px * var(--text-scale))", outline: "none", marginBottom: "0.5rem" }}
                />
                <button type="submit" style={{ width: "100%", background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.4rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold", cursor: "pointer" }}>CREATE</button>
              </form>
            </div>
          )}

          {/* Explore & Join Workspaces Panel */}
          {showExploreWorkspaces && (
            <div style={{ border: "1px solid #222222", background: "#111111", padding: "1rem", borderRadius: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Join Workspace</span>
                <button type="button" onClick={() => setShowExploreWorkspaces(false)} style={{ background: "transparent", border: "none", color: "#cccccc", fontSize: "calc(9px * var(--text-scale))", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>CLOSE</button>
              </div>
              
              {loadingExplore ? (
                <div style={{ color: "#cccccc", fontSize: "calc(11px * var(--text-scale))", fontFamily: "'DM Mono', monospace" }}>LOADING...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "200px", overflowY: "auto" }}>
                  {exploreWorkspaces.map(ws => (
                    <div key={ws.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem", border: "1px solid #222", background: "#080808" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold", color: "#fff" }}>{ws.name}</span>
                        <span style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace" }}>/{ws.slug}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleJoinWorkspace(ws.id)}
                        style={{ background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.2rem 0.4rem", fontSize: "calc(9px * var(--text-scale))", fontWeight: "bold", cursor: "pointer" }}
                      >
                        JOIN
                      </button>
                    </div>
                  ))}
                  {exploreWorkspaces.length === 0 && (
                    <div style={{ color: "#999999", fontSize: "calc(11px * var(--text-scale))" }}>No other workspaces.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Settings Panel */}
          {showProfileEditor && (
            <div style={{ border: "1px solid #222222", background: "#111111", padding: "1rem", borderRadius: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Edit Profile</span>
                <button type="button" onClick={() => setShowProfileEditor(false)} style={{ background: "transparent", border: "none", color: "#cccccc", fontSize: "calc(9px * var(--text-scale))", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>CLOSE</button>
              </div>
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>First Name</label>
                  <input 
                    value={editFirstName} 
                    onChange={e => setEditFirstName(e.target.value)} 
                    placeholder="First Name" 
                    required
                    style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>Last Name</label>
                  <input 
                    value={editLastName} 
                    onChange={e => setEditLastName(e.target.value)} 
                    placeholder="Last Name" 
                    required
                    style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>Username</label>
                  <input 
                    value={editUsername} 
                    onChange={e => setEditUsername(e.target.value)} 
                    placeholder="username" 
                    style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                  />
                </div>
                <button type="submit" disabled={updatingProfile} style={{ width: "100%", background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.4rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold", cursor: "pointer", marginTop: "0.25rem" }}>
                  {updatingProfile ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </form>
            </div>
          )}

          {/* General Settings Panel */}
          {showGeneralSettings && (
            <div style={{ border: "1px solid #222222", background: "#111111", padding: "1rem", borderRadius: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Settings</span>
                <button type="button" onClick={() => setShowGeneralSettings(false)} style={{ background: "transparent", border: "none", color: "#cccccc", fontSize: "calc(9px * var(--text-scale))", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>CLOSE</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>Text Size</label>
                  <select
                    value={textSize}
                    onChange={(e) => {
                      const newSize = e.target.value as any;
                      setTextSize(newSize);
                      window.localStorage.setItem("bugbytes.text_size", newSize);
                    }}
                    style={{
                      width: "100%",
                      background: "#080808",
                      border: "1px solid #222",
                      color: "#fff",
                      padding: "0.4rem 0.6rem",
                      fontSize: "calc(11px * var(--text-scale))",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="small">Small (Default)</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <label style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>Accent Color</label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setAccentColor(c.value);
                          window.localStorage.setItem("bugbytes.accent_color", c.value);
                        }}
                        title={c.name}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: c.value,
                          border: accentColor === c.value ? "2px solid #ffffff" : "1px solid #222222",
                          cursor: "pointer",
                          outline: "none",
                          padding: 0,
                          margin: 0,
                          transition: "transform 0.1s ease",
                          transform: accentColor === c.value ? "scale(1.15)" : "scale(1)"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Navigation</div>
            <button 
              type="button" 
              onClick={() => setActiveProjId("dashboard")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", border: "none", background: activeProjId === "dashboard" ? "var(--accent-color)" : "transparent", color: activeProjId === "dashboard" ? "#080808" : "#888888", padding: "0.5rem 0.75rem", cursor: "pointer", fontFamily: "'Archivo', sans-serif", fontWeight: activeProjId === "dashboard" ? 800 : 500, fontSize: "calc(12px * var(--text-scale))" }}
            >
              <Activity size={14} /> Dashboard
            </button>
          </div>

          {/* Projects Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Projects</span>
              <button 
                type="button" 
                onClick={() => setShowProjectForm(!showProjectForm)} 
                style={{ background: "transparent", border: "none", color: "#999999", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent-color)"}
                onMouseLeave={e => e.currentTarget.style.color = "#555555"}
              >
                <Plus size={13} />
              </button>
            </div>

            {showProjectForm && (
              <form onSubmit={handleCreateProject} style={{ border: "1px solid #222222", background: "#111111", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  placeholder="Project Name" 
                  required
                  style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                />
                <input 
                  value={newProjectDesc} 
                  onChange={e => setNewProjectDesc(e.target.value)} 
                  placeholder="Description (optional)" 
                  style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                />
                <button type="submit" style={{ background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.35rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold", cursor: "pointer" }}>ADD PROJECT</button>
              </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {projects.map(p => (
                <div 
                  key={p.id}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: activeProjId === p.id ? "var(--accent-color)" : "transparent", color: activeProjId === p.id ? "#080808" : "#888888", paddingRight: "0.75rem" }}
                >
                  <button 
                    type="button"
                    onClick={() => setActiveProjId(p.id)}
                    style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", color: "inherit", padding: "0.5rem 0.75rem", cursor: "pointer", fontFamily: "'Archivo', sans-serif", fontWeight: activeProjId === p.id ? 800 : 500, fontSize: "calc(12px * var(--text-scale))", textAlign: "left" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Folder size={13} /> {p.name}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(9px * var(--text-scale))", marginRight: "0.25rem" }}>
                      {issues.filter(i => i.projectId === p.id).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(p.id);
                    }}
                    title="Delete project"
                    style={{ background: "transparent", border: "none", color: "inherit", opacity: 0.6, cursor: "pointer", display: "grid", placeItems: "center", padding: "2px" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {projects.length === 0 && <div style={{ color: "#777777", fontSize: "calc(11px * var(--text-scale))", padding: "0.5rem" }}>No projects created.</div>}
            </div>
          </div>

          {/* Members List */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Members</span>
              <button 
                type="button" 
                onClick={() => setShowMemberForm(!showMemberForm)} 
                style={{ background: "transparent", border: "none", color: "#999999", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent-color)"}
                onMouseLeave={e => e.currentTarget.style.color = "#555555"}
              >
                <Plus size={13} />
              </button>
            </div>

            {showMemberForm && (
              <form onSubmit={handleInviteMember} style={{ border: "1px solid #222222", background: "#111111", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input 
                  type="email"
                  value={newMemberEmail} 
                  onChange={e => setNewMemberEmail(e.target.value)} 
                  placeholder="Invite user by email" 
                  required
                  style={{ width: "100%", background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                />
                <button type="submit" style={{ background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.35rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold", cursor: "pointer" }}>ADD MEMBER</button>
              </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {members.map(member => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.3rem 0.5rem", border: "1px solid #222", background: "#0d0d0d", color: "#cccccc", fontSize: "calc(12px * var(--text-scale))" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 18, height: 18, background: "#111", border: "1px solid #222", color: "var(--accent-color)", fontSize: "calc(9px * var(--text-scale))", display: "grid", placeItems: "center", fontWeight: "bold" }}>
                      {member.avatar}
                    </div>
                    <span style={{ color: "#fff", fontSize: "calc(11px * var(--text-scale))" }}>{member.username || member.name}</span>
                  </span>
                  {member.id !== user?.id && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkspaceMember(member.id)}
                      title="Remove from workspace"
                      style={{ background: "transparent", border: "none", color: "#ff3b3b", opacity: 0.6, cursor: "pointer", display: "grid", placeItems: "center", padding: "2px" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && <div style={{ color: "#777777", fontSize: "calc(11px * var(--text-scale))", padding: "0.5rem" }}>No members yet.</div>}
            </div>
          </div>
        </aside>

        {/* Central Workspace Panel */}
        <section style={{ minWidth: 0, borderRight: "1px solid #222222" }}>
          
          {loadingWorkspace ? (
            <div style={{ height: "300px", display: "grid", placeItems: "center", color: "var(--accent-color)", fontFamily: "monospace", fontSize: "calc(12px * var(--text-scale))" }}>
              SYNCING WORKSPACE DATA...
            </div>
          ) : activeProjId === "dashboard" ? (
            // ================= DASHBOARD VIEW =================
            <div>
              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid #222222" }}>
                <Metric label="Open Issues" value={String(issues.filter(i => i.status !== "done").length)} />
                <Metric label="In Progress" value={String(issues.filter(i => i.status === "in-progress").length)} />
                <Metric label="Workspace Progress" value={`${dashboardStats.progress}%`} />
              </div>

              <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="grid-cols-1 md:grid-cols-2">
                {/* Left: Assigned to Me */}
                <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem" }}>
                  <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                    Assigned to me ({assignedToMeIssues.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {assignedToMeIssues.map(issue => (
                      <button 
                        key={issue.id}
                        onClick={() => setSelectedId(issue.id)}
                        style={{ width: "100%", border: "none", background: "transparent", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", color: "#cccccc", textAlign: "left", cursor: "pointer", fontSize: "calc(12px * var(--text-scale))" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                        onMouseLeave={e => e.currentTarget.style.color = "#888888"}
                      >
                        <span style={{ fontFamily: "'DM Mono', monospace", color: "#777777", fontSize: "calc(10px * var(--text-scale))" }}>{issue.id}</span>
                        <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{issue.title}</span>
                      </button>
                    ))}
                    {assignedToMeIssues.length === 0 && <div style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))", padding: "0.5rem 0" }}>Workspace clear! No open issues assigned.</div>}
                  </div>
                </div>

                {/* Right: Recent Activity */}
                <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem" }}>
                  <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                    Recent Activity
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {recentActivityIssues.map(issue => (
                      <button 
                        key={issue.id}
                        onClick={() => setSelectedId(issue.id)}
                        style={{ width: "100%", border: "none", background: "transparent", display: "flex", alignItems: "center", gap: "0.6rem", color: "#cccccc", textAlign: "left", cursor: "pointer", fontSize: "calc(12px * var(--text-scale))" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                        onMouseLeave={e => e.currentTarget.style.color = "#888888"}
                      >
                        <span style={{ fontFamily: "'DM Mono', monospace", color: "#777777", fontSize: "calc(10px * var(--text-scale))" }}>{issue.id}</span>
                        <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{issue.title}</span>
                        <span style={{ fontSize: "calc(10px * var(--text-scale))", padding: "0.15rem 0.4rem", background: "#111", color: "var(--accent-color)" }}>{statusLabels[issue.status]}</span>
                      </button>
                    ))}
                    {recentActivityIssues.length === 0 && <div style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))", padding: "0.5rem 0" }}>No updates recorded yet.</div>}
                  </div>
                </div>
              </div>

              {/* Projects Overview */}
              <div style={{ padding: "0 1.5rem 1.5rem" }}>
                <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem" }}>
                  <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                    Workspace Projects
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                    {projects.map(proj => {
                      const projIssues = issues.filter(i => i.projectId === proj.id);
                      const done = projIssues.filter(i => i.status === "done").length;
                      return (
                        <div 
                          key={proj.id} 
                          onClick={() => setActiveProjId(proj.id)}
                          style={{ border: "1px solid #222", background: "#080808", padding: "1rem", cursor: "pointer" }}
                        >
                          <h4 style={{ margin: "0 0 0.5rem 0", color: "#f2f2f2", fontSize: "calc(14px * var(--text-scale))", fontWeight: "700" }}>{proj.name}</h4>
                          <p style={{ margin: "0 0 1rem 0", color: "#999999", fontSize: "calc(11px * var(--text-scale))", minHeight: "34px", overflow: "hidden" }}>{proj.description || "No description provided."}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #111", paddingTop: "0.5rem", fontSize: "calc(10px * var(--text-scale))", fontFamily: "monospace", color: "#cccccc" }}>
                            <span>{projIssues.length} ISSUES</span>
                            <span style={{ color: "var(--accent-color)" }}>{projIssues.length > 0 ? Math.round((done / projIssues.length)*100) : 0}% DONE</span>
                          </div>
                        </div>
                      );
                    })}
                    {projects.length === 0 && <div style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))" }}>No projects registered. Click "+" next to Projects in the sidebar to add.</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ================= PROJECT VIEW =================
            <div>
              {/* Project Title and Stats Header */}
              <div style={{ borderBottom: "1px solid #222222", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(1.5rem * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                    {currentProject?.name}
                  </h2>
                  <p style={{ margin: "0.25rem 0 0", color: "#999999", fontSize: "calc(12px * var(--text-scale))" }}>{currentProject?.description || "No project description."}</p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  {/* Tab Switcher */}
                  <div style={{ display: "flex", border: "1px solid #222222", background: "#111111", padding: "2px" }}>
                    <button 
                      onClick={() => setProjectTab("board")}
                      style={{ background: projectTab === "board" ? "var(--accent-color)" : "transparent", color: projectTab === "board" ? "#080808" : "#888888", border: "none", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold" }}
                    >
                      Project Board
                    </button>
                    <button 
                      onClick={() => setProjectTab("personal")}
                      style={{ background: projectTab === "personal" ? "var(--accent-color)" : "transparent", color: projectTab === "personal" ? "#080808" : "#888888", border: "none", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold" }}
                    >
                      My Workspace
                    </button>
                    <button 
                      onClick={() => setProjectTab("activity")}
                      style={{ background: projectTab === "activity" ? "var(--accent-color)" : "transparent", color: projectTab === "activity" ? "#080808" : "#888888", border: "none", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold" }}
                    >
                      Activity Timeline
                    </button>
                  </div>

                  {/* View Mode Select (List / Kanban) */}
                  {projectTab === "board" && (
                    <div style={{ display: "flex", border: "1px solid #222222", background: "#111111", padding: "2px" }}>
                      <button 
                        onClick={() => setViewMode("list")}
                        style={{ background: viewMode === "list" ? "var(--accent-color)" : "transparent", color: viewMode === "list" ? "#080808" : "#555", border: "none", padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold" }}
                      >
                        <List size={12} /> List
                      </button>
                      <button 
                        onClick={() => setViewMode("kanban")}
                        style={{ background: viewMode === "kanban" ? "var(--accent-color)" : "transparent", color: viewMode === "kanban" ? "#080808" : "#555", border: "none", padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold" }}
                      >
                        <LayoutGrid size={12} /> Kanban
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {projectTab === "personal" ? (
                // ================= MY WORKSPACE (PERSONAL VIEW) =================
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Personal Metrics row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }} className="grid-cols-1 md:grid-cols-3">
                    <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem" }}>
                      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(1.75rem * var(--text-scale))", color: "var(--accent-color)" }}>{myProjIssues.length}</div>
                      <div style={{ marginTop: "0.4rem", color: "#999999", fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", letterSpacing: "0.1em", textTransform: "uppercase" }}>Assigned Issues</div>
                    </div>
                    <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem" }}>
                      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(1.75rem * var(--text-scale))", color: "var(--accent-color)" }}>{myInProgressIssues}</div>
                      <div style={{ marginTop: "0.4rem", color: "#999999", fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", letterSpacing: "0.1em", textTransform: "uppercase" }}>In Progress</div>
                    </div>
                    <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem" }}>
                      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(1.75rem * var(--text-scale))", color: "var(--accent-color)" }}>{completionProgress}%</div>
                      <div style={{ marginTop: "0.4rem", color: "#999999", fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", letterSpacing: "0.1em", textTransform: "uppercase" }}>My Completion Rate</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(11px * var(--text-scale))", textTransform: "uppercase", color: "#f2f2f2", letterSpacing: "0.05em" }}>
                        Task Completion Progress
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "var(--accent-color)" }}>
                        {myCompletedIssues} / {myProjIssues.length} ISSUES DONE
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#111111", border: "1px solid #222222", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${completionProgress}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-color), #8b5cf6)", transition: "width 0.4s ease" }} />
                    </div>
                  </div>

                  {/* Two Column Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="grid-cols-1 lg:grid-cols-2">
                    {/* Left: Assigned Issues */}
                    <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.25rem" }}>
                        My Assigned Issues ({myProjIssues.length})
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto" }}>
                        {myProjIssues.map(issue => (
                          <div 
                            key={issue.id}
                            onClick={() => setSelectedId(issue.id)}
                            style={{ 
                              border: `1px solid ${selectedId === issue.id ? "var(--accent-color)" : "#222222"}`, 
                              background: "#080808", 
                              padding: "0.75rem", 
                              cursor: "pointer", 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: "0.4rem" 
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", color: "#777777", fontSize: "calc(10px * var(--text-scale))" }}>{issue.id}</span>
                              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                <span style={{ 
                                  fontSize: "calc(8px * var(--text-scale))", 
                                  padding: "0.15rem 0.35rem", 
                                  background: issue.type === "feature" ? "#4b2b6b" : "#6b2b2b", 
                                  color: "#ffffff",
                                  fontFamily: "'DM Mono', monospace",
                                  fontWeight: "bold",
                                  textTransform: "uppercase"
                                }}>
                                  {issue.type === "feature" ? "Feature" : "Bug"}
                                </span>
                                <span style={{ 
                                  fontSize: "calc(8px * var(--text-scale))", 
                                  padding: "0.15rem 0.35rem", 
                                  background: "#111", 
                                  color: "var(--accent-color)",
                                  fontFamily: "'DM Mono', monospace",
                                  border: "1px solid #222"
                                }}>
                                  {statusLabels[issue.status]}
                                </span>
                              </div>
                            </div>
                            <div style={{ color: "#fff", fontSize: "calc(12px * var(--text-scale))", fontWeight: "bold" }}>{issue.title}</div>
                            {issue.tags && issue.tags.length > 0 && (
                              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                                {issue.tags.map(t => (
                                  <span key={t} style={{ fontSize: "calc(8px * var(--text-scale))", color: "#999999", background: "#181818", padding: "0.1rem 0.3rem", border: "1px solid #333" }}>{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {myProjIssues.length === 0 && (
                          <div style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))", padding: "1rem", textAlign: "center" }}>
                            No assigned issues in this project!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Personal checklist */}
                    <div style={{ border: "1px solid #222222", background: "#0d0d0d", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.25rem" }}>
                        Personal To-Dos (Private)
                      </h3>
                      <form onSubmit={handleAddPersonalTodo} style={{ display: "flex", gap: "0.5rem" }}>
                        <input 
                          value={newTodoText} 
                          onChange={e => setNewTodoText(e.target.value)} 
                          placeholder="New to-do item..." 
                          required 
                          style={{ flex: 1, background: "#111111", border: "1px solid #222222", color: "#f2f2f2", padding: "0.5rem 0.75rem", outline: "none", fontSize: "calc(12px * var(--text-scale))" }}
                        />
                        <button type="submit" style={{ background: "var(--accent-color)", color: "#080808", border: "none", padding: "0 0.85rem", cursor: "pointer", fontFamily: "'Archivo', sans-serif", fontWeight: "bold", fontSize: "calc(11px * var(--text-scale))" }}>
                          ADD
                        </button>
                      </form>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "350px", overflowY: "auto", marginTop: "0.5rem" }}>
                        {personalTodos.map(todo => (
                          <div 
                            key={todo.id} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between", 
                              padding: "0.5rem", 
                              border: "1px solid #1a1a1a", 
                              background: "#080808" 
                            }}
                          >
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1, minWidth: 0 }}>
                              <input 
                                type="checkbox" 
                                checked={todo.completed} 
                                onChange={e => handleTogglePersonalTodo(todo.id, e.target.checked)}
                                style={{ cursor: "pointer", accentColor: "var(--accent-color)" }}
                              />
                              <span style={{ 
                                color: todo.completed ? "#666666" : "#cccccc", 
                                textDecoration: todo.completed ? "line-through" : "none", 
                                fontSize: "calc(12px * var(--text-scale))",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap"
                              }}>
                                {todo.text}
                              </span>
                            </label>
                            <button 
                              type="button" 
                              onClick={() => handleDeletePersonalTodo(todo.id)}
                              style={{ background: "transparent", border: "none", color: "#ff5555", cursor: "pointer", opacity: 0.6, display: "grid", placeItems: "center" }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {personalTodos.length === 0 && (
                          <div style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))", padding: "1rem", textAlign: "center" }}>
                            Your checklist is empty! Add an item above.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : projectTab === "activity" ? (
                // ================= ACTIVITY TIMELINE VIEW =================
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                      Project Activity Timeline
                    </h3>
                    
                    {loadingActivities ? (
                      <div style={{ color: "var(--accent-color)", fontFamily: "monospace", fontSize: "calc(12px * var(--text-scale))", padding: "1rem" }}>
                        LOADING TIMELINE LOGS...
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingLeft: "0.5rem", borderLeft: "2px solid #222222", marginLeft: "0.5rem", position: "relative" }}>
                        {activities.map((act) => {
                          const timeStr = new Date(act.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                          const isGit = act.message.includes("git") || act.message.includes("PR #");
                          const dotColor = isGit ? "#8b5cf6" : act.message.includes("completed") ? "#10b981" : "var(--accent-color)";
                          
                          return (
                            <div key={act.id} style={{ position: "relative", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                              {/* Timeline dot */}
                              <div style={{ 
                                position: "absolute", 
                                left: "-11px", 
                                top: "5px", 
                                width: "6px", 
                                height: "6px", 
                                borderRadius: "50%", 
                                background: dotColor,
                                border: "2px solid #080808",
                                boxShadow: `0 0 8px ${dotColor}`
                              }} />
                              
                              <div style={{ flex: 1, border: "1px solid #1a1a1a", background: "#0d0d0d", padding: "0.75rem 1rem", fontSize: "calc(12px * var(--text-scale))" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                  <span style={{ fontWeight: "bold", color: "#ffffff" }}>{act.userName}</span>
                                  <span style={{ fontFamily: "'DM Mono', monospace", color: "#777777", fontSize: "calc(10px * var(--text-scale))" }}>{timeStr}</span>
                                </div>
                                <div style={{ color: "#cccccc", lineHeight: 1.4 }}>
                                  {act.message}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {activities.length === 0 && (
                          <div style={{ color: "#777777", fontSize: "calc(12px * var(--text-scale))", padding: "1rem 0", fontStyle: "italic" }}>
                            No activities recorded for this project yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // ================= PROJECT BOARD VIEW =================
                <>
                  {/* Filters toolbar */}
                  <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #222222", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: "0.7rem", border: "1px solid #222222", background: "#111111", padding: "0.6rem 0.75rem", color: "#777777" }}>
                      <Search size={15} />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issue title or id..." style={{ background: "transparent", border: "none", outline: "none", color: "#f2f2f2", width: "100%", fontSize: "calc(13px * var(--text-scale))" }} />
                    </label>

                    {/* Assignee Filter dropdown */}
                    <select
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      style={{ background: "#111111", border: "1px solid #222222", color: "#cccccc", padding: "0.6rem 0.75rem", fontSize: "calc(13px * var(--text-scale))", outline: "none", cursor: "pointer" }}
                    >
                      <option value="all">Filter Assignee</option>
                      {activeProjId === "dashboard"
                        ? members.map(m => <option key={m.id} value={m.id}>{m.username || m.name}</option>)
                        : projMembers.filter(m => !m.isPending).map(m => <option key={m.id} value={m.id}>{m.username || m.name}</option>)
                      }
                    </select>

                    {/* Priority Filter dropdown */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      style={{ background: "#111111", border: "1px solid #222222", color: "#cccccc", padding: "0.6rem 0.75rem", fontSize: "calc(13px * var(--text-scale))", outline: "none", cursor: "pointer" }}
                    >
                      <option value="all">Filter Priority</option>
                      {(["urgent", "high", "medium", "low"] as const).map((p) => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))}
                    </select>

                    {/* Quick Creation Form inside Project */}
                    <form onSubmit={handleCreateIssue} style={{ flex: "1 1 280px", display: "flex", gap: "0.5rem" }}>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as IssueType)}
                        style={{
                          background: "#111111",
                          border: "1px solid #222222",
                          color: "#cccccc",
                          padding: "0.6rem 0.75rem",
                          fontSize: "calc(13px * var(--text-scale))",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="bug">Bug</option>
                        <option value="feature">Feature</option>
                      </select>
                      <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="New issue title..." required style={{ flex: 1, background: "#111111", border: "1px solid #222222", color: "#f2f2f2", padding: "0.6rem 0.75rem", outline: "none", fontSize: "calc(13px * var(--text-scale))" }} />
                      <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "var(--accent-color)", color: "#080808", border: "none", padding: "0 1rem", cursor: "pointer", fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(11px * var(--text-scale))", textTransform: "uppercase" }}>
                        <Plus size={15} /> Add
                      </button>
                    </form>
                  </div>

              {/* VIEW SWITCHER RENDERS */}
              {filteredIssues.length === 0 ? (
                // Empty state
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", textAlign: "center" }}>
                  <div style={{ width: 50, height: 50, background: "#111111", color: "var(--accent-color)", borderRadius: "50%", display: "grid", placeItems: "center", marginBottom: "1.25rem", border: "1px solid #222222" }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(1.2rem * var(--text-scale))", color: "#f2f2f2", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                    {issues.filter(i => i.projectId === activeProjId).length === 0 ? "Project is empty" : "No issues match filter"}
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "calc(13px * var(--text-scale))", color: "#999999", maxWidth: "300px", margin: "0 0 1.5rem 0", lineHeight: 1.6 }}>
                    {issues.filter(i => i.projectId === activeProjId).length === 0
                      ? "Create your first issue in the toolbar above to start tracking progress."
                      : "Try clearing your search query or reset the filters."}
                  </p>
                </div>
              ) : viewMode === "list" ? (
                // ================= LIST VIEW =================
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "#cccccc", fontSize: "calc(12px * var(--text-scale))", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #111111", background: "#0a0a0a" }}>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: "bold", fontFamily: "'DM Mono', monospace", color: "#999999" }}>CODE</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: "bold", fontFamily: "'DM Mono', monospace", color: "#999999" }}>TYPE</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: "bold", fontFamily: "'DM Mono', monospace", color: "#999999" }}>TITLE</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: "bold", fontFamily: "'DM Mono', monospace", color: "#999999" }}>STATUS</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: "bold", fontFamily: "'DM Mono', monospace", color: "#999999" }}>PRIORITY</th>
                        <th style={{ padding: "0.85rem 1rem", fontWeight: "bold", fontFamily: "'DM Mono', monospace", color: "#999999" }}>ASSIGNEE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.map((issue) => {
                        const assignee = members.find(m => m.id === issue.assigneeId);
                        return (
                          <tr 
                            key={issue.id} 
                            onClick={() => setSelectedId(issue.id)}
                            style={{ borderBottom: "1px solid #111111", cursor: "pointer", background: selectedId === issue.id ? "#101820" : "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = selectedId === issue.id ? "#101820" : "#0d0d0d"}
                            onMouseLeave={e => e.currentTarget.style.background = selectedId === issue.id ? "#101820" : "transparent"}
                          >
                            <td style={{ padding: "0.85rem 1rem", fontFamily: "'DM Mono', monospace", color: "#777777" }}>{issue.id}</td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ 
                                fontSize: "calc(10px * var(--text-scale))", 
                                padding: "0.2rem 0.4rem", 
                                background: issue.type === "feature" ? "#4b2b6b" : "#6b2b2b", 
                                color: "#ffffff",
                                fontFamily: "'DM Mono', monospace",
                                fontWeight: "bold",
                                textTransform: "uppercase"
                              }}>
                                {issue.type === "feature" ? "FEATURE" : "BUG"}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", color: issue.status === "done" ? "#10b981" : "#f2f2f2", fontWeight: 500 }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <span>{issue.title}</span>
                                {issue.tags && issue.tags.length > 0 && (
                                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                    {issue.tags.map(t => (
                                      <span key={t} style={{ fontSize: "calc(9px * var(--text-scale))", color: "#888888", background: "#111111", border: "1px solid #222222", padding: "1px 5px", fontFamily: "monospace" }}>{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{ color: issue.status === "done" ? "#10b981" : "var(--accent-color)" }}>{statusLabels[issue.status]}</span>
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              {issue.status !== "done" ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                                  <span style={{ width: 6, height: 6, background: priorityColors[issue.priority], borderRadius: "50%" }} />
                                  {issue.priority.toUpperCase()}
                                </span>
                              ) : (
                                <span style={{ color: "#777777" }}>-</span>
                              )}
                            </td>
                             <td style={{ padding: "0.85rem 1rem", color: "#999999" }}>{assignee ? (assignee.username || assignee.name) : "Unassigned"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                // ================= KANBAN VIEW =================
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", padding: "1.5rem", overflowX: "auto" }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {(["todo", "in-progress", "review", "done"] as const).map(colStatus => {
                    const colIssues = filteredIssues.filter(i => i.status === colStatus);
                    return (
                      <div key={colStatus} style={{ background: "#0d0d0d", padding: "1rem", border: "1px solid #1a1a1a", display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "400px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(11px * var(--text-scale))", textTransform: "uppercase", color: "#f2f2f2" }}>
                            {statusLabels[colStatus]}
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#777777" }}>{colIssues.length}</span>
                        </div>

                        {colIssues.map(issue => {
                          const assignee = members.find(m => m.id === issue.assigneeId);
                          return (
                            <div 
                              key={issue.id}
                              onClick={() => setSelectedId(issue.id)}
                              style={{ background: "#080808", border: `1px solid ${selectedId === issue.id ? "var(--accent-color)" : "#222"}`, padding: "0.85rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontFamily: "monospace", fontSize: "calc(10px * var(--text-scale))", color: "#777777" }}>{issue.id}</span>
                                <span style={{ 
                                  fontSize: "calc(8px * var(--text-scale))", 
                                  padding: "0.1rem 0.35rem", 
                                  background: issue.type === "feature" ? "#4b2b6b" : "#6b2b2b", 
                                  color: "#ffffff",
                                  fontFamily: "'DM Mono', monospace",
                                  fontWeight: "bold",
                                  textTransform: "uppercase"
                                }}>
                                  {issue.type === "feature" ? "FEAT" : "BUG"}
                                </span>
                              </div>
                              <div style={{ fontSize: "calc(12px * var(--text-scale))", color: issue.status === "done" ? "#10b981" : "#f2f2f2", fontWeight: 500 }}>{issue.title}</div>
                              
                              {issue.tags && issue.tags.length > 0 && (
                                <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                                  {issue.tags.map(t => (
                                    <span key={t} style={{ fontSize: "calc(8px * var(--text-scale))", color: "#999999", background: "#111111", border: "1px solid #222222", padding: "1px 4px", fontFamily: "monospace" }}>{t}</span>
                                  ))}
                                </div>
                              )}

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem", borderTop: "1px solid #1c1c1c", paddingTop: "0.4rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "calc(10px * var(--text-scale))" }}>
                                  <div style={{ width: 14, height: 14, background: "#111", border: "1px solid #222", color: "var(--accent-color)", fontSize: "calc(8px * var(--text-scale))", display: "grid", placeItems: "center", fontWeight: "bold" }}>
                                    {assignee?.avatar || "?"}
                                  </div>
                                  <span style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999" }}>{assignee ? (assignee.username || assignee.name) : "Unassigned"}</span>
                                </div>

                                {issue.status !== "done" ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                    <span style={{ width: 5, height: 5, background: priorityColors[issue.priority], borderRadius: "50%" }} />
                                    <span style={{ fontSize: "calc(8px * var(--text-scale))", color: "#999999", textTransform: "uppercase" }}>{issue.priority}</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "calc(9px * var(--text-scale))", color: "#10b981", fontWeight: "bold", fontFamily: "'DM Mono', monospace" }}>DONE</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>

        {/* Selected Issue Detail Right Sidebar */}
        <aside style={{ position: "relative", background: "#0d0d0d", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Right Sidebar Drag Handle */}
          <div
            onMouseDown={startResizeRight}
            style={{
              position: "absolute",
              top: 0,
              left: "-4px",
              width: "8px",
              height: "100%",
              cursor: "col-resize",
              zIndex: 50,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          />
          {selectedIssue ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "#777777", fontSize: "calc(11px * var(--text-scale))" }}>{selectedIssue.id}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteIssue(selectedIssue.id)}
                    title="Delete issue"
                    style={{ background: "transparent", border: "none", color: "#999999", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ff3b3b")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedId("")}
                    title="Close and return to project info"
                    style={{
                      background: "transparent",
                      border: "1px solid #333333",
                      color: "#999999",
                      padding: "0.2rem 0.5rem",
                      fontSize: "calc(9px * var(--text-scale))",
                      cursor: "pointer",
                      fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-color)"; e.currentTarget.style.borderColor = "var(--accent-color)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#999999"; e.currentTarget.style.borderColor = "#333333"; }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* In-place Editable Title */}
              <div>
                <input
                  value={selectedIssue.title}
                  onChange={(event) => handleUpdateIssue(selectedIssue.id, { title: event.target.value })}
                  placeholder="Issue title"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px dashed #222222",
                    color: "#f2f2f2",
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 900,
                    fontSize: "calc(1.3rem * var(--text-scale))",
                    width: "100%",
                    outline: "none",
                    padding: "0.2rem 0",
                    marginBottom: "0.5rem",
                  }}
                />
                
                {/* In-place Editable Description */}
                <textarea
                  value={selectedIssue.description}
                  onChange={(event) => handleUpdateIssue(selectedIssue.id, { description: event.target.value })}
                  placeholder="Add a detailed description..."
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px dashed #222222",
                    color: "#cccccc",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "calc(13px * var(--text-scale))",
                    lineHeight: 1.6,
                    width: "100%",
                    minHeight: "80px",
                    outline: "none",
                    resize: "vertical",
                    padding: "0.2rem 0",
                  }}
                />
              </div>

              {/* Status Select */}
              <Field label="Status">
                <select value={selectedIssue.status} onChange={(event) => handleUpdateIssue(selectedIssue.id, { status: event.target.value as IssueStatus })} style={selectStyle}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              {/* Priority Select */}
              {selectedIssue.status !== "done" && (
                <Field label="Priority">
                  <select value={selectedIssue.priority} onChange={(event) => handleUpdateIssue(selectedIssue.id, { priority: event.target.value as IssuePriority })} style={selectStyle}>
                    {(["urgent", "high", "medium", "low"] as const).map((priority) => (
                      <option key={priority} value={priority}>{priority.toUpperCase()}</option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Assignee Select (Project Members) */}
              <Field label="Assignee">
                <select value={selectedIssue.assigneeId} onChange={(event) => handleUpdateIssue(selectedIssue.id, { assigneeId: event.target.value })} style={selectStyle}>
                  <option value="">Unassigned</option>
                  {activeIssueProjMembers.map((member) => (
                    <option key={member.id} value={member.id}>{member.username || member.name}</option>
                  ))}
                </select>
              </Field>

              {/* Project Select (Workspace Projects) */}
              <Field label="Project">
                <select value={selectedIssue.projectId} onChange={(event) => handleUpdateIssue(selectedIssue.id, { projectId: event.target.value })} style={selectStyle}>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </Field>

              {/* Issue Type Select */}
              <Field label="Type">
                <select value={selectedIssue.type || "bug"} onChange={(event) => handleUpdateIssue(selectedIssue.id, { type: event.target.value as IssueType })} style={selectStyle}>
                  <option value="bug">Bug</option>
                  <option value="feature">eature</option>
                </select>
              </Field>

              {/* Bug-specific attributes */}
              {selectedIssue.type === "bug" && (
                <>
                  <Field label="Severity">
                    <select value={selectedIssue.bugSeverity || ""} onChange={(event) => handleUpdateIssue(selectedIssue.id, { bugSeverity: event.target.value as any })} style={selectStyle}>
                      <option value="">Select Severity</option>
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>
                  </Field>
                  <Field label="Environment">
                    <select value={selectedIssue.bugEnv || ""} onChange={(event) => handleUpdateIssue(selectedIssue.id, { bugEnv: event.target.value as any })} style={selectStyle}>
                      <option value="">Select Environment</option>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </Field>
                </>
              )}

              {/* Feature-specific attributes */}
              {selectedIssue.type === "feature" && (
                <>
                  <Field label="Scope">
                    <select value={selectedIssue.featureScope || ""} onChange={(event) => handleUpdateIssue(selectedIssue.id, { featureScope: event.target.value as any })} style={selectStyle}>
                      <option value="">Select Scope</option>
                      <option value="epic">Epic</option>
                      <option value="task">Task</option>
                      <option value="improvement">Improvement</option>
                    </select>
                  </Field>
                  <Field label="Story Points">
                    <select value={selectedIssue.storyPoints || ""} onChange={(event) => handleUpdateIssue(selectedIssue.id, { storyPoints: event.target.value as any })} style={selectStyle}>
                      <option value="">Select Story Points</option>
                      <option value="1pt">1pt</option>
                      <option value="2pt">2pt</option>
                      <option value="3pt">3pt</option>
                      <option value="5pt">5pt</option>
                      <option value="8pt">8pt</option>
                    </select>
                  </Field>
                </>
              )}

              {/* Tags */}
              <Field label="Tags">
                <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                    {selectedIssue.tags?.map(tag => (
                      <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "calc(10px * var(--text-scale))", color: "var(--accent-color)", background: "#111111", border: "1px solid #222222", padding: "2px 6px" }}>
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => {
                            const newTags = (selectedIssue.tags || []).filter(t => t !== tag);
                            handleUpdateIssue(selectedIssue.id, { tags: newTags });
                          }}
                          style={{ background: "transparent", border: "none", color: "#ff5555", cursor: "pointer", fontSize: "calc(9px * var(--text-scale))", padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text"
                    placeholder="Add tag & press Enter..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          const currentTags = selectedIssue.tags || [];
                          if (!currentTags.includes(val)) {
                            handleUpdateIssue(selectedIssue.id, { tags: [...currentTags, val] });
                          }
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                    style={{
                      background: "#111111",
                      border: "1px solid #222222",
                      color: "#f2f2f2",
                      padding: "0.5rem 0.75rem",
                      outline: "none",
                      fontSize: "calc(12px * var(--text-scale))"
                    }}
                  />
                </div>
              </Field>

              {/* Comments Section */}
              <div style={{ borderTop: "1px solid #222222", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#999999", fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                  <MessageSquare size={13} /> Comments
                </div>
                
                {/* Scrollable Comments list */}
                <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem", maxHeight: "150px", overflowY: "auto" }}>
                  {comments.length ? (
                    comments.map((item) => {
                      const commAuthor = allUsers.find(u => u.id === item.userId);
                      const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const selectedIssueProject = projects.find(p => p.id === selectedIssue?.projectId);
                      const isProjectCreator = selectedIssueProject && selectedIssueProject.creatorId === user?.id;
                      const canDelete = isProjectCreator || item.userId === user?.id;
                      return (
                        <div key={item.id} style={{ border: "1px solid #1a1a1a", background: "#080808", padding: "0.6rem 0.75rem", color: "#cccccc", fontSize: "calc(11px * var(--text-scale))", lineHeight: 1.5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", color: "#999999", fontSize: "calc(9px * var(--text-scale))" }}>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span style={{ fontWeight: "bold" }}>{commAuthor ? (commAuthor.username || commAuthor.name) : "Teammate"}</span>
                              <span>•</span>
                              <span>{timeStr}</span>
                            </div>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(item.id)}
                                title="Delete comment"
                                style={{ background: "transparent", border: "none", color: "#ff5555", cursor: "pointer", display: "grid", placeItems: "center", padding: "2px", opacity: 0.6 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <div>{item.content}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: "#777777", fontSize: "calc(11px * var(--text-scale))" }}>No comments yet.</div>
                  )}
                </div>
                <form onSubmit={handleAddComment} style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add comment..." required style={{ minWidth: 0, flex: 1, background: "#111111", border: "1px solid #222222", color: "#f2f2f2", padding: "0.6rem 0.75rem", outline: "none", fontSize: "calc(12px * var(--text-scale))" }} />
                  <button type="submit" style={{ background: "var(--accent-color)", color: "#080808", border: "none", width: 36, display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <Plus size={14} />
                  </button>
                </form>
              </div>
            </>
          ) : activeProjId !== "dashboard" ? (
            // ================= PROJECT INFO & TEAM VIEW =================
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                  Project Info
                </h3>
                <div style={{ display: "grid", gap: "0.4rem", color: "#cccccc", fontSize: "calc(12px * var(--text-scale))" }}>
                  <div><strong>Name:</strong> {currentProject?.name}</div>
                  <div><strong>Description:</strong> {currentProject?.description || "No project description."}</div>
                  <div><strong>Created:</strong> {currentProject ? new Date(currentProject.createdAt).toLocaleDateString() : ""}</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "calc(13px * var(--text-scale))", color: "#f2f2f2", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                  Project Team ({projMembers.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                  {projMembers.map(member => (
                    <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.3rem 0.5rem", border: "1px solid #222", background: "#0d0d0d", color: "#cccccc", fontSize: "calc(12px * var(--text-scale))" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 18, height: 18, background: "#111", border: "1px solid #222", color: "var(--accent-color)", fontSize: "calc(9px * var(--text-scale))", display: "grid", placeItems: "center", fontWeight: "bold" }}>
                          {member.avatar}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: "#fff", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold" }}>{member.username || member.name}{member.isPending && " (Pending)"}</span>
                          <span style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999" }}>{member.email}</span>
                        </div>
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        {member.id === projCreatorId ? (
                          <span style={{ color: "var(--accent-color)", fontSize: "calc(8px * var(--text-scale))", fontFamily: "'DM Mono', monospace", border: "1px solid var(--accent-color)", padding: "1px 4px", textTransform: "uppercase" }}>Creator</span>
                        ) : (
                          <>
                            {user?.id === projCreatorId ? (
                              <select
                                value={member.role || "Member"}
                                onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                                style={{
                                  background: "#111111",
                                  border: "1px solid #333",
                                  color: "var(--accent-color)",
                                  fontSize: "calc(8px * var(--text-scale))",
                                  fontFamily: "'DM Mono', monospace",
                                  padding: "2px",
                                  outline: "none",
                                  cursor: "pointer",
                                  textTransform: "uppercase"
                                }}
                              >
                                {["Lead", "Developer", "Designer", "QA", "Product Manager", "Member"].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ color: "#999999", fontSize: "calc(8px * var(--text-scale))", fontFamily: "'DM Mono', monospace", border: "1px solid #333", padding: "1px 4px", textTransform: "uppercase" }}>
                                {member.role || "Member"}
                              </span>
                            )}
                            {user?.id === projCreatorId && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProjMember(member.id)}
                                title="Remove from project"
                                style={{ background: "transparent", border: "none", color: "#ff3b3b", opacity: 0.6, cursor: "pointer", display: "grid", placeItems: "center", padding: "2px" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invite members form (Only visible to project creator) */}
                {user?.id === projCreatorId ? (
                  <form onSubmit={handleInviteProjMember} style={{ border: "1px solid #222222", background: "#111111", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>Invite Teammate to Project</span>
                    <input 
                      value={newProjMemberEmail} 
                      onChange={e => setNewProjMemberEmail(e.target.value)} 
                      type="email"
                      placeholder="teammate@email.com" 
                      required
                      style={{ background: "#080808", border: "1px solid #222", color: "#fff", padding: "0.4rem 0.6rem", fontSize: "calc(11px * var(--text-scale))", outline: "none" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "calc(9px * var(--text-scale))", color: "#999999", fontFamily: "monospace", textTransform: "uppercase" }}>Role:</span>
                      <select
                        value={newProjMemberRole}
                        onChange={e => setNewProjMemberRole(e.target.value)}
                        style={{
                          flex: 1,
                          background: "#080808",
                          border: "1px solid #222",
                          color: "#fff",
                          padding: "0.3rem 0.5rem",
                          fontSize: "calc(11px * var(--text-scale))",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        {["Lead", "Developer", "Designer", "QA", "Product Manager", "Member"].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" style={{ background: "var(--accent-color)", color: "#080808", border: "none", padding: "0.35rem", fontSize: "calc(11px * var(--text-scale))", fontWeight: "bold", cursor: "pointer" }}>SEND PROJECT INVITE</button>
                  </form>
                ) : (
                  <div style={{ color: "#888888", fontSize: "calc(10px * var(--text-scale))", fontStyle: "italic" }}>
                    Only the project creator can invite new members to this project.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#777777", fontSize: "calc(12px * var(--text-scale))", textAlign: "center", padding: "2rem" }}>
              Select or create an issue to view and edit details.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "1rem 1.5rem", borderRight: "1px solid #222222" }}>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "calc(1.75rem * var(--text-scale))", letterSpacing: "-0.04em", color: "var(--accent-color)", lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: "0.4rem", color: "#999999", fontFamily: "'DM Mono', monospace", fontSize: "calc(10px * var(--text-scale))", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "0.4rem", color: "#999999", fontSize: "calc(11px * var(--text-scale))", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
      {label}
      {children}
    </label>
  );
}

const selectStyle = {
  width: "100%",
  background: "#111111",
  border: "1px solid #222222",
  color: "#f2f2f2",
  padding: "0.6rem 0.75rem",
  outline: "none",
  fontSize: "calc(12px * var(--text-scale))",
  cursor: "pointer",
};
