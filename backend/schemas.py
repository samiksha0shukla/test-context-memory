"""
Pydantic Schemas
================
Request and response models for API endpoints.
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


# ═══════════════════════════════════════════════════════
# REQUEST MODELS
# ═══════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str


# ═══════════════════════════════════════════════════════
# RESPONSE MODELS
# ═══════════════════════════════════════════════════════

class ExtractedMemory(BaseModel):
    id: int  # Global database ID
    local_id: int  # Per-user sequential ID (1, 2, 3...)
    text: str
    type: str


class UsageInfo(BaseModel):
    free_messages_remaining: int
    free_message_limit: int
    has_api_key: bool


class ChatResponse(BaseModel):
    response: str
    extracted_memories: Dict[str, List[ExtractedMemory]]
    relevant_memories: List[Dict[str, Any]]
    usage: Optional[UsageInfo] = None


class MemoryNode(BaseModel):
    id: int  # Global database ID (used for connections/links)
    local_id: int  # Per-user sequential ID (displayed to user)
    text: str
    type: str  # "semantic" or "bubble"
    importance: float
    created_at: str
    connections: List[Dict[str, Any]]


class MemoriesResponse(BaseModel):
    nodes: List[MemoryNode]
    links: List[Dict[str, Any]]
    # Mapping of global ID to local ID for link resolution
    id_mapping: Optional[Dict[int, int]] = None


# ═══════════════════════════════════════════════════════
# CHAT HISTORY MODELS
# ═══════════════════════════════════════════════════════

class ChatMessageSchema(BaseModel):
    id: int
    role: str  # "user" or "assistant"
    content: str
    extracted_memories: Optional[Dict[str, List[Dict[str, Any]]]] = None
    created_at: str


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageSchema]
    total: int
    has_more: bool
