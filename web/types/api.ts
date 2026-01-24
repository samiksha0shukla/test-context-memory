// Auth types
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ApiKeyStatus {
  has_key: boolean;
  is_valid: boolean;
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  message: string;
}

// Chat types
export interface ChatRequest {
  message: string;
}

export interface ExtractedMemory {
  id: number;  // Global database ID
  local_id: number;  // Per-user sequential ID
  text: string;
  type: string;
}

export interface ChatResponse {
  response: string;
  extracted_memories: {
    semantic: ExtractedMemory[];
    bubbles: ExtractedMemory[];
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
    id: number;  // Global database ID
    local_id: number;  // Per-user sequential ID
    text: string;
    type: string;
    importance: number;
    created_at: string;
    connections: Array<{
      target_id: number;
      target_global_id?: number;
      score: number;
    }>;
  }>;
  links: Array<{
    source: number;
    target: number;
    source_local?: number;
    target_local?: number;
    strength: number;
  }>;
  id_mapping?: Record<number, number>;  // global_id -> local_id
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
