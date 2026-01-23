"""
Pydantic Schemas
================
Request and response models for API endpoints.
"""

from pydantic import BaseModel
from typing import List, Dict, Any


# ═══════════════════════════════════════════════════════
# REQUEST MODELS
# ═══════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    conversation_id: int = 1


# ═══════════════════════════════════════════════════════
# RESPONSE MODELS
# ═══════════════════════════════════════════════════════

class ExtractedMemory(BaseModel):
    id: int
    text: str
    type: str


class ChatResponse(BaseModel):
    response: str
    extracted_memories: Dict[str, List[ExtractedMemory]]
    relevant_memories: List[Dict[str, Any]]


class MemoryNode(BaseModel):
    id: int
    text: str
    type: str  # "semantic" or "bubble"
    importance: float
    created_at: str
    connections: List[Dict[str, Any]]


class MemoriesResponse(BaseModel):
    nodes: List[MemoryNode]
    links: List[Dict[str, Any]]
