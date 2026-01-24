import type {
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  MemoriesResponse,
  MemoryDetail,
  User,
  SignUpRequest,
  SignInRequest,
  ApiKeyStatus,
  ValidateApiKeyResponse,
  UsageInfo,
} from "@/types/api";

export class ContextMemoryAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  // ═══════════════════════════════════════════════════════
  // AUTH METHODS
  // ═══════════════════════════════════════════════════════

  async signUp(data: SignUpRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Sign up failed");
    }

    return response.json();
  }

  async signIn(data: SignInRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Sign in failed");
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }
  }

  async refreshToken(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    return response.ok;
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const retryResponse = await fetch(`${this.baseUrl}/api/auth/me`, {
            credentials: "include",
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
        return null;
      }
      return null;
    }

    return response.json();
  }

  async getUsage(): Promise<UsageInfo> {
    const response = await fetch(`${this.baseUrl}/api/auth/usage`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get usage info");
    }

    return response.json();
  }

  // ═══════════════════════════════════════════════════════
  // API KEY METHODS
  // ═══════════════════════════════════════════════════════

  async validateApiKey(apiKey: string): Promise<ValidateApiKeyResponse> {
    const response = await fetch(`${this.baseUrl}/api/api-keys/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ api_key: apiKey }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate API key");
    }

    return response.json();
  }

  async storeApiKey(apiKey: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/api-keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ api_key: apiKey }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to store API key");
    }
  }

  async getApiKeyStatus(): Promise<ApiKeyStatus> {
    const response = await fetch(`${this.baseUrl}/api/api-keys/status`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get API key status");
    }

    return response.json();
  }

  async deleteApiKey(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/api-keys`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete API key");
    }
  }

  // ═══════════════════════════════════════════════════════
  // CHAT METHODS
  // ═══════════════════════════════════════════════════════

  async chat(message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message } as ChatRequest),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please sign in to continue");
      }
      if (response.status === 403) {
        const error = await response.json().catch(() => ({}));
        if (error.detail?.code === "API_KEY_REQUIRED") {
          throw new Error("API_KEY_REQUIRED");
        }
        throw new Error("Please add your OpenRouter API key");
      }
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getChatHistory(limit = 100, offset = 0): Promise<ChatHistoryResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/chat/history?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please sign in to continue");
      }
      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    return response.json();
  }

  // ═══════════════════════════════════════════════════════
  // MEMORY METHODS
  // ═══════════════════════════════════════════════════════

  async getMemories(): Promise<MemoriesResponse> {
    const response = await fetch(`${this.baseUrl}/api/memories`, {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please sign in to continue");
      }
      throw new Error(`Failed to fetch memories: ${response.statusText}`);
    }

    return response.json();
  }

  async getMemoryDetail(memoryId: number): Promise<MemoryDetail> {
    const response = await fetch(`${this.baseUrl}/api/memory/${memoryId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch memory detail: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteMemory(memoryId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/memory/${memoryId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete memory: ${response.statusText}`);
    }
  }
}

// Singleton instance
export const api = new ContextMemoryAPI();
