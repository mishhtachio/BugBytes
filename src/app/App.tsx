import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { DashboardPreview } from "./components/DashboardPreview";
import { Workflow } from "./components/Workflow";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { Workspace } from "./components/Workspace";
import { Changelog } from "./components/Changelog";
import { Docs } from "./components/Docs";

function BugBytesApp() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<"landing" | "auth" | "changelog" | "docs">("landing");

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash;
      if (hash === "#changelog") {
        setScreen("changelog");
        window.scrollTo(0, 0);
      } else if (hash === "#docs") {
        setScreen("docs");
        window.scrollTo(0, 0);
      } else if (
        hash.startsWith("#auth") ||
        hash.startsWith("#/sign-in") ||
        hash.startsWith("#/sign-up") ||
        hash.startsWith("#/factor") ||
        hash.startsWith("#/sso-callback") ||
        hash.startsWith("#/verify")
      ) {
        setScreen("auth");
      } else {
        setScreen("landing");
        if (hash === "#workflow") {
          // Allow browser to scroll to anchor
          setTimeout(() => {
            const el = document.getElementById("workflow");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 50);
        } else if (hash && hash !== "") {
          window.location.hash = "";
        }
      }
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (isAuthenticated) {
    return <Workspace />;
  }

  if (screen === "auth") {
    return <AuthPage onBack={() => { window.location.hash = ""; }} />;
  }

  if (screen === "changelog") {
    return (
      <div className="min-h-screen bg-background text-foreground" style={{ scrollbarWidth: "none" }}>
        <style>{`::-webkit-scrollbar { display: none; } * { box-sizing: border-box; }`}</style>
        <Navbar onAuth={() => { window.location.hash = "#auth"; }} />
        <main>
          <Changelog />
        </main>
        <Footer />
      </div>
    );
  }

  if (screen === "docs") {
    return (
      <div className="min-h-screen bg-background text-foreground" style={{ scrollbarWidth: "none" }}>
        <style>{`::-webkit-scrollbar { display: none; } * { box-sizing: border-box; }`}</style>
        <Navbar onAuth={() => { window.location.hash = "#auth"; }} />
        <main>
          <Docs />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ scrollbarWidth: "none" }}>
      <style>{`::-webkit-scrollbar { display: none; } * { box-sizing: border-box; }`}</style>
      <Navbar onAuth={() => { window.location.hash = "#auth"; }} />
      <main>
        <Hero onAuth={() => { window.location.hash = "#auth"; }} />
        <DashboardPreview />
        <Workflow />
        <CTA onAuth={() => { window.location.hash = "#auth"; }} />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BugBytesApp />
    </AuthProvider>
  );
}
