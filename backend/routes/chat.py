"""
Chat Routes
============
API endpoint for chat functionality with memory integration.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from contextmemory import Memory
from contextmemory.db.models.memory import Memory as MemoryModel

from database import get_db
from config import chat_client, LLM_MODEL
from schemas import ChatRequest, ChatResponse, ExtractedMemory
from utils import ensure_conversation_exists


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
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
