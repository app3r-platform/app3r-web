"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, Technician } from "./types";
import { mockTechnician } from "./mock-data";

const AuthContext = createContext<{
  auth: AuthState;
  login: (email: string, password: string, impersonated?: boolean, shopName?: string) => boolean;
  logout: () => void;
}>({
  auth: { isAuthenticated: false, technician: null, isImpersonated: false },
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    technician: null,
    isImpersonated: false,
  });

  useEffect(() => {
    // Restore session from sessionStorage (mockup)
    try {
      const stored = sessionStorage.getItem("weeet_auth");
      if (stored) setAuth(JSON.parse(stored));
    } catch {}
  }, []);

  const login = (email: string, _password: string, impersonated = false, shopName?: string): boolean => {
    // Mock: accept any email/password
    if (!email) return false;
    const newAuth: AuthState = {
      isAuthenticated: true,
      technician: mockTechnician,
      isImpersonated: impersonated,
      impersonatedByShop: shopName,
    };
    setAuth(newAuth);
    sessionStorage.setItem("weeet_auth", JSON.stringify(newAuth));
    return true;
  };

  const logout = () => {
    const cleared: AuthState = { isAuthenticated: false, technician: null, isImpersonated: false };
    setAuth(cleared);
    sessionStorage.removeItem("weeet_auth");
  };

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
