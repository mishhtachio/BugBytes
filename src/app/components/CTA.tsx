import { ArrowRight } from "lucide-react";

type CTAProps = {
  onAuth: () => void;
};

export function CTA({ onAuth }: CTAProps) {
  return (
    <section style={{ padding: "5rem 1.5rem", borderBottom: "1px solid #222222", background: "#080808" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            background: "#4d9eff",
            padding: "4rem 3.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "2.5rem",
          }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: "#0a2a4a",
                textTransform: "uppercase",
                marginBottom: "1.25rem",
              }}
            >
              ● READY TO SHIP?
            </div>
            <h2
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(3rem, 7vw, 6rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "#080808",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              START
              <br />
              NOW<span style={{ color: "#0a2a4a" }}>.</span>
            </h2>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "22rem" }}>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: "0.9rem",
                lineHeight: 1.7,
                color: "#0a2a4a",
                margin: 0,
              }}
            >
              No setup guides. No configuration hell. Sign up, create a project, and get your team moving in under 2 minutes.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={onAuth}
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "#080808",
                  color: "#4d9eff",
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
                Get started free <ArrowRight size={13} />
              </button>
              <a
                href="#"
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "transparent",
                  color: "#0a2a4a",
                  padding: "1rem 2rem",
                  textDecoration: "none",
                  border: "1px solid #0a2a4a",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                See a demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
