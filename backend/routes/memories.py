"""
Memory Routes
=============
API endpoints for memory CRUD operations and visualization data.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from contextmemory.db.models.memory import Memory as MemoryModel

from database import get_db
from schemas import MemoriesResponse, MemoryNode
from utils import ensure_conversation_exists, get_memory_connections
from auth.dependencies import get_current_user
from models.user import User


router = APIRouter(prefix="/api", tags=["memories"])


@router.get("/memories", response_model=MemoriesResponse)
async def get_memories(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get all memories for the authenticated user as nodes and links for visualization.
    Uses user.id as conversation_id for memory isolation.
    """
    conversation_id = user.id
    ensure_conversation_exists(db, conversation_id)

    all_memories = db.query(MemoryModel).filter(
        MemoryModel.conversation_id == conversation_id,
        MemoryModel.is_active == True
    ).all()

    nodes = []
    links = []
    seen_links = set()

    for mem in all_memories:
        connections = get_memory_connections(mem)

        node = MemoryNode(
            id=mem.id,
            text=mem.memory_text,
            type="bubble" if mem.is_episodic else "semantic",
            importance=mem.importance or 0.5,
            created_at=mem.created_at.isoformat() if mem.created_at else "",
            connections=connections,
        )
        nodes.append(node)

        # Create links (avoid duplicates)
        for conn in connections:
            target_id = conn["target_id"]
            # Use sorted tuple as key to avoid duplicate links
            link_key = tuple(sorted([mem.id, target_id]))
            if link_key not in seen_links:
                seen_links.add(link_key)
                links.append({
                    "source": mem.id,
                    "target": target_id,
                    "strength": conn["score"],
                })

    return MemoriesResponse(nodes=nodes, links=links)


@router.get("/memory/{memory_id}")
async def get_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get details for a single memory including connected memories.
    Only returns memories belonging to the authenticated user.
    """
    conversation_id = user.id

    mem = db.query(MemoryModel).filter(
        MemoryModel.id == memory_id,
        MemoryModel.conversation_id == conversation_id,
    ).first()

    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    connections = get_memory_connections(mem)

    # Fetch connected memories
    connected_memories = []
    for conn in connections:
        connected_mem = db.query(MemoryModel).filter(
            MemoryModel.id == conn["target_id"],
            MemoryModel.conversation_id == conversation_id,
        ).first()
        if connected_mem:
            connected_memories.append({
                "id": connected_mem.id,
                "text": connected_mem.memory_text,
                "type": "bubble" if connected_mem.is_episodic else "semantic",
                "score": conn["score"],
                "created_at": connected_mem.created_at.isoformat() if connected_mem.created_at else "",
            })

    return {
        "id": mem.id,
        "text": mem.memory_text,
        "type": "bubble" if mem.is_episodic else "semantic",
        "importance": mem.importance or 0.5,
        "created_at": mem.created_at.isoformat() if mem.created_at else "",
        "occurred_at": mem.occurred_at.isoformat() if mem.occurred_at else None,
        "connected_memories": connected_memories,
    }


@router.delete("/memory/{memory_id}")
async def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Delete a memory belonging to the authenticated user.
    """
    conversation_id = user.id

    mem = db.query(MemoryModel).filter(
        MemoryModel.id == memory_id,
        MemoryModel.conversation_id == conversation_id,
    ).first()

    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.delete(mem)
    db.commit()
    return {"status": "deleted", "id": memory_id}
