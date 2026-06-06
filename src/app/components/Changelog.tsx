import { ArrowLeft, GitCommit, Sparkles, Shield, UserPlus, Sliders } from "lucide-react";

type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  icon: any;
  badgeColor: string;
  changes: string[];
};

const entries: ChangelogEntry[] = [
  {
    version: "v1.4.0",
    date: "June 2026",
    title: "Project Activity Timelines",
    icon: Sparkles,
    badgeColor: "var(--accent-color)",
    changes: [
      "Real-time event logging engine for workspace and project actions.",
      "Chronological Vertical Timeline UI tab inside active projects.",
      "Git commit and Pull Request webhooks auto-logged on timelines.",
      "Glowing node categories (purple for Git, green for Done, accent color for general changes).",
      "Restricted project team member activity data access.",
    ],
  },
  {
    version: "v1.3.0",
    date: "May 2026",
    title: "Developer Git Integrations",
    icon: GitCommit,
    badgeColor: "#8b5cf6",
    changes: [
      "Configured global webhook listener endpoint at `/api/webhooks/git`.",
      "Regex issue key parsing from commit messages and PR text inputs.",
      "Smart transition keywords ('Fixes', 'Closes', 'Resolves') to auto-close issues.",
      "Simultaneous commit activity comments logging on issue boards.",
    ],
  },
  {
    version: "v1.2.0",
    date: "April 2026",
    title: "Personal Workspace Dashboards & Team Roles",
    icon: Sliders,
    badgeColor: "#3b82f6",
    changes: [
      "Created personal 'My Workspace' views alongside global 'Project Boards'.",
      "Interactive personal metrics (Completion rates, Assigned, In-Progress count).",
      "Assigned checklist todo manager persisted to the JSON database.",
      "Project Team roles dropdown configurations (Lead, Dev, Designer, QA, PM, Member).",
    ],
  },
  {
    version: "v1.1.0",
    date: "March 2026",
    title: "Inbox Project Invites & Placeholder Sync",
    icon: UserPlus,
    badgeColor: "#10b981",
    changes: [
      "Header Inbox bell and dropdown notifications listing pending invites.",
      "Email-based invitations adding users automatically to project isolation.",
      "Pre-registration placeholder accounts that merge with Clerk profiles on first login.",
      "Dynamic project membership deletion endpoints for workspace creator admin.",
    ],
  },
  {
    version: "v1.0.0",
    date: "February 2026",
    title: "Initial Launch — Cyberpunk Kanban",
    icon: Shield,
    badgeColor: "#ec4899",
    changes: [
      "Core Workspace Explorer and collaborative public workspace search/join capabilities.",
      "Kanban boards and detailed list views with status transition constraints.",
      "Clerk authenticated logins with synchronized database profiles.",
      "Cyberpunk CSS customizing neon accent swatches and dynamic font scaling.",
    ],
  },
];

export function Changelog() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#f2f2f2", paddingTop: "80px", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}>
        
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
            marginBottom: "3rem",
            transition: "color 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent-color)"}
          onMouseLeave={e => e.currentTarget.style.color = "#555555"}
        >
          <ArrowLeft size={12} /> BACK TO HOMEPAGE
        </a>

        {/* Header Section */}
        <header style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-color)", display: "inline-block", boxShadow: "0 0 8px var(--accent-color)" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#777777", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              BugBytes Changelog
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#f2f2f2",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            PRODUCT<br />
            UPDATES<span style={{ color: "var(--accent-color)" }}>.</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.6, color: "#999999", marginTop: "1.5rem", maxWidth: "28rem" }}>
            Follow our progress as we ship refinements, developer webhook configurations, and interface upgrades.
          </p>
        </header>

        {/* Timeline Grid */}
        <div style={{ position: "relative", paddingLeft: "2.5rem", display: "flex", flexDirection: "column", gap: "3.5rem" }}>
          
          {/* Vertical Connector Line */}
          <div
            style={{
              position: "absolute",
              left: "11px",
              top: "10px",
              bottom: "10px",
              width: "1px",
              background: "linear-gradient(to bottom, #222 0%, #222 80%, transparent 100%)",
            }}
          />

          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <div key={entry.version} style={{ position: "relative" }}>
                
                {/* Glowing Node Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-39px",
                    top: "4px",
                    width: "23px",
                    height: "23px",
                    borderRadius: "50%",
                    background: "#080808",
                    border: `1px solid ${entry.badgeColor}`,
                    display: "grid",
                    placeItems: "center",
                    boxShadow: `0 0 6px ${entry.badgeColor}44`,
                    zIndex: 10
                  }}
                >
                  <Icon size={11} style={{ color: entry.badgeColor }} />
                </div>

                {/* Entry Card */}
                <div
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid #1a1a1a",
                    padding: "1.5rem 1.75rem",
                    transition: "border-color 0.15s, transform 0.15s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = entry.badgeColor;
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#1a1a1a";
                    e.currentTarget.style.transform = "translateX(0px)";
                  }}
                >
                  {/* Meta tag / Version */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "10px",
                          fontWeight: "bold",
                          color: entry.badgeColor,
                          border: `1px solid ${entry.badgeColor}`,
                          padding: "1px 5px",
                          textTransform: "uppercase"
                        }}
                      >
                        {entry.version}
                      </span>
                      <h2 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff", margin: 0, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                        {entry.title}
                      </h2>
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#555555" }}>
                      {entry.date}
                    </span>
                  </div>

                  {/* Bullet points list */}
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {entry.changes.map((change, idx) => (
                      <li
                        key={idx}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: "calc(12px * var(--text-scale))",
                          lineHeight: 1.7,
                          color: "#cccccc",
                          position: "relative",
                          paddingLeft: "1.25rem",
                        }}
                      >
                        <span style={{ position: "absolute", left: 0, top: "8px", width: 4, height: 4, borderRadius: "50%", background: entry.badgeColor }} />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
