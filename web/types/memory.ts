export interface Memory {
  id: number;  // Global database ID
  local_id: number;  // Per-user sequential ID (1, 2, 3...)
  text: string;
  type: "semantic" | "bubble";
  importance: number;
  created_at: string;
  connections: Connection[];
}

export interface Connection {
  target_id: number;  // Can be global or local ID based on context
  target_global_id?: number;  // Global ID for linking
  score: number;
}

export interface MemoryNode extends Memory {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  radius?: number;
  validConnectionCount?: number;
}

export interface MemoryLink {
  source: number | MemoryNode;
  target: number | MemoryNode;
  source_local?: number;  // Local ID of source
  target_local?: number;  // Local ID of target
  strength: number;
}

export interface ExtractedMemory {
  id: number;  // Global ID
  local_id: number;  // Per-user sequential ID
  text: string;
  type: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  extractedMemories?: {
    semantic: ExtractedMemory[];
    bubbles: ExtractedMemory[];
  };
}

export interface MemoriesResponse {
  nodes: Memory[];
  links: MemoryLink[];
  id_mapping?: Record<number, number>;  // global_id -> local_id
}
