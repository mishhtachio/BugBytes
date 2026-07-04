import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";

export type AuthProviderName = "google" | "github";

export type BugBytesUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username?: string;
};

type AuthContextValue = {
  user: BugBytesUser | null;
  isAuthenticated: boolean;
  token: string | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: AuthProviderName) => void;
  logout: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useClerkUser();

  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Sync token from Clerk
  useEffect(() => {
    async function fetchToken() {
      if (isSignedIn) {
        try {
          const t = await getToken();
          setSessionToken(t);
        } catch (e) {
          console.error("Error getting Clerk session token:", e);
        }
      } else {
        setSessionToken(null);
      }
    }
    fetchToken();
  }, [isSignedIn, getToken]);

  // Loading state gate
  useEffect(() => {
    if (authLoaded && userLoaded) {
      setLoading(false);
    }
  }, [authLoaded, userLoaded]);

  // Map Clerk user to BugBytes user structure
  const mappedUser = useMemo<BugBytesUser | null>(() => {
    if (!isSignedIn || !clerkUser) return null;

    const initials = clerkUser.fullName
      ? clerkUser.fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || "U"
      : clerkUser.primaryEmailAddress?.emailAddress[0].toUpperCase() || "U";

    return {
      id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.username || "User",
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      avatar: initials,
      username: clerkUser.username || undefined
    };
  }, [isSignedIn, clerkUser]);

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    } as Record<string, string>;

    const freshToken = await getToken();
    if (freshToken) {
      headers["Authorization"] = `Bearer ${freshToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Request failed");
    }

    return res.json();
  };

  // Automatically sync user profile details (including username) to backend
  useEffect(() => {
    async function syncProfile() {
      if (isSignedIn && clerkUser && mappedUser) {
        try {
          await apiFetch("/api/users/sync", {
            method: "POST",
            body: JSON.stringify({
              name: mappedUser.name,
              username: clerkUser.username || "",
              avatar: mappedUser.avatar,
              email: mappedUser.email
            })
          });
        } catch (e) {
          console.error("Auto-sync profile failed:", e);
        }
      }
    }
    syncProfile();
  }, [isSignedIn, clerkUser, mappedUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: mappedUser,
      isAuthenticated: Boolean(isSignedIn),
      token: sessionToken,
      async loginWithEmail(email, password) {
        console.warn("Sign in handled directly via Clerk Components.");
      },
      async signUpWithEmail(name, email, password) {
        console.warn("Sign up handled directly via Clerk Components.");
      },
      loginWithOAuth(provider) {
        console.warn("OAuth redirects handled directly via Clerk Components.");
      },
      logout() {
        signOut();
      },
      apiFetch,
    }),
    [mappedUser, isSignedIn, sessionToken, signOut, getToken]
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "grid", placeItems: "center", color: "#4d9eff", fontFamily: "'DM Mono', monospace", fontSize: "12px", letterSpacing: "0.1em" }}>
        INITIALIZING CLERK SESSION...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
