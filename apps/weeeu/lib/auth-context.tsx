"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Wave1 mock token (matches d2-openapi.yaml / auth.fixtures.ts shape)
const WAVE1_MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXdlZWV1LTAwMSIsInJvbGUiOiJ3ZWVldSIsImlhdCI6MTc0OTQ3MjAwMCwiZXhwIjoxNzQ5NDczMDAwfQ.mock";

const LS_TOKEN_KEY = "access_token";

export interface AuthUser {
  id: string;
  email: string;
  role: "weeeu";
  displayName: string;
  goldBalance: number;
  silverBalance: number;
}

// Wave1 default user (matches mock-fixtures/auth.fixtures.ts + points.fixtures.ts)
const WAVE1_USER: Omit<AuthUser, "email"> = {
  id: "user-weeeu-001",
  role: "weeeu",
  displayName: "สมชาย ใจดี",
  goldBalance: 350,
  silverBalance: 120,
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Mock login: stores token in localStorage, resolves after ~600ms */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(LS_TOKEN_KEY) : null;
    if (token) {
      setUser({ ...WAVE1_USER, email: "weeeu@app3r.test" });
    }
  }, []);

  const login = async (email: string, _password: string) => {
    // Wave1: mock — simulate API call latency then store token
    await new Promise<void>((r) => setTimeout(r, 600));
    localStorage.setItem(LS_TOKEN_KEY, WAVE1_MOCK_TOKEN);
    setUser({ ...WAVE1_USER, email });
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth — consume auth state in any client component */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
