import { GitBranch, MessageSquare, BarChart2, Users, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: <Zap size={20} />,
    title: "Blazing fast issue tracking",
    description: "Create, assign, and update issues in milliseconds. Keyboard-first design means you never have to reach for the mouse.",
    surface: "#2b2930",
    iconBg: "#4f378b",
    iconColor: "#d0bcff",
  },
  {
    icon: <GitBranch size={20} />,
    title: "Git-native workflow",
    description: "Auto-link commits and PRs to issues. Know exactly which code change fixed which bug, with zero manual work.",
    surface: "#1f2d38",
    iconBg: "#1f3140",
    iconColor: "#9ecadf",
  },
  {
    icon: <MessageSquare size={20} />,
    title: "Threaded comments",
    description: "Discuss context where it lives — on the issue, not buried in Slack threads. Decisions stay searchable.",
    surface: "#2a1f2e",
    iconBg: "#633b48",
    iconColor: "#efb8c8",
  },
  {
    icon: <Users size={20} />,
    title: "Clear ownership",
    description: "Every issue has one owner. No ambiguity about who's on what. Easily reassign as teams shift during hackathons.",
    surface: "#2b2930",
    iconBg: "#4f378b",
    iconColor: "#d0bcff",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Progress at a glance",
    description: "Project dashboards show velocity, open vs done, and blockers — no spreadsheet required.",
    surface: "#1f2d38",
    iconBg: "#1f3140",
    iconColor: "#9ecadf",
  },
  {
    icon: <Shield size={20} />,
    title: "Private or public workspaces",
    description: "Keep work internal or share a read-only view with stakeholders or mentors. Full control over visibility.",
    surface: "#2a1f2e",
    iconBg: "#633b48",
    iconColor: "#efb8c8",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#938f99", letterSpacing: "0.08em" }}>
            FEATURES
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              color: "#e6e0e9",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              marginTop: "0.5rem",
            }}
          >
            Everything your team needs.{" "}
            <span style={{ fontStyle: "italic", color: "#938f99" }}>Nothing it doesn't.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl p-6 transition-all"
              style={{ background: f.surface, border: "1px solid #49454f" }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: f.iconBg, color: f.iconColor }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  lineHeight: 1.4,
                  color: "#e6e0e9",
                  marginBottom: "0.5rem",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  color: "#938f99",
                }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
