"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import type { User, SignUpRequest, SignInRequest, ApiKeyStatus, ChatUsageInfo } from "@/types/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  apiKeyStatus: ApiKeyStatus | null;
  needsApiKey: boolean; // True when free trial expired and no API key
  signUp: (data: SignUpRequest) => Promise<void>;
  signIn: (data: SignInRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshApiKeyStatus: () => Promise<void>;
  updateUsageFromChat: (usage: ChatUsageInfo) => void;
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

  // Update usage info from chat response (avoids extra API call)
  const updateUsageFromChat = useCallback((usage: ChatUsageInfo) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        usage: {
          ...prev.usage,
          free_messages_remaining: usage.free_messages_remaining,
          free_message_limit: usage.free_message_limit,
          has_api_key: usage.has_api_key,
          message_count: prev.usage.free_message_limit - usage.free_messages_remaining,
        },
      };
    });
  }, []);

  // Compute if user needs API key (free trial expired and no key)
  const needsApiKey = !!(
    user &&
    user.usage.free_messages_remaining === 0 &&
    !user.usage.has_api_key
  );

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
        needsApiKey,
        signUp,
        signIn,
        logout,
        refreshUser,
        refreshApiKeyStatus,
        updateUsageFromChat,
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
