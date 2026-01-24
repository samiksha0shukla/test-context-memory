"""
Utility Functions
=================
Helper functions for memory operations and conversation management.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from contextmemory.db.models.conversation import Conversation
from contextmemory.db.models.memory import Memory as MemoryModel


def ensure_conversation_exists(db: Session, conversation_id: int) -> int:
    """Create conversation if it doesn't exist."""
    existing = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not existing:
        conv = Conversation(id=conversation_id)
        db.add(conv)
        db.commit()
    return conversation_id


def get_memory_connections(mem: MemoryModel) -> List[Dict[str, Any]]:
    """Extract connections from memory metadata."""
    connections = []
    if mem.memory_metadata and isinstance(mem.memory_metadata, dict):
        conn_data = mem.memory_metadata.get("connections", {})
        if isinstance(conn_data, dict):
            bubble_ids = conn_data.get("bubble_ids", [])
            scores = conn_data.get("scores", {})
            for bid in bubble_ids:
                connections.append({
                    "target_id": bid,
                    "score": scores.get(str(bid), 0.5)
                })
    return connections


def build_id_mapping(memories: List[MemoryModel]) -> Dict[int, int]:
    """
    Build a mapping from global database IDs to per-user local IDs.
    
    Args:
        memories: List of memories ordered by created_at
        
    Returns:
        Dict mapping global_id -> local_id (1, 2, 3, ...)
    """
    mapping = {}
    for index, mem in enumerate(memories, start=1):
        mapping[mem.id] = index
    return mapping


def get_local_id_for_memory(
    db: Session,
    conversation_id: int,
    memory_id: int
) -> int:
    """
    Get the local_id for a specific memory within a conversation.
    
    Args:
        db: Database session
        conversation_id: The conversation/user ID
        memory_id: The global memory ID
        
    Returns:
        The local_id (position in the user's memory sequence)
    """
    all_memories = db.query(MemoryModel).filter(
        MemoryModel.conversation_id == conversation_id,
        MemoryModel.is_active == True
    ).order_by(MemoryModel.created_at).all()
    
    id_mapping = build_id_mapping(all_memories)
    return id_mapping.get(memory_id, 0)
