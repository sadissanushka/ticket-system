"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Matching Prisma schema and Auth route response
export type User = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "ADMIN" | "TECHNICIAN";
  department?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for existing session on mount
    const storedToken = localStorage.getItem("helpdesk_token");
    const storedUser = localStorage.getItem("helpdesk_user");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("helpdesk_token");
        localStorage.removeItem("helpdesk_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("helpdesk_token", token);
    localStorage.setItem("helpdesk_user", JSON.stringify(userData));
    setUser(userData);

    // Redirect based on role
    if (userData.role === "ADMIN") {
      router.push("/dashboard/admin");
    } else if (userData.role === "TECHNICIAN") {
      router.push("/dashboard/technician");
    } else {
      router.push("/dashboard");
    }
  };

  const logout = () => {
    localStorage.removeItem("helpdesk_token");
    localStorage.removeItem("helpdesk_user");
    setUser(null);
    router.push("/login");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("helpdesk_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context easily
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
