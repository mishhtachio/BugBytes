import { ArrowRight } from "lucide-react";

type HeroProps = {
  onAuth: () => void;
};

export function Hero({ onAuth }: HeroProps) {
  return (
    <section
      style={{
        paddingTop: "8rem",
        paddingBottom: "5rem",
        borderBottom: "1px solid #222222",
        background: "#080808",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        {/* Top micro-label */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4d9eff", display: "inline-block" }} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                color: "#555555",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Public Beta — now open
            </span>
          </div>
        </div>

        {/* Headline — massive, tight, centered */}
        <h1
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(4rem, 11vw, 9.5rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.065em",
            wordSpacing: "0.13em",
            color: "#f2f2f2",
            textTransform: "uppercase",
            margin: 0,
            marginBottom: "2.5rem",
            textAlign: "center",
          }}
        >
          SHIP FAST<span style={{ color: "#4d9eff" }}>.</span>
          <br />
          BREAK LESS<span style={{ color: "#4d9eff" }}>.</span>
        </h1>

        {/* Subtext + CTAs — centered */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.75rem" }}>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "1rem",
              lineHeight: 1.75,
              color: "#555555",
              maxWidth: "32rem",
              margin: 0,
              textAlign: "center",
            }}
          >
            BugBytes is issue tracking built for indie devs, hackathon squads,
            and small startups — Linear speed, zero enterprise overhead.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={onAuth}
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "#4d9eff",
                color: "#080808",
                padding: "1rem 2rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "opacity 0.15s",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Start for free <ArrowRight size={14} />
            </button>
            <a
              href="https://github.com/mishhtachio/BugBytes"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 700,
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "transparent",
                color: "#555555",
                padding: "1rem 2rem",
                textDecoration: "none",
                border: "1px solid #222222",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f2f2f2"; e.currentTarget.style.borderColor = "#555555"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#555555"; e.currentTarget.style.borderColor = "#222222"; }}
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            marginTop: "4rem",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid #222222",
          }}
          className="grid-cols-2 sm:grid-cols-4"
        >
          {[
            { value: "2,400+", label: "Teams shipping" },
            { value: "98k", label: "Issues tracked" },
            { value: "< 2 min", label: "To first project" },
            { value: "0%", label: "Enterprise bloat" },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                padding: "1.75rem 1.5rem",
                borderRight: i < arr.length - 1 ? "1px solid #222222" : "none",
                background: i === 0 ? "#111111" : "#080808",
              }}
            >
              <div
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                  letterSpacing: "-0.04em",
                  color: i === 0 ? "#4d9eff" : "#f2f2f2",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  color: "#555555",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: "0.5rem",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
