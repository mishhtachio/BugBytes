const links = {
  Product: ["Workflow", "Changelog", "Roadmap", "Status"],
  Resources: ["Docs", "API Reference", "GitHub", "Community"],
  Company: ["About", "Blog", "Careers", "Contact"],
};

export function Footer() {
  return (
    <footer style={{ background: "#080808", borderTop: "1px solid #222222", padding: "4rem 1.5rem 2.5rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(3, auto)", gap: "3rem", flexWrap: "wrap", marginBottom: "4rem" }} className="grid-cols-1 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 900,
                fontSize: "1.1rem",
                color: "#f2f2f2",
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ color: "#4d9eff" }}>●</span>
              BUGBYTES
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.8rem", lineHeight: 1.7, color: "#333333", maxWidth: "14rem" }}>
              Project management for people who actually ship.
            </p>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  color: "#333333",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                  margin: "0 0 1rem 0",
                }}
              >
                {group}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.85rem", color: "#333333", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f2f2f2")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#333333")}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#333333", letterSpacing: "0.06em" }}>
            © 2026 BUGBYTES, INC.
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#333333", letterSpacing: "0.06em" }}>
            BUILT FOR INDIE DEVS
          </span>
        </div>
      </div>
    </footer>
  );
}
