"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, Technician, AccountType } from "./types";
import { mockTechnician } from "./mock-data";
// Wave1: wire sign-in to d2-openapi contract (mock adapter)
import { wave1SignIn, wave1SignOut } from "./wave1-auth";

interface AuthContextValue {
  auth: AuthState;
  login: (
    email: string,
    password: string,
    impersonated?: boolean,
    shopName?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateTechnician: (data: Partial<Technician>) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  clearForceChange: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  auth: { isAuthenticated: false, technician: null, isImpersonated: false },
  login: async () => false,
  logout: () => {},
  updateTechnician: () => {},
  changePassword: () => false,
  clearForceChange: () => {},
});

const SESSION_KEY = "weeet_auth";

// DEV_NAV bypass: compute initial auth synchronously (กัน race condition กับ AppLayout useEffect)
// useEffect ของ child (AppLayout) รันก่อน parent (AuthProvider) → ต้องใช้ initial state ไม่ใช่ useEffect
function getInitialAuth(): AuthState {
  if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
    return { isAuthenticated: true, technician: mockTechnician, isImpersonated: false };
  }
  return { isAuthenticated: false, technician: null, isImpersonated: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getInitialAuth);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return; // bypass handled in initial state
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setAuth(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = (next: AuthState) => {
    setAuth(next);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  };

  const login = async (
    email: string,
    password: string,
    impersonated = false,
    shopName?: string
  ): Promise<boolean> => {
    if (!email) return false;

    // Mock: password "changeme123" simulates a rented account (force change password)
    const isRented = password === "changeme123";
    const accountType: AccountType = isRented ? "rented" : "default";

    // Wave1: call d2-openapi /auth/signin (mock adapter — replace with real API in Wave2)
    const authResult = await wave1SignIn(email, password);
    if (!authResult) return false;

    const newAuth: AuthState = {
      isAuthenticated: true,
      technician: mockTechnician,
      isImpersonated: impersonated,
      impersonatedByShop: shopName,
      accountType,
      forceChangePassword: isRented,
      // Wave1: JWT token from d2 contract AuthResponse
      token: authResult.access_token,
    };
    persist(newAuth);
    return true;
  };

  const logout = () => {
    // Wave1: clear JWT token via wave1-auth
    wave1SignOut();
    const cleared: AuthState = {
      isAuthenticated: false,
      technician: null,
      isImpersonated: false,
    };
    setAuth(cleared);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const updateTechnician = (data: Partial<Technician>) => {
    if (!auth.technician) return;
    const next: AuthState = {
      ...auth,
      technician: { ...auth.technician, ...data },
    };
    persist(next);
  };

  const changePassword = (_currentPassword: string, _newPassword: string): boolean => {
    // Mock: accept any non-empty passwords as valid
    if (!_currentPassword || !_newPassword) return false;
    return true;
  };

  const clearForceChange = () => {
    const next: AuthState = { ...auth, forceChangePassword: false };
    persist(next);
  };

  return (
    <AuthContext.Provider
      value={{ auth, login, logout, updateTechnician, changePassword, clearForceChange }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
