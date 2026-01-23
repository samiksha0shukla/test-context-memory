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
