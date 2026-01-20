#!/usr/bin/env python3
"""
Terminal Chatbot with Context Memory
=====================================
A terminal-based chatbot that uses the contextmemory package for long-term memory.
Powered by OpenRouter (Claude/GPT) and Neon PostgreSQL.
"""

import os
import sys
from datetime import datetime
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

# OpenRouter API Key
OPENROUTER_API_KEY = "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"

# Neon PostgreSQL Database URL
DATABASE_URL = "postgresql://neondb_owner:npg_HXf1hbaKRBT2@ep-odd-shape-a1aiejrv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# LLM Configuration
LLM_MODEL = "openai/gpt-4o-mini"  # Model for chat responses
EXTRACTION_MODEL = "anthropic/claude-sonnet-4.5"  # Model for memory extraction
EMBEDDING_MODEL = "openai/text-embedding-3-small"

# ═══════════════════════════════════════════════════════
# TERMINAL COLORS
# ═══════════════════════════════════════════════════════

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

def print_header():
    """Print the chatbot header."""
    print(f"\n{Colors.CYAN}{'═' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}  🧠 Context Memory Chatbot{Colors.RESET}")
    print(f"{Colors.DIM}  Long-term memory powered by ContextMemory + OpenRouter{Colors.RESET}")
    print(f"{Colors.CYAN}{'═' * 60}{Colors.RESET}")

def print_help():
    """Print available commands."""
    print(f"\n{Colors.YELLOW}Available commands:{Colors.RESET}")
    print(f"  {Colors.GREEN}exit{Colors.RESET}      - Quit the chatbot")
    print(f"  {Colors.GREEN}memories{Colors.RESET}  - Show all stored memories")
    print(f"  {Colors.GREEN}clear{Colors.RESET}     - Clear the terminal")
    print(f"  {Colors.GREEN}help{Colors.RESET}      - Show this help message")
    print()

# ═══════════════════════════════════════════════════════
# INITIALIZE MEMORY SYSTEM
# ═══════════════════════════════════════════════════════

def initialize_memory():
    """Initialize the ContextMemory system."""
    print(f"\n{Colors.DIM}Initializing memory system...{Colors.RESET}")
    
    # Configure ContextMemory
    configure(
        openrouter_api_key=OPENROUTER_API_KEY,
        llm_provider="openrouter",
        llm_model=EXTRACTION_MODEL,
        embedding_model=EMBEDDING_MODEL,
        database_url=DATABASE_URL,
    )
    
    # Create database tables
    create_table()
    
    # Create database session and memory instance
    db = SessionLocal()
    memory = Memory(db)
    
    print(f"{Colors.GREEN}✓ Memory system initialized{Colors.RESET}")
    
    return db, memory

def ensure_conversation_exists(db, conversation_id: int):
    """Create conversation if it doesn't exist."""
    existing = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not existing:
        conv = Conversation(id=conversation_id)
        db.add(conv)
        db.commit()
        print(f"{Colors.GREEN}✓ Created new conversation (ID: {conversation_id}){Colors.RESET}")
    return conversation_id

# ═══════════════════════════════════════════════════════
# CHAT CLIENT
# ═══════════════════════════════════════════════════════

def get_chat_client():
    """Create OpenRouter chat client."""
    return OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )

# ═══════════════════════════════════════════════════════
# CHAT WITH MEMORIES
# ═══════════════════════════════════════════════════════

def chat_with_memories(
    chat_client,
    memory: Memory,
    message: str,
    conversation_id: int = 1,
) -> str:
    """
    Chat with AI using ContextMemory for long-term memory.
    """
    
    # 1. Retrieve relevant memories
    print(f"{Colors.DIM}  Searching memories...{Colors.RESET}", end="\r")
    
    search_results = memory.search(
        query=message,
        conversation_id=conversation_id,
        limit=5,
    )
    
    # Format memories with type info
    memories_str = ""
    memory_count = len(search_results.get("results", []))
    
    for entry in search_results.get("results", []):
        mem_type = entry.get("type", "semantic")
        memories_str += f"- [{mem_type}] {entry['memory']}\n"
    
    if memory_count > 0:
        print(f"{Colors.DIM}  📚 Found {memory_count} relevant memories{Colors.RESET}")
    
    if not memories_str:
        memories_str = "No relevant memories found."
    
    # 2. Build system prompt
    system_prompt = f"""You are a helpful AI assistant with access to the user's memories.
Use the provided memories to give personalized, contextual responses.

User Memories:
{memories_str}

Instructions:
- Reference relevant memories when appropriate
- Remember context from previous conversations
- Be helpful, conversational, and friendly
- If you remember something about the user, mention it naturally"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]
    
    # 3. Call LLM
    print(f"{Colors.DIM}  Thinking...{Colors.RESET}", end="\r")
    
    response = chat_client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
    )
    
    assistant_response = response.choices[0].message.content
    
    # 4. Store memories from conversation
    full_messages = [
        {"role": "user", "content": message},
        {"role": "assistant", "content": assistant_response},
    ]
    
    print(f"{Colors.DIM}  Extracting memories...{Colors.RESET}", end="\r")
    
    result = memory.add(
        messages=full_messages,
        conversation_id=conversation_id,
    )
    
    # Show what was extracted
    if result:
        semantic = result.get("semantic", [])
        bubbles = result.get("bubbles", [])
        if semantic or bubbles:
            print(f"{Colors.GREEN}  📝 Extracted: {len(semantic)} facts, {len(bubbles)} bubbles{Colors.RESET}")
    
    # Clear status line
    print(" " * 50, end="\r")
    
    return assistant_response

def show_memories(db, conversation_id: int):
    """Display all stored memories for the conversation."""
    all_memories = db.query(MemoryModel).filter(
        MemoryModel.conversation_id == conversation_id
    ).all()
    
    print(f"\n{Colors.CYAN}{'─' * 50}{Colors.RESET}")
    print(f"{Colors.BOLD}📚 Stored Memories ({len(all_memories)} total){Colors.RESET}")
    print(f"{Colors.CYAN}{'─' * 50}{Colors.RESET}")
    
    if not all_memories:
        print(f"{Colors.DIM}  No memories stored yet.{Colors.RESET}")
    else:
        for mem in all_memories:
            if mem.is_episodic:
                icon = "🔵"
                type_str = "Bubble"
                importance = f" (importance: {mem.importance:.1f})"
            else:
                icon = "🟢"
                type_str = "Semantic"
                importance = ""
            
            print(f"  {icon} {Colors.BOLD}{type_str}:{Colors.RESET} {mem.memory_text}{Colors.DIM}{importance}{Colors.RESET}")
    
    print(f"{Colors.CYAN}{'─' * 50}{Colors.RESET}\n")

# ═══════════════════════════════════════════════════════
# MAIN FUNCTION
# ═══════════════════════════════════════════════════════

def main():
    """Main chatbot loop."""
    print_header()
    
    # Initialize
    try:
        db, memory = initialize_memory()
        chat_client = get_chat_client()
    except Exception as e:
        print(f"{Colors.RED}✗ Failed to initialize: {e}{Colors.RESET}")
        sys.exit(1)
    
    conversation_id = 1
    ensure_conversation_exists(db, conversation_id)
    
    print_help()
    print(f"{Colors.DIM}Start chatting! Your memories will be stored and recalled.{Colors.RESET}\n")
    
    while True:
        try:
            # Get user input
            user_input = input(f"{Colors.GREEN}You:{Colors.RESET} ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n\n{Colors.CYAN}Goodbye! Your memories are saved. 👋{Colors.RESET}\n")
            break
        
        if not user_input:
            continue
        
        # Handle commands
        command = user_input.lower()
        
        if command == "exit":
            print(f"\n{Colors.CYAN}Goodbye! Your memories are saved. 👋{Colors.RESET}\n")
            break
        
        elif command == "memories":
            show_memories(db, conversation_id)
            continue
        
        elif command == "clear":
            os.system("clear" if os.name == "posix" else "cls")
            print_header()
            continue
        
        elif command == "help":
            print_help()
            continue
        
        # Chat with AI
        try:
            response = chat_with_memories(
                chat_client,
                memory,
                user_input,
                conversation_id=conversation_id,
            )
            print(f"\n{Colors.BLUE}AI:{Colors.RESET} {response}\n")
        except Exception as e:
            print(f"\n{Colors.RED}Error: {e}{Colors.RESET}\n")

if __name__ == "__main__":
    main()
