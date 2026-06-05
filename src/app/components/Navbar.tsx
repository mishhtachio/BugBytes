import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = ["Workflow", "Changelog", "Docs"];

type NavbarProps = {
  onAuth: () => void;
};

export function Navbar({ onAuth }: NavbarProps) {
  const [open, setOpen] = useState(false);

  function openAuth() {
    setOpen(false);
    onAuth();
  }

  return (
    <nav style={{ background: "#080808", borderBottom: "1px solid #222222", fontFamily: "'Archivo', sans-serif", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="#" style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "#f2f2f2", letterSpacing: "-0.03em", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#4d9eff" }}>●</span>
          BUGBYTES
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="hidden md:flex">
          {NAV_LINKS.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 500, fontSize: "0.75rem", letterSpacing: "0.1em", color: "#555555", textDecoration: "none", padding: "0.5rem 1rem", textTransform: "uppercase", transition: "color 0.15s" }} onMouseEnter={(event) => (event.currentTarget.style.color = "#f2f2f2")} onMouseLeave={(event) => (event.currentTarget.style.color = "#555555")}>
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }} className="hidden md:flex">
          <button type="button" onClick={openAuth} style={{ fontFamily: "'Archivo', sans-serif", fontSize: "0.75rem", fontWeight: 500, color: "#555555", letterSpacing: "0.05em", background: "transparent", border: "none", cursor: "pointer" }}>
            SIGN IN
          </button>
          <button type="button" onClick={openAuth} style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.08em", background: "#4d9eff", color: "#080808", padding: "0.6rem 1.25rem", textTransform: "uppercase", transition: "opacity 0.15s", border: "none", cursor: "pointer" }} onMouseEnter={(event) => (event.currentTarget.style.opacity = "0.88")} onMouseLeave={(event) => (event.currentTarget.style.opacity = "1")}>
            Get started →
          </button>
        </div>

        <button className="md:hidden" type="button" aria-label="Toggle navigation" style={{ color: "#555555", background: "none", border: "none", cursor: "pointer" }} onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div style={{ background: "#080808", borderTop: "1px solid #222222", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {NAV_LINKS.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 500, fontSize: "0.75rem", letterSpacing: "0.1em", color: "#555555", textDecoration: "none", textTransform: "uppercase" }} onClick={() => setOpen(false)}>
              {item}
            </a>
          ))}
          <button type="button" onClick={openAuth} style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.08em", background: "#4d9eff", color: "#080808", padding: "0.75rem 1.25rem", textTransform: "uppercase", textAlign: "center", marginTop: "0.5rem", border: "none", cursor: "pointer" }}>
            Get started →
          </button>
        </div>
      )}
    </nav>
  );
}
