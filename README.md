# ContextMemory

A production-ready long-term memory system for AI conversations.

ContextMemory extracts, stores, and retrieves important facts from conversations, enabling AI Agents to remember user preferences, context, and history across sessions. It supports both **semantic facts** (stable, long-term truths) and **episodic bubbles** (time-bound moments).

## Features

-  **Dual Memory Types**: Semantic facts + Episodic bubbles
-  **Fast Search**: FAISS-powered O(log n) vector search
-  **Smart Updates**: Automatic contradiction detection & replacement
-  **Memory Connections**: Bubbles auto-link to related facts
-  **Multi-Provider**: OpenAI or OpenRouter (Claude, etc.)
-  **Flexible Storage**: SQLite (default) or PostgreSQL

## Installation

```bash
pip install contextmemory
```

## Quick Start

### Option 1: OpenAI (Direct)

```python
from contextmemory import configure, create_table, Memory, SessionLocal

# Configure with OpenAI
configure(
    openai_api_key="sk-...",
    database_url="postgresql://...",  # Optional, defaults to SQLite
)

# Create tables
create_table()

# Use memory
db = SessionLocal()
memory = Memory(db)
```

### Option 2: OpenRouter (Claude, etc.)

```python
from contextmemory import configure, create_table, Memory, SessionLocal

# Configure with OpenRouter
configure(
    openrouter_api_key="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",
    llm_provider="openrouter",
    llm_model="anthropic/claude-sonnet-4.5",  # Or any OpenRouter model
    embedding_model="openai/text-embedding-3-small",
    database_url="postgresql://...",
)

create_table()
db = SessionLocal()
memory = Memory(db)
```

### Environment Variables (Alternative)

```bash
# For OpenAI
export OPENAI_API_KEY="sk-..."

# For OpenRouter
export OPENROUTER_API_KEY="sk-or-v1-..."

# Optional
export DATABASE_URL="postgresql://..."
```

## Basic Usage

### Add Memories

```python
# Add memories from a conversation
messages = [
    {"role": "user", "content": "Hi, I'm Samiksha and I love Python programming"},
    {"role": "assistant", "content": "Nice to meet you! Python is great."},
]

result = memory.add(messages=messages, conversation_id=1)
# Returns: {'semantic': ['User is named Samiksha', 'User loves Python'], 'bubbles': []}
```

### Search Memories

```python
results = memory.search(
    query="What programming language does the user like?",
    conversation_id=1,
    limit=5
)

print(results)
# {
#   'query': '...',
#   'results': [
#     {'memory_id': 1, 'memory': 'User loves Python programming', 'type': 'semantic', 'score': 0.89}
#   ]
# }
```

### Update & Delete

```python
# Update a memory
memory.update(memory_id=1, text="User is an expert Python developer")

# Delete a memory
memory.delete(memory_id=1)
```

## Memory Types

### Semantic Facts
Stable, long-term truths about the user:
- Name, preferences, skills
- Professional background
- Dietary preferences, relationships

### Episodic Bubbles
Time-bound moments with automatic connections:
- Current tasks, deadlines
- Active problems being solved
- Significant events

```python
# Bubbles auto-connect to related semantic facts
memory.add(
    messages=[
        {"role": "user", "content": "I'm debugging a FastAPI auth issue"},
        {"role": "assistant", "content": "Let me help with that."}
    ],
    conversation_id=1
)
# Creates bubble: "User is debugging FastAPI auth issue"
# Auto-connects to: "User works on backend development"
```

## Full Example: Chat with Memory

```python
from openai import OpenAI
from contextmemory import configure, create_table, Memory, SessionLocal

# Configure
configure(
    openrouter_api_key="sk-or-v1-...",
    llm_provider="openrouter",
    llm_model="anthropic/claude-sonnet-4.5",
    embedding_model="openai/text-embedding-3-small",
    database_url="postgresql://...",
)

create_table()

# Initialize
chat_client = OpenAI(
    api_key="sk-or-v1-...",
    base_url="https://openrouter.ai/api/v1"
)
db = SessionLocal()
memory = Memory(db)

def chat_with_memories(message: str, conversation_id: int = 1) -> str:
    # 1. Search relevant memories
    search_results = memory.search(
        query=message,
        conversation_id=conversation_id,
        limit=5
    )
    
    memories_str = "\n".join(
        f"- [{r['type']}] {r['memory']}"
        for r in search_results["results"]
    )
    
    # 2. Build prompt with memories
    system_prompt = f"""You are a helpful AI with access to user's memories.

User Memories:
{memories_str or 'No memories yet.'}

Use memories to give personalized responses."""

    # 3. Call LLM
    response = chat_client.chat.completions.create(
        model="anthropic/claude-sonnet-4.5",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
    )
    
    assistant_response = response.choices[0].message.content
    
    # 4. Store new memories
    memory.add(
        messages=[
            {"role": "user", "content": message},
            {"role": "assistant", "content": assistant_response}
        ],
        conversation_id=conversation_id
    )
    
    return assistant_response

# Chat loop
while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break
    print(f"AI: {chat_with_memories(user_input)}")
```

## Configuration Reference

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `openai_api_key` | Yes* | - | OpenAI API key |
| `openrouter_api_key` | Yes* | - | OpenRouter API key |
| `llm_provider` | No | `openai` | `openai` or `openrouter` |
| `llm_model` | No | `gpt-4o-mini` | LLM model for extraction |
| `embedding_model` | No | `text-embedding-3-small` | Embedding model |
| `database_url` | No | SQLite | PostgreSQL URL |
| `debug` | No | `False` | Enable debug logging |

*One of `openai_api_key` or `openrouter_api_key` required based on `llm_provider`.

## API Reference

### `configure(**kwargs)`
Set global configuration. Call before any other operations.

### `create_table()`
Create all required database tables.

### `Memory(db: Session)`
Main memory interface.

**Methods:**
- `add(messages, conversation_id)` → Extract & store memories
- `search(query, conversation_id, limit)` → Search memories
- `update(memory_id, text)` → Update a memory
- `delete(memory_id)` → Delete a memory

### `SessionLocal()`
Create a new database session.

## How It Works

```
User Message → Extraction (LLM) → Tool Classification (LLM) → FAISS Index + DB
                    ↓                       ↓
              Semantic Facts           ADD/UPDATE/REPLACE/NOOP
              Episodic Bubbles
                    ↓
              Connection Finder → Links bubbles to related facts
```

**Key Features:**
- **Contradiction Detection**: "I'm vegetarian" → "I eat meat" triggers REPLACE
- **FAISS Search**: O(log n) vector search instead of O(n) loops
- **Smart Extraction**: Only extracts from latest interaction, not context

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Contributions welcome! Open an issue or submit a PR.

## Links

- [PyPI Package](https://pypi.org/project/contextmemory/)
- [GitHub Repository](https://github.com/samiksha0shukla/context-memory)
- [Issue Tracker](https://github.com/samiksha0shukla/context-memory/issues)
