import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  _id: string;
  username: string;
  role: "admin" | "staff";
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("siddha_user");
    if (!saved || saved === "undefined" || saved === "null") return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("siddha_user", JSON.stringify(data.user));
      localStorage.setItem("siddha_token", data.token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("siddha_user");
    localStorage.removeItem("siddha_token");
    sessionStorage.removeItem("lowStockAlertShown"); // Clear alert flag on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
