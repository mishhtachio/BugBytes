import { CheckCircle2, Circle, Clock, Tag, User } from "lucide-react";

const issues = [
  { id: "BB-041", title: "Auth token refresh fails on mobile Safari", status: "in-progress", priority: "urgent", assignee: "Priya K.", label: "bug" },
  { id: "BB-040", title: "Add keyboard shortcuts for issue navigation", status: "todo", priority: "medium", assignee: "Marcus R.", label: "feature" },
  { id: "BB-039", title: "Optimise bundle — remove unused dependencies", status: "todo", priority: "low", assignee: "Yuki T.", label: "perf" },
  { id: "BB-038", title: "Dark mode flickers on initial load", status: "done", priority: "medium", assignee: "Priya K.", label: "bug" },
  { id: "BB-037", title: "Export issues to CSV", status: "done", priority: "low", assignee: "Marcus R.", label: "feature" },
  { id: "BB-036", title: "Webhook support for Slack notifications", status: "todo", priority: "medium", assignee: "Yuki T.", label: "feature" },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "in-progress": { icon: <Clock size={12} />, color: "#4d9eff" },
  todo: { icon: <Circle size={12} />, color: "#333333" },
  done: { icon: <CheckCircle2 size={12} />, color: "#555555" },
};

const priorityColor: Record<string, string> = {
  urgent: "#ff3b3b",
  medium: "#4d9eff",
  low: "#333333",
};

const labelStyle: Record<string, { bg: string; color: string }> = {
  bug: { bg: "#1f0a0a", color: "#ff3b3b" },
  feature: { bg: "#0a0e1f", color: "#4d9eff" },
  perf: { bg: "#0a0e1f", color: "#4d9eff" },
};

export function DashboardPreview() {
  return (
    <section style={{ padding: "5rem 1.5rem", borderBottom: "1px solid #222222", background: "#080808" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: "#f2f2f2",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            YOUR ISSUES<span style={{ color: "#4d9eff" }}>.</span>
            <br />YOUR WAY<span style={{ color: "#4d9eff" }}>.</span>
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.875rem",
              lineHeight: 1.7,
              color: "#555555",
              maxWidth: "22rem",
              margin: 0,
            }}
          >
            A focused workspace that keeps you in flow — fast filters, clear statuses, clean assignments.
          </p>
        </div>

        {/* App shell */}
        <div style={{ border: "1px solid #222222", background: "#080808", overflow: "hidden" }}>
          {/* Chrome bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", background: "#111111", borderBottom: "1px solid #222222" }}>
            {["#ff3b3b", "#f5a623", "#4d9eff"].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#333333", marginLeft: "0.75rem" }}>
              bugbytes.app / hackathon-2026 / issues
            </span>
          </div>

          <div style={{ display: "flex", minHeight: 440 }}>
            {/* Sidebar */}
            <div
              className="hidden sm:flex"
              style={{ width: 200, flexDirection: "column", padding: "1rem 0.75rem", gap: "2px", borderRight: "1px solid #222222", background: "#0d0d0d" }}
            >
              {[
                { label: "All Issues", count: 41, active: true },
                { label: "In Progress", count: 7, active: false },
                { label: "Backlog", count: 18, active: false },
                { label: "Done", count: 16, active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    background: item.active ? "#4d9eff" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: item.active ? 700 : 400, fontSize: "12px", color: item.active ? "#080808" : "#555555", letterSpacing: "-0.01em" }}>
                    {item.label}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: item.active ? "#080808" : "#333333" }}>
                    {item.count}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1a1a1a" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#333333", letterSpacing: "0.1em", padding: "0 0.75rem", display: "block", marginBottom: "0.75rem" }}>
                  MEMBERS
                </span>
                {["Priya K.", "Marcus R.", "Yuki T."].map((name, i) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem" }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: i === 0 ? "#4d9eff" : "#1a1a1a",
                        color: i === 0 ? "#080808" : "#555555",
                        fontFamily: "'Archivo', sans-serif",
                        fontWeight: 700,
                        fontSize: "10px",
                      }}
                    >
                      {name[0]}
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#555555" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issue list */}
            <div style={{ flex: 1, overflow: "auto", background: "#080808" }}>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: "12px", color: "#f2f2f2", letterSpacing: "-0.01em" }}>All Issues</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#333333" }}>41 open</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                  {[{ icon: <Tag size={10} />, label: "Filter" }, { icon: <User size={10} />, label: "Assignee" }].map(({ icon, label }) => (
                    <button
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.35rem 0.75rem",
                        background: "transparent",
                        border: "1px solid #222222",
                        color: "#333333",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                      }}
                    >
                      {icon} {label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {issues.map((issue) => (
                <div
                  key={issue.id}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.25rem", borderBottom: "1px solid #111111", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 8, height: 8, background: priorityColor[issue.priority], flexShrink: 0 }} />
                  <span style={{ color: statusConfig[issue.status].color }}>{statusConfig[issue.status].icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#333333", minWidth: 44 }} className="hidden sm:block">
                    {issue.id}
                  </span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: issue.status === "done" ? "#555555" : "#f2f2f2", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: issue.status === "done" ? "line-through" : "none" }}>
                    {issue.title}
                  </span>
                  <span
                    className="hidden sm:inline"
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", padding: "0.25rem 0.5rem", background: labelStyle[issue.label].bg, color: labelStyle[issue.label].color, flexShrink: 0, textTransform: "uppercase" }}
                  >
                    {issue.label}
                  </span>
                  <div
                    style={{ width: 24, height: 24, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: "10px", color: "#4d9eff" }}
                  >
                    {issue.assignee[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
