"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { tokenManager } from "./token-manager";

interface Staff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface AuthContextType {
  staff: Staff | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = tokenManager.getToken();
    const staffData = tokenManager.getStaffData();

    if (token && staffData) {
      setStaff(staffData);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/staff-auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for HTTP-only cookie handling
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();

      // Token is stored in HTTP-only cookie by backend
      // Store staff data and expiry for client-side reference
      tokenManager.setStaffData(data.staff);
      if (data.expiresIn) {
        const expiryTime = new Date().getTime() + data.expiresIn * 1000;
        sessionStorage.setItem("token_expiry", expiryTime.toString());
      }

      setStaff(data.staff);
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // No need to send token since it's in HTTP-only cookie
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/staff-auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for HTTP-only cookie handling
        },
      );

      if (!response.ok) {
        console.error("Logout API error");
      }
    } catch (err: any) {
      console.error("Logout error:", err);
    } finally {
      tokenManager.clear();
      setStaff(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    staff,
    isLoading,
    isAuthenticated: !!staff,
    login,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
