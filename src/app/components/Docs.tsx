import { useState } from "react";
import { ArrowLeft, BookOpen, Search, Code, Key, Settings, GitBranch, Layers, ShieldCheck } from "lucide-react";

type DocArticle = {
  id: string;
  category: string;
  title: string;
  icon: any;
  content: React.ReactNode;
};

export function Docs() {
  const [activeTab, setActiveTab] = useState<string>("intro");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const articles: DocArticle[] = [
    {
      id: "intro",
      category: "Getting Started",
      title: "Introduction",
      icon: BookOpen,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            Welcome to the <strong>BugBytes</strong> documentation! BugBytes is a project management and issue-tracking platform engineered for indie developers, hackathon squads, and agile engineering teams.
          </p>
          <p>
            It provides key tracking metrics and workflow automation with <strong>Linear-grade speed</strong>, and features a glowing, cyberpunk visual aesthetics system built entirely on CSS Custom Variables.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Core Ideology</h3>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <li><strong>Zero Bloat:</strong> Quick project setup without bulky pages or complex setups.</li>
            <li><strong>Automated Workflows:</strong> Link Git activities straight to issue status changes via webhooks.</li>
            <li><strong>Beautiful custom UI:</strong> Glowing dark dashboards and text-scaling accessibility options.</li>
          </ul>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Key Tech Stack</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", fontSize: "12px", border: "1px solid #222" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #222" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Layer</th>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Technologies</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #111" }}>
                <td style={{ padding: "0.5rem 0.75rem", fontWeight: "bold" }}>Frontend</td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>React 18, Vite, Lucide React (Icons), CSS Variables (Cyberpunk Swatches)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #111" }}>
                <td style={{ padding: "0.5rem 0.75rem", fontWeight: "bold" }}>Authentication</td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>Clerk Auth (OAuth providers, Email, session tokens)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #111" }}>
                <td style={{ padding: "0.5rem 0.75rem", fontWeight: "bold" }}>Backend Server</td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>Node.js, Express, Clerk Express Middleware</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0.75rem", fontWeight: "bold" }}>Database</td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>JSON File Registry Database (`server/db.json`) (migrating to Postgres + Prisma soon)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      id: "workspaces",
      category: "Collaboration",
      title: "Workspaces",
      icon: Layers,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            Workspaces organize all your team's projects. Every workspace has its own unique <strong>url slug</strong> (e.g. <code>my-company</code>) that defines its address.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Explore & Join Workspaces</h3>
          <p>
            Users can search public workspaces in the system and join them. Click on the <strong>Globe</strong> icon next to the workspace selector in the sidebar to toggle the explorer, then click <strong>JOIN</strong> to register.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Workspace Invitations</h3>
          <p>
            If you want to invite a member directly to a workspace, click <strong>Add Member</strong> at the bottom of the left-hand sidebar, enter their email address, and they will receive access immediately.
          </p>
        </div>
      )
    },
    {
      id: "roles",
      category: "Collaboration",
      title: "Projects & Team Roles",
      icon: ShieldCheck,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            Projects reside inside workspaces and group related issues. Issues can be assigned to project members.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Invite Teammates</h3>
          <p>
            Project creators can invite users to projects using the team panel in the right sidebar. If the invited email is not registered, BugBytes registers a placeholder user. The invitations wait in the user's Inbox until accepted.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Role Definition Hierarchy</h3>
          <p>
            Project creators can adjust team members' roles dynamically:
          </p>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <li><strong>Lead (Owner):</strong> Full access, can rename/delete projects, invite/remove members, and reassign roles.</li>
            <li><strong>Developer / Designer / QA / Product Manager:</strong> Assigned specific roles representing responsibilities, allowing clean task filtering.</li>
            <li><strong>Member:</strong> Default project role for newly joined members.</li>
          </ul>
        </div>
      )
    },
    {
      id: "tracking",
      category: "Tracking",
      title: "Kanban & Issue Fields",
      icon: Code,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            Issues are divided into two main categories: <strong>Bugs</strong> (corrective work) and <strong>Features</strong> (additive work).
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Issue Attributes</h3>
          <p>
            Based on the selected issue type, BugBytes renders contextual configuration inputs:
          </p>
          
          <h4 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#fff", fontSize: "0.9rem", margin: "1.25rem 0 0.5rem 0" }}>Bug Tracking</h4>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
            <li><strong>Severity:</strong> Critical, Major, Minor</li>
            <li><strong>Environment:</strong> Production, Staging, Development</li>
          </ul>

          <h4 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#fff", fontSize: "0.9rem", margin: "1.5rem 0 0.5rem 0" }}>Feature Tracking</h4>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
            <li><strong>Scope:</strong> Epic, Task, Improvement</li>
            <li><strong>Story Points:</strong> Fibonacci estimation values (1pt, 2pt, 3pt, 5pt, 8pt)</li>
          </ul>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Views & Board Controls</h3>
          <p>
            Toggle between the <strong>List View</strong> table (great for quick filtering and overview) and the <strong>Kanban Board</strong> (ideal for drag-and-drop workflow status updates). Drag cards across columns to change status. A prompt verifies status changes to "Done".
          </p>
        </div>
      )
    },
    {
      id: "git",
      category: "Developer Guide",
      title: "Git Integration Webhooks",
      icon: GitBranch,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            BugBytes automates issue updates using Git repository commits and Pull Request merges via webhooks.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Setting up GitHub / GitLab</h3>
          <p>
            Configure a webhook in your repository settings:
          </p>
          <pre style={{ background: "#0d0d0d", border: "1px solid #222", padding: "1rem", color: "var(--accent-color)", fontFamily: "'DM Mono', monospace", fontSize: "11px", overflowX: "auto" }}>
            Payload URL:  http://&lt;your-server&gt;/api/webhooks/git{"\n"}
            Content Type: application/json{"\n"}
            Events:       Push, Pull Requests
          </pre>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Commit Message Syntax</h3>
          <p>
            Mention the issue tag anywhere in your commit message (e.g. <code>#BB-12</code> or <code>#JO-001</code>) to link the commit to the issue and post a details comment on the issue thread.
          </p>
          <p>
            Prefix the issue tag with change verbs to automatically set the issue status to <strong>Done</strong>:
          </p>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <li><code>Fixes #BB-12</code></li>
            <li><code>Closes #JO-001</code></li>
            <li><code>Resolves #BB-45</code></li>
          </ul>
        </div>
      )
    },
    {
      id: "timeline",
      category: "Tracking",
      title: "Activity Timeline Feed",
      icon: Key,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            The <strong>Activity Timeline</strong> tab inside projects logs all notable workspace and development milestones.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Log Triggers</h3>
          <p>
            Activities are automatically added when:
          </p>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <li>An issue is created or assigned to a teammate.</li>
            <li>An issue status changes (e.g., moved to <strong>In Progress</strong> or completed).</li>
            <li>A commit is pushed or a PR is merged via Git webhook integrations.</li>
          </ul>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Visual Node System</h3>
          <p>
            The vertical scroll timeline uses color-coded nodes matching different activities:
          </p>
          <ul style={{ paddingLeft: "1.25rem", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <li><strong style={{ color: "#a78bfa" }}>Purple Nodes:</strong> Commit pushes, branch merges, and Pull Request events.</li>
            <li><strong style={{ color: "#10b981" }}>Green Nodes:</strong> Completions and resolutions of issue goals.</li>
            <li><strong style={{ color: "var(--accent-color)" }}>Accent Nodes:</strong> Creation and general updates of issues/metadata.</li>
          </ul>
        </div>
      )
    },
    {
      id: "customization",
      category: "Configuration",
      title: "UI Adjustments & Scaling",
      icon: Settings,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            BugBytes values accessibility and visual customization. You can configure your view preferences in the <strong>Settings</strong> menu.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Accent Colors</h3>
          <p>
            Choose from five vibrant theme swatches: Cyber Blue, Neon Green, Electric Cyan, Hot Pink, or Purple Rain. The selected accent color propagates through all component borders, buttons, text nodes, and glowing accents dynamically.
          </p>

          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #222", paddingBottom: "0.5rem", marginTop: "2rem", color: "#fff", fontSize: "1.1rem" }}>Font Scaling</h3>
          <p>
            Adjust the typography size: <strong>Small</strong> (1.15x), <strong>Medium</strong> (1.30x), <strong>Large</strong> (1.45x), or <strong>Extra Large</strong> (1.60x) to match your setup. Scaled settings are stored in local storage and persist instantly.
          </p>
        </div>
      )
    }
  ];

  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDoc = articles.find(art => art.id === activeTab) || articles[0];

  // Group by category
  const categories = Array.from(new Set(articles.map(art => art.category)));

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#f2f2f2", paddingTop: "80px", paddingBottom: "5rem" }}>
      <style>{`
        .docs-body p {
          margin-top: 0;
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #cccccc;
          text-align: left;
        }
        .docs-body strong {
          color: #ffffff;
          font-weight: 700;
        }
        .docs-body li {
          margin-bottom: 0.55rem;
          color: #cccccc;
          line-height: 1.7;
        }
        .docs-body code {
          background: #161616;
          color: #ff5e97;
          padding: 2px 6px;
          font-family: 'DM Mono', monospace;
          font-size: 0.9em;
          border: 1px solid #222;
        }
      `}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        
        {/* Back Link */}
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#555555",
            fontSize: "calc(11px * var(--text-scale))",
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase",
            textDecoration: "none",
            letterSpacing: "0.08em",
            marginBottom: "2rem",
            transition: "color 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent-color)"}
          onMouseLeave={e => e.currentTarget.style.color = "#555555"}
        >
          <ArrowLeft size={12} /> BACK TO HOMEPAGE
        </a>

        <div style={{ display: "flex", gap: "2.5rem" }} className="flex-col md:flex-row">
          
          {/* Docs Sidebar */}
          <aside style={{ width: "260px", flexShrink: 0 }} className="w-full md:w-64">
            
            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "#555555" }} />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0d0d0d",
                  border: "1px solid #1a1a1a",
                  color: "#fff",
                  padding: "0.5rem 0.5rem 0.5rem 2rem",
                  fontSize: "12px",
                  outline: "none",
                  transition: "border-color 0.15s"
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--accent-color)"}
                onBlur={e => e.currentTarget.style.borderColor = "#1a1a1a"}
              />
            </div>

            {/* Sidebar list grouped by Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {categories.map(cat => {
                const catArticles = filteredArticles.filter(art => art.category === cat);
                if (catArticles.length === 0) return null;

                return (
                  <div key={cat}>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "9px",
                        fontWeight: "bold",
                        color: "#555555",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "0.4rem"
                      }}
                    >
                      {cat}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {catArticles.map(art => {
                        const Icon = art.icon;
                        const isActive = art.id === activeDoc.id;

                        return (
                          <button
                            key={art.id}
                            onClick={() => setActiveTab(art.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              background: isActive ? "#0d0d0d" : "transparent",
                              border: isActive ? "1px solid #222" : "1px solid transparent",
                              color: isActive ? "var(--accent-color)" : "#777777",
                              fontSize: "calc(12px * var(--text-scale))",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "color 0.15s, background 0.15s"
                            }}
                            onMouseEnter={e => {
                              if (!isActive) e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.color = "#777777";
                            }}
                          >
                            <Icon size={12} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{art.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Docs Detail Content Area */}
          <main style={{ flex: 1, minWidth: 0 }}>
            <article style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "2rem 2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--accent-color)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {activeDoc.category}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontWeight: 900,
                  fontSize: "calc(22px * var(--text-scale))",
                  color: "#fff",
                  margin: "0 0 1.5rem 0",
                  textTransform: "uppercase",
                  letterSpacing: "-0.03em",
                  borderBottom: "1px solid #1a1a1a",
                  paddingBottom: "1rem"
                }}
              >
                {activeDoc.title}
              </h1>

              {/* Main content body */}
              <div
                className="docs-body"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "calc(13.5px * var(--text-scale))",
                  lineHeight: 1.8,
                  color: "#cccccc"
                }}
              >
                {activeDoc.content}
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
