import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SignIn, SignUp } from "@clerk/clerk-react";

type AuthPageProps = {
  onBack: () => void;
};

export function AuthPage({ onBack }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Custom Clerk dark theme styling matches our theme.css values
  const clerkAppearance = {
    variables: {
      colorPrimary: "#4d9eff",
      colorBackground: "#080808",
      colorText: "#f2f2f2",
      colorInputBackground: "#111111",
      colorInputText: "#f2f2f2",
      colorTextSecondary: "#888888",
      colorBorder: "#222222",
      colorTextOnPrimaryBackground: "#080808"
    },
    elements: {
      card: { 
        background: "#080808", 
        border: "1px solid #222222",
        borderRadius: "4px",
        boxShadow: "none"
      },
      headerTitle: {
        fontFamily: "'Archivo', sans-serif",
        fontWeight: 900,
        textTransform: "uppercase" as const,
        letterSpacing: "-0.04em"
      },
      headerSubtitle: {
        fontFamily: "'Inter', sans-serif",
        color: "#555555"
      },
      socialButtonsBlockButton: {
        background: "transparent",
        border: "1px solid #222222",
        color: "#f2f2f2",
        "&:hover": {
          background: "#111111"
        }
      },
      formButtonPrimary: {
        fontFamily: "'Archivo', sans-serif",
        fontWeight: 900,
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        borderRadius: "2px"
      },
      formFieldInput: {
        borderRadius: "2px",
        border: "1px solid #222222"
      },
      footerActionText: {
        color: "#555"
      },
      footerActionLink: {
        color: "#4d9eff",
        "&:hover": {
          color: "#fff"
        }
      }
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "#f2f2f2", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 520px)" }} className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        {/* Left Side Branding Panel */}
        <section style={{ padding: "2rem", borderRight: "1px solid #222222", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 560 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", width: "fit-content", background: "transparent", border: "1px solid #222222", color: "#555555", padding: "0.7rem 0.9rem", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2rem", fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.03em" }}>
              <span style={{ width: 10, height: 10, background: "#4d9eff", borderRadius: "50%", display: "inline-block" }} />
              BUGBYTES
            </div>
            <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "clamp(3.5rem, 9vw, 8rem)", lineHeight: 0.9, letterSpacing: "-0.05em", textTransform: "uppercase", margin: 0 }}>
              Enter your
              <br />
              workspace<span style={{ color: "#4d9eff" }}>.</span>
            </h1>
            <p style={{ margin: "1.5rem 0 0", maxWidth: 520, color: "#555555", lineHeight: 1.8, fontSize: "0.95rem" }}>
              Sign in first, then BugBytes opens the issue tracker for your team. This keeps projects, assignments, comments, and progress tied to your secure Clerk session.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid #222222" }} className="grid-cols-1 sm:grid-cols-3">
            {["Clerk Security", "Session saved", "Workspace gated"].map((label, index) => (
              <div key={label} style={{ padding: "1rem", borderRight: index < 2 ? "1px solid #222222" : "none" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", color: "#4d9eff", fontSize: 10, letterSpacing: "0.12em" }}>0{index + 1}</div>
                <div style={{ marginTop: "0.5rem", fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side Clerk Form Panel */}
        <section style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#0d0d0d" }}>
          {/* Navigation Tab to toggle active view */}
          <div style={{ display: "flex", border: "1px solid #222222", background: "#080808", padding: "2px", marginBottom: "1.5rem", width: "100%", maxWidth: "400px" }}>
            <button
              onClick={() => setMode("login")}
              style={{ flex: 1, background: mode === "login" ? "#4d9eff" : "transparent", color: mode === "login" ? "#080808" : "#555", border: "none", padding: "0.6rem", cursor: "pointer", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              style={{ flex: 1, background: mode === "signup" ? "#4d9eff" : "transparent", color: mode === "signup" ? "#080808" : "#555", border: "none", padding: "0.6rem", cursor: "pointer", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}
            >
              Create Account
            </button>
          </div>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            {mode === "login" ? (
              <SignIn routing="hash" appearance={clerkAppearance} />
            ) : (
              <SignUp routing="hash" appearance={clerkAppearance} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
