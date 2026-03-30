"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/services";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "helpdesk_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await api.post<{ success: boolean; user?: User; error?: string }>("/auth/login", { email, password });
    
    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data?.success && result.data.user) {
      setUser(result.data.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data.user));
      return { success: true };
    }

    return { success: false, error: result.data?.error || "Erro ao fazer login" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
