import type {
  ChatRequest,
  ChatResponse,
  MemoriesResponse,
  MemoryDetail,
} from "@/types/api";

export class ContextMemoryAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  async chat(message: string, conversationId: number = 1): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getMemories(conversationId: number = 1): Promise<MemoriesResponse> {
    const response = await fetch(`${this.baseUrl}/api/memories/${conversationId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch memories: ${response.statusText}`);
    }

    return response.json();
  }

  async getMemoryDetail(memoryId: number): Promise<MemoryDetail> {
    const response = await fetch(`${this.baseUrl}/api/memory/${memoryId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch memory detail: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteMemory(memoryId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/memory/${memoryId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete memory: ${response.statusText}`);
    }
  }
}

// Singleton instance
export const api = new ContextMemoryAPI();
