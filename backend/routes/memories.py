"""
Memory Routes
=============
API endpoints for memory CRUD operations and visualization data.
Uses local_id for per-user sequential memory numbering.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from contextmemory.db.models.memory import Memory as MemoryModel

from database import get_db
from schemas import MemoriesResponse, MemoryNode
from utils import ensure_conversation_exists, get_memory_connections, build_id_mapping
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
    Returns local_id for per-user sequential numbering (1, 2, 3...).
    """
    conversation_id = user.id
    ensure_conversation_exists(db, conversation_id)

    # Get memories ordered by creation date for consistent local_id assignment
    all_memories = db.query(MemoryModel).filter(
        MemoryModel.conversation_id == conversation_id,
        MemoryModel.is_active == True
    ).order_by(MemoryModel.created_at).all()

    # Build global_id -> local_id mapping
    id_mapping = build_id_mapping(all_memories)

    nodes = []
    links = []
    seen_links = set()

    for mem in all_memories:
        local_id = id_mapping[mem.id]
        connections = get_memory_connections(mem)

        # Convert connection target_ids to local_ids
        local_connections = []
        for conn in connections:
            target_global_id = conn["target_id"]
            if target_global_id in id_mapping:
                local_connections.append({
                    "target_id": id_mapping[target_global_id],
                    "target_global_id": target_global_id,
                    "score": conn["score"]
                })

        node = MemoryNode(
            id=mem.id,  # Keep global ID for internal use
            local_id=local_id,  # Per-user sequential ID
            text=mem.memory_text,
            type="bubble" if mem.is_episodic else "semantic",
            importance=mem.importance or 0.5,
            created_at=mem.created_at.isoformat() if mem.created_at else "",
            connections=local_connections,
        )
        nodes.append(node)

        # Create links using global IDs (for D3 visualization)
        for conn in connections:
            target_id = conn["target_id"]
            if target_id in id_mapping:
                link_key = tuple(sorted([mem.id, target_id]))
                if link_key not in seen_links:
                    seen_links.add(link_key)
                    links.append({
                        "source": mem.id,
                        "target": target_id,
                        "source_local": local_id,
                        "target_local": id_mapping[target_id],
                        "strength": conn["score"],
                    })

    return MemoriesResponse(nodes=nodes, links=links, id_mapping=id_mapping)


@router.get("/memory/{memory_id}")
async def get_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get details for a single memory including connected memories.
    Accepts either global_id or local_id via query parameter.
    """
    conversation_id = user.id

    # Get all user memories to build ID mapping
    all_memories = db.query(MemoryModel).filter(
        MemoryModel.conversation_id == conversation_id,
        MemoryModel.is_active == True
    ).order_by(MemoryModel.created_at).all()

    id_mapping = build_id_mapping(all_memories)
    reverse_mapping = {v: k for k, v in id_mapping.items()}

    # Try to find memory by global ID first
    mem = db.query(MemoryModel).filter(
        MemoryModel.id == memory_id,
        MemoryModel.conversation_id == conversation_id,
    ).first()

    # If not found, try as local_id
    if not mem and memory_id in reverse_mapping:
        global_id = reverse_mapping[memory_id]
        mem = db.query(MemoryModel).filter(
            MemoryModel.id == global_id,
            MemoryModel.conversation_id == conversation_id,
        ).first()

    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    local_id = id_mapping.get(mem.id, 0)
    connections = get_memory_connections(mem)

    # Fetch connected memories with local IDs
    connected_memories = []
    for conn in connections:
        connected_mem = db.query(MemoryModel).filter(
            MemoryModel.id == conn["target_id"],
            MemoryModel.conversation_id == conversation_id,
        ).first()
        if connected_mem:
            connected_memories.append({
                "id": connected_mem.id,
                "local_id": id_mapping.get(connected_mem.id, 0),
                "text": connected_mem.memory_text,
                "type": "bubble" if connected_mem.is_episodic else "semantic",
                "score": conn["score"],
                "created_at": connected_mem.created_at.isoformat() if connected_mem.created_at else "",
            })

    return {
        "id": mem.id,
        "local_id": local_id,
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
    Accepts global_id.
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
