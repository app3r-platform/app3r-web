"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthState, Technician, AccountType } from "./types";
import { mockTechnician } from "./mock-data";
import { getDevToken } from "./api";

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

// Dev token credentials from env (TD-04)
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? "";
const DEV_SHOP_ID = process.env.NEXT_PUBLIC_DEV_SHOP_ID ?? "";
const DEV_PHONE = process.env.NEXT_PUBLIC_DEV_PHONE ?? "+66812345678";

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

    // TD-04: Attempt to get a real dev token from backend
    let token: string | undefined;
    if (DEV_USER_ID && DEV_SHOP_ID) {
      try {
        token = await getDevToken({
          user_id: DEV_USER_ID,
          role: "weeet",
          phone: DEV_PHONE,
          shop_id: DEV_SHOP_ID,
        });
      } catch {
        // Dev token unavailable — continue with mock (null token)
        token = undefined;
      }
    }

    const newAuth: AuthState = {
      isAuthenticated: true,
      technician: mockTechnician,
      isImpersonated: impersonated,
      impersonatedByShop: shopName,
      accountType,
      forceChangePassword: isRented,
      token,
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
