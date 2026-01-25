"""
Chat Routes
============
API endpoint for chat functionality with memory integration.
Returns local_id for per-user sequential memory numbering.
Supports free trial (10 messages) and API key access.
Includes chat history persistence.
"""

from typing import Optional, Tuple, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from contextmemory import Memory
from contextmemory.db.models.memory import Memory as MemoryModel

from database import get_db
from config import LLM_MODEL, OPENROUTER_API_KEY
from schemas import ChatRequest, ChatResponse, ExtractedMemory, UsageInfo, ChatHistoryResponse, ChatMessageSchema
from utils import ensure_conversation_exists, build_id_mapping
from auth.dependencies import get_current_user, require_api_key_or_free_tier
from models.user import User, FREE_MESSAGE_LIMIT
from models.chat_message import ChatMessage
from services.openrouter_client import create_openrouter_client


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    auth_result: Tuple[Optional[str], User] = Depends(require_api_key_or_free_tier),
):
    """
    Send a message, get AI response, and extract memories.
    Uses the authenticated user's ID as conversation_id.
    Returns local_id for per-user sequential memory numbering.

    Free tier: First 10 messages use system API key.
    After free tier: Requires user's OpenRouter API key.
    """
    try:
        api_key, user = auth_result

        # Use user.id as the conversation_id for memory isolation
        conversation_id = user.id
        ensure_conversation_exists(db, conversation_id)

        # Determine which API key to use
        if api_key:
            # User has their own API key
            effective_api_key = api_key
            is_free_tier = False
        else:
            # Free tier - use system API key
            if not OPENROUTER_API_KEY:
                # Return 503 instead of crashing with 500
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="System API key not configured. Please add OPENROUTER_API_KEY to environment variables."
                )
            effective_api_key = OPENROUTER_API_KEY
            is_free_tier = True

        # Create OpenAI client with the appropriate API key
        chat_client = create_openrouter_client(effective_api_key)

        # Create memory instance with fresh session
        memory = Memory(db)

        # 1. Search relevant memories
        search_results = memory.search(
            query=request.message,
            conversation_id=conversation_id,
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
        try:
            response = chat_client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
            )
        except Exception as e:
            from fastapi import HTTPException, status
            print(f"LLM Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to generate response from AI provider: {str(e)}"
            )

        assistant_response = response.choices[0].message.content

        # 4. Increment message count for free tier users
        if is_free_tier:
            user.message_count += 1
            db.commit()
            db.refresh(user)

        # 5. Store memories
        full_messages = [
            {"role": "user", "content": request.message},
            {"role": "assistant", "content": assistant_response},
        ]

        result = memory.add(
            messages=full_messages,
            conversation_id=conversation_id,
        )

        # Get the newly created memory IDs by querying the latest memories
        semantic_texts = result.get("semantic", []) if result else []
        bubble_texts = result.get("bubbles", []) if result else []

        # Fetch the IDs of newly created memories
        extracted_semantic = []
        extracted_bubbles = []

        if semantic_texts or bubble_texts:
            # Get ALL memories to build proper ID mapping for local_id calculation
            all_memories = (
                db.query(MemoryModel)
                .filter(
                    MemoryModel.conversation_id == conversation_id,
                    MemoryModel.is_active == True
                )
                .order_by(MemoryModel.created_at)
                .all()
            )

            # Build ID mapping for local_id
            id_mapping = build_id_mapping(all_memories)

            # Get recent memories to find the IDs of newly extracted ones
            recent_memories = (
                db.query(MemoryModel)
                .filter(
                    MemoryModel.conversation_id == conversation_id,
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
                            local_id=id_mapping.get(mem.id, 0),
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
                            local_id=id_mapping.get(mem.id, 0),
                            text=text,
                            type="bubble"
                        ))
                        break

        extracted = {
            "semantic": extracted_semantic,
            "bubbles": extracted_bubbles,
        }

        # 6. Save chat messages to database for history
        # Save user message
        user_chat_message = ChatMessage(
            user_id=user.id,
            role="user",
            content=request.message,
            extracted_memories=None,
        )
        db.add(user_chat_message)

        # Save assistant message with extracted memories
        extracted_dict = {
            "semantic": [{"id": m.id, "local_id": m.local_id, "text": m.text, "type": m.type} for m in extracted_semantic],
            "bubbles": [{"id": m.id, "local_id": m.local_id, "text": m.text, "type": m.type} for m in extracted_bubbles],
        }
        assistant_chat_message = ChatMessage(
            user_id=user.id,
            role="assistant",
            content=assistant_response,
            extracted_memories=extracted_dict if (extracted_semantic or extracted_bubbles) else None,
        )
        db.add(assistant_chat_message)
        db.commit()

        # Build usage info
        usage = UsageInfo(
            free_messages_remaining=user.free_messages_remaining,
            free_message_limit=FREE_MESSAGE_LIMIT,
            has_api_key=api_key is not None,
        )

        return ChatResponse(
            response=assistant_response,
            extracted_memories=extracted,
            relevant_memories=relevant_memories,
            usage=usage,
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"CHAT ENDPOINT ERROR:\n{error_details}")
        
        # Re-raise HTTP exceptions (like 503/502/403)
        from fastapi import HTTPException
        if isinstance(e, HTTPException):
            raise e
            
        # Wrap unknown errors in 500
        from fastapi import status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error in Chat: {str(e)}"
        )


@router.get("/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get chat history for the authenticated user.
    Returns messages in chronological order (oldest first).
    """
    # Get total count
    total = db.query(ChatMessage).filter(ChatMessage.user_id == user.id).count()

    # Get messages
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return ChatHistoryResponse(
        messages=[
            ChatMessageSchema(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                extracted_memories=msg.extracted_memories,
                created_at=msg.created_at.isoformat(),
            )
            for msg in messages
        ],
        total=total,
        has_more=offset + limit < total,
    )


@router.delete("/chat/history")
async def clear_chat_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Clear all chat history for the authenticated user.
    """
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
