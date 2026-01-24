"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import type { User, SignUpRequest, SignInRequest, ApiKeyStatus } from "@/types/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  apiKeyStatus: ApiKeyStatus | null;
  signUp: (data: SignUpRequest) => Promise<void>;
  signIn: (data: SignInRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshApiKeyStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshApiKeyStatus = useCallback(async () => {
    if (!user) {
      setApiKeyStatus(null);
      return;
    }
    try {
      const status = await api.getApiKeyStatus();
      setApiKeyStatus(status);
    } catch {
      setApiKeyStatus(null);
    }
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const status = await api.getApiKeyStatus();
          setApiKeyStatus(status);
        }
      } catch {
        setUser(null);
        setApiKeyStatus(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const signUp = async (data: SignUpRequest) => {
    const newUser = await api.signUp(data);
    setUser(newUser);
    setApiKeyStatus({ has_key: false, is_valid: false });
  };

  const signIn = async (data: SignInRequest) => {
    const loggedInUser = await api.signIn(data);
    setUser(loggedInUser);
    // Refresh API key status after login
    try {
      const status = await api.getApiKeyStatus();
      setApiKeyStatus(status);
    } catch {
      setApiKeyStatus(null);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setApiKeyStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        apiKeyStatus,
        signUp,
        signIn,
        logout,
        refreshUser,
        refreshApiKeyStatus,
      }}
    >
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
