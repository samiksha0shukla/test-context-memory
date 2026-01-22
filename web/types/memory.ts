export interface Memory {
  id: number;
  text: string;
  type: "semantic" | "bubble";
  importance: number;
  created_at: string;
  connections: Connection[];
}

export interface Connection {
  target_id: number;
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
}

export interface MemoryLink {
  source: number | MemoryNode;
  target: number | MemoryNode;
  strength: number;
}

export interface ExtractedMemory {
  id: number;
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
