const steps = [
  {
    number: "01",
    title: "CREATE A WORKSPACE",
    description: "Set up your project in under 30 seconds. Invite collaborators by email or share link.",
  },
  {
    number: "02",
    title: "ADD YOUR ISSUES",
    description: "Create issues with titles, descriptions, labels, and priority. Assign to teammates instantly.",
  },
  {
    number: "03",
    title: "MOVE THROUGH STATUS",
    description: "Backlog → In Progress → Done. Everyone stays aligned without a single meeting.",
  },
  {
    number: "04",
    title: "SHIP AND REFLECT",
    description: "Track velocity, celebrate closed issues, and carry the learning into your next sprint.",
  },
];

export function Workflow() {
  return (
    <section id="workflow" style={{ padding: "5rem 1.5rem", borderBottom: "1px solid #222222", background: "#080808" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section header */}
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
            marginBottom: "3.5rem",
          }}
        >
          FROM IDEA<br />
          TO SHIPPED<span style={{ color: "#4d9eff" }}>.</span>
        </h2>

        {/* Step grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px", background: "#222222" }} className="grid-cols-1 sm:grid-cols-2">
          {steps.map((step, i) => (
            <div
              key={step.number}
              style={{
                background: "#080808",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
              onMouseLeave={e => (e.currentTarget.style.background = "#080808")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "#4d9eff",
                    letterSpacing: "0.1em",
                  }}
                >
                  {step.number}
                </span>
                <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
              </div>
              <h3
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  letterSpacing: "-0.01em",
                  color: "#f2f2f2",
                  margin: 0,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  color: "#555555",
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
