"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, Technician, AccountType } from "./types";
import { mockTechnician } from "./mock-data";

interface AuthContextValue {
  auth: AuthState;
  login: (
    email: string,
    password: string,
    impersonated?: boolean,
    shopName?: string
  ) => boolean;
  logout: () => void;
  updateTechnician: (data: Partial<Technician>) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  clearForceChange: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  auth: { isAuthenticated: false, technician: null, isImpersonated: false },
  login: () => false,
  logout: () => {},
  updateTechnician: () => {},
  changePassword: () => false,
  clearForceChange: () => {},
});

const SESSION_KEY = "weeet_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    technician: null,
    isImpersonated: false,
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setAuth(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = (next: AuthState) => {
    setAuth(next);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  };

  const login = (
    email: string,
    password: string,
    impersonated = false,
    shopName?: string
  ): boolean => {
    if (!email) return false;

    // Mock: password "changeme123" simulates a rented account (force change password)
    const isRented = password === "changeme123";
    const accountType: AccountType = isRented ? "rented" : "default";

    const newAuth: AuthState = {
      isAuthenticated: true,
      technician: mockTechnician,
      isImpersonated: impersonated,
      impersonatedByShop: shopName,
      accountType,
      forceChangePassword: isRented,
    };
    persist(newAuth);
    return true;
  };

  const logout = () => {
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
    // In mock mode, always succeed
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
