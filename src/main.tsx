import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./app/App.tsx";
import "./styles/index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById("root")!;

if (!PUBLISHABLE_KEY) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables.");
  createRoot(rootElement).render(
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#080808",
      color: "#e4e4e7",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
      textAlign: "center"
    }}>
      <div style={{
        backgroundColor: "#18181b",
        border: "1px solid #27272a",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "480px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{ color: "#ef4444", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Setup Incomplete
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px", color: "#fafafa" }}>
          Missing Clerk Publishable Key
        </h1>
        <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
          The environment variable <code style={{ backgroundColor: "#27272a", padding: "2px 6px", borderRadius: "4px", color: "#38bdf8" }}>VITE_CLERK_PUBLISHABLE_KEY</code> is missing from your Vercel deployment.
        </p>
        <div style={{ backgroundColor: "#09090b", borderRadius: "8px", padding: "16px", textAlign: "left", fontSize: "13px", color: "#d4d4d8", lineHeight: "1.6" }}>
          <strong>How to fix:</strong>
          <ol style={{ paddingLeft: "18px", margin: "8px 0 0 0" }}>
            <li>Open your Vercel Dashboard &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
            <li>Add <code style={{ color: "#38bdf8" }}>VITE_CLERK_PUBLISHABLE_KEY</code> with your Clerk key.</li>
            <li>Go to <strong>Deployments</strong> and trigger a <strong>Redeploy</strong> (builds inline Vite env vars).</li>
          </ol>
        </div>
      </div>
    </div>
  );
} else {
  createRoot(rootElement).render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  );
}
