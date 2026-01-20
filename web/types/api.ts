export interface ChatRequest {
  message: string;
  conversation_id: number;
}

export interface ChatResponse {
  response: string;
  extracted_memories: {
    semantic: string[];
    bubbles: string[];
  };
  relevant_memories: RelevantMemory[];
}

export interface RelevantMemory {
  memory_id: number;
  memory: string;
  type: string;
  score: number;
  occurred_at?: string;
  connections?: number[];
}

export interface MemoriesResponse {
  nodes: Array<{
    id: number;
    text: string;
    type: string;
    importance: number;
    created_at: string;
    connections: Array<{
      target_id: number;
      score: number;
    }>;
  }>;
  links: Array<{
    source: number;
    target: number;
    strength: number;
  }>;
}

export interface MemoryDetail {
  id: number;
  text: string;
  type: string;
  importance: number;
  created_at: string;
  occurred_at: string | null;
  connected_memories: Array<{
    id: number;
    text: string;
    type: string;
    score: number;
    created_at: string;
  }>;
}
