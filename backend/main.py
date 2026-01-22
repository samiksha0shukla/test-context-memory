"""
FastAPI Backend for ContextMemory Chatbot
==========================================
Provides API endpoints for the Next.js frontend to interact with ContextMemory.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Generator
from datetime import datetime
from sqlalchemy.orm import Session
import json

from openai import OpenAI

# ContextMemory imports
from contextmemory import (
    configure,
    create_table,
    Memory,
    SessionLocal,
)
from contextmemory.db.models.conversation import Conversation
from contextmemory.db.models.memory import Memory as MemoryModel

# ═══════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════

OPENROUTER_API_KEY = "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"
DATABASE_URL = "postgresql://neondb_owner:npg_HXf1hbaKRBT2@ep-odd-shape-a1aiejrv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

LLM_MODEL = "openai/gpt-4o-mini"
EXTRACTION_MODEL = "anthropic/claude-sonnet-4.5"
EMBEDDING_MODEL = "openai/text-embedding-3-small"

# Configure ContextMemory
configure(
    openrouter_api_key=OPENROUTER_API_KEY,
    llm_provider="openrouter",
    llm_model=EXTRACTION_MODEL,
    embedding_model=EMBEDDING_MODEL,
    database_url=DATABASE_URL,
)

# Create tables
create_table()

# Initialize chat client
chat_client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

# ═══════════════════════════════════════════════════════
# DATABASE DEPENDENCY
# ═══════════════════════════════════════════════════════

def get_db() -> Generator[Session, None, None]:
    """Dependency that creates a fresh database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ═══════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════

app = FastAPI(
    title="ContextMemory API",
    description="API for ContextMemory chatbot with bubble visualization",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    conversation_id: int = 1

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

# ═══════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════

def ensure_conversation_exists(db: Session, conversation_id: int):
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

# ═══════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {"message": "ContextMemory API", "status": "running"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Send a message, get AI response, and extract memories.
    """
    ensure_conversation_exists(db, request.conversation_id)
    
    # Create memory instance with fresh session
    memory = Memory(db)
    
    # 1. Search relevant memories
    search_results = memory.search(
        query=request.message,
        conversation_id=request.conversation_id,
        limit=5,
    )
    
    relevant_memories = search_results.get("results", [])
    
    # Format memories for prompt
    memories_str = ""
    for entry in relevant_memories:
        mem_type = entry.get("type", "semantic")
        memories_str += f"- [{mem_type}] {entry['memory']}\n"
    
    if not memories_str:
        memories_str = "No relevant memories found."
    
    # 2. Build prompt
    system_prompt = f"""You are a helpful AI assistant with access to the user's memories.
Use the provided memories to give personalized, contextual responses.

User Memories:
{memories_str}

Instructions:
- Reference relevant memories when appropriate
- Remember context from previous conversations
- Be helpful, conversational, and friendly"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message},
    ]
    
    # 3. Call LLM
    response = chat_client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
    )
    
    assistant_response = response.choices[0].message.content
    
    # 4. Store memories
    full_messages = [
        {"role": "user", "content": request.message},
        {"role": "assistant", "content": assistant_response},
    ]
    
    result = memory.add(
        messages=full_messages,
        conversation_id=request.conversation_id,
    )

    # Get the newly created memory IDs by querying the latest memories
    semantic_texts = result.get("semantic", []) if result else []
    bubble_texts = result.get("bubbles", []) if result else []

    # Fetch the IDs of newly created memories
    extracted_semantic = []
    extracted_bubbles = []

    if semantic_texts or bubble_texts:
        # Get recent memories to find the IDs of newly extracted ones
        recent_memories = (
            db.query(MemoryModel)
            .filter(
                MemoryModel.conversation_id == request.conversation_id,
                MemoryModel.is_active == True
            )
            .order_by(MemoryModel.created_at.desc())
            .limit(len(semantic_texts) + len(bubble_texts) + 5)
            .all()
        )

        # Match semantic facts
        for text in semantic_texts:
            for mem in recent_memories:
                if not mem.is_episodic and mem.memory_text == text:
                    extracted_semantic.append(ExtractedMemory(
                        id=mem.id,
                        text=text,
                        type="semantic"
                    ))
                    break

        # Match episodic bubbles
        for text in bubble_texts:
            for mem in recent_memories:
                if mem.is_episodic and mem.memory_text == text:
                    extracted_bubbles.append(ExtractedMemory(
                        id=mem.id,
                        text=text,
                        type="bubble"
                    ))
                    break

    extracted = {
        "semantic": extracted_semantic,
        "bubbles": extracted_bubbles,
    }

    return ChatResponse(
        response=assistant_response,
        extracted_memories=extracted,
        relevant_memories=relevant_memories,
    )

@app.get("/api/memories/{conversation_id}", response_model=MemoriesResponse)
async def get_memories(conversation_id: int, db: Session = Depends(get_db)):
    """
    Get all memories for a conversation as nodes and links for visualization.
    """
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

@app.get("/api/memory/{memory_id}")
async def get_memory(memory_id: int, db: Session = Depends(get_db)):
    """
    Get details for a single memory including connected memories.
    """
    mem = db.query(MemoryModel).filter(MemoryModel.id == memory_id).first()
    
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    connections = get_memory_connections(mem)
    
    # Fetch connected memories
    connected_memories = []
    for conn in connections:
        connected_mem = db.query(MemoryModel).filter(
            MemoryModel.id == conn["target_id"]
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

@app.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    """Delete a memory."""
    mem = db.query(MemoryModel).filter(MemoryModel.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    db.delete(mem)
    db.commit()
    return {"status": "deleted", "id": memory_id}

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
