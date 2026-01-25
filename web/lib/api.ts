import type {
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  MemoriesResponse,
  MemoryDetail,
  User,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  TokenResponse,
  ApiKeyStatus,
  ValidateApiKeyResponse,
  UsageInfo,
} from "@/types/api";

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export class ContextMemoryAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else {
      // In development, default to localhost if not specified
      // In production, default to empty string (relative path) to use Next.js rewrites
      const defaultUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
    }
  }

  // ═══════════════════════════════════════════════════════
  // TOKEN MANAGEMENT
  // ═══════════════════════════════════════════════════════

  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
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
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Sign up failed");
    }

    const authResponse: AuthResponse = await response.json();
    this.setTokens(authResponse.access_token, authResponse.refresh_token);
    return authResponse.user;
  }

  async signIn(data: SignInRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Sign in failed");
    }

    const authResponse: AuthResponse = await response.json();
    this.setTokens(authResponse.access_token, authResponse.refresh_token);
    return authResponse.user;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    try {
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const tokenResponse: TokenResponse = await response.json();
      localStorage.setItem(ACCESS_TOKEN_KEY, tokenResponse.access_token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const retryResponse = await fetch(`${this.baseUrl}/api/auth/me`, {
            headers: this.getAuthHeaders(),
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
        this.clearTokens();
        return null;
      }
      return null;
    }

    return response.json();
  }

  async getUsage(): Promise<UsageInfo> {
    const response = await fetch(`${this.baseUrl}/api/auth/usage`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get usage info");
    }

    return response.json();
  }

  // Check if user has tokens stored (for initial auth check)
  hasStoredTokens(): boolean {
    return !!this.getAccessToken();
  }

  // ═══════════════════════════════════════════════════════
  // API KEY METHODS
  // ═══════════════════════════════════════════════════════

  async validateApiKey(apiKey: string): Promise<ValidateApiKeyResponse> {
    const response = await fetch(`${this.baseUrl}/api/api-keys/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
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
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to store API key");
    }
  }

  async getApiKeyStatus(): Promise<ApiKeyStatus> {
    const response = await fetch(`${this.baseUrl}/api/api-keys/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get API key status");
    }

    return response.json();
  }

  async deleteApiKey(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/api-keys`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
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
        ...this.getAuthHeaders(),
      },
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
        headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request after refreshing
          const retryResponse = await fetch(`${this.baseUrl}/api/memories`, {
            headers: this.getAuthHeaders(),
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
        throw new Error("Please sign in to continue");
      }
      throw new Error(`Failed to fetch memories: ${response.statusText}`);
    }

    return response.json();
  }

  async getMemoryDetail(memoryId: number): Promise<MemoryDetail> {
    const response = await fetch(`${this.baseUrl}/api/memory/${memoryId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch memory detail: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteMemory(memoryId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/memory/${memoryId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete memory: ${response.statusText}`);
    }
  }
}

// Singleton instance
export const api = new ContextMemoryAPI();
