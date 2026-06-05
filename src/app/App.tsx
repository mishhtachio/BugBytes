import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { DashboardPreview } from "./components/DashboardPreview";
import { Workflow } from "./components/Workflow";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { Workspace } from "./components/Workspace";

function BugBytesApp() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<"landing" | "auth">("landing");

  if (isAuthenticated) {
    return <Workspace />;
  }

  if (screen === "auth") {
    return <AuthPage onBack={() => setScreen("landing")} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ scrollbarWidth: "none" }}>
      <style>{`::-webkit-scrollbar { display: none; } * { box-sizing: border-box; }`}</style>
      <Navbar onAuth={() => setScreen("auth")} />
      <main>
        <Hero onAuth={() => setScreen("auth")} />
        <DashboardPreview />
        <Workflow />
        <CTA onAuth={() => setScreen("auth")} />
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
