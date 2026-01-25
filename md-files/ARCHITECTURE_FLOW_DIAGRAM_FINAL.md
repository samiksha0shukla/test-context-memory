# Pickle-Inspired ContextMemory Architecture Flow Diagram

> Complete architecture showing the flow from user query to agent context extraction, including all formulas, JSON structures, and component interactions.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        PICKLE-INSPIRED CONTEXTMEMORY SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   USER ←──────────────────→ AI AGENT ←──────────────────→ CONTEXTMEMORY                │
│                                                                                         │
│   User sends             Agent processes           ContextMemory provides:              │
│   messages               and responds             • add() - Store memories              │
│                                                   • search() - Retrieve context         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Memory Table Schema (Extended)

```
┌─────────────────────────────────────────────────────────────────┐
│                        MEMORY TABLE                             │
├─────────────────────────────────────────────────────────────────┤
│ FIELD              │ TYPE          │ DESCRIPTION               │
├────────────────────┼───────────────┼───────────────────────────┤
│ id                 │ Integer (PK)  │ Unique identifier         │
│ conversation_id    │ Integer (FK)  │ Links to conversation     │
│ memory_text        │ Text          │ The memory content        │
│ category           │ String(64)    │ Optional classification   │
│ embedding          │ JSON [1536]   │ Vector for similarity     │
│ memory_metadata    │ JSON          │ Connections + extra data  │
│ created_at         │ DateTime      │ When stored               │
│ updated_at         │ DateTime      │ Last modified             │
├────────────────────┼───────────────┼───────────────────────────┤
│ is_episodic        │ Boolean       │ NEW: false=fact, true=bubble │
│ occurred_at        │ DateTime      │ NEW: When moment happened │
│ session_id         │ Integer       │ NEW: Conversation session │
│ importance         │ Float (0-1)   │ NEW: Priority score       │
│ is_active          │ Boolean       │ NEW: For archival         │
└─────────────────────────────────────────────────────────────────┘
```

### Memory Types

```
SEMANTIC FACT:                          BUBBLE (EPISODIC):
┌────────────────────────┐              ┌────────────────────────┐
│ is_episodic: false     │              │ is_episodic: true      │
│ occurred_at: NULL      │              │ occurred_at: timestamp │
│ importance: 0.7        │              │ importance: 0.3-1.0    │
│ No decay               │              │ Decays over time       │
│ Deduplicated           │              │ Kept separate          │
│                        │              │                        │
│ "User prefers Python"  │              │ "Debugged FastAPI auth"│
└────────────────────────┘              └────────────────────────┘
```

---

## Complete Flow: User Interaction to Context Retrieval

```
═══════════════════════════════════════════════════════════════════════════════════════
                           COMPLETE SYSTEM FLOW
═══════════════════════════════════════════════════════════════════════════════════════

PHASE 1: USER SENDS MESSAGE
────────────────────────────────────────────────────────────────────────────────────────

    ┌─────────┐
    │  USER   │ ──────→ "I'm debugging this JWT validation bug in FastAPI"
    └─────────┘
         │
         │ (Message sent to Agent)
         ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              AI AGENT                                         │
    │                                                                               │
    │  Agent receives message and needs to:                                        │
    │  1. Get relevant context (search)                                            │
    │  2. Respond to user                                                          │
    │  3. Store this interaction (add)                                             │
    │                                                                               │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         │
═════════╪═════════════════════════════════════════════════════════════════════════════
         │
         ▼
PHASE 2: AGENT CALLS search() TO GET CONTEXT
────────────────────────────────────────────────────────────────────────────────────────

    ┌───────────────────────────────────────────────────────────────────────────────┐
    │  memory.search(                                                               │
    │      query = "JWT validation bug FastAPI",                                    │
    │      conversation_id = 1,                                                     │
    │      limit = 5                                                                │
    │  )                                                                            │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                          SEARCH() INTERNAL FLOW                               │
    │                                                                               │
    │  STEP 1: GENERATE QUERY EMBEDDING                                            │
    │  ┌─────────────────────────────────────────────────┐                         │
    │  │  query_embedding = embed_text(query)            │                         │
    │  │                                                 │                         │
    │  │  OpenAI API: text-embedding-3-small             │                         │
    │  │  Output: [0.023, -0.156, 0.089, ...] (1536 dim) │                         │
    │  └─────────────────────────────────────────────────┘                         │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 2: FETCH ALL ACTIVE MEMORIES                                           │
    │  ┌─────────────────────────────────────────────────┐                         │
    │  │  SELECT * FROM memories                         │                         │
    │  │  WHERE conversation_id = 1                      │                         │
    │  │  AND is_active = true                           │                         │
    │  └─────────────────────────────────────────────────┘                         │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 3: SCORE EACH MEMORY                                                   │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │                                                                     │     │
    │  │  FOR each memory:                                                   │     │
    │  │                                                                     │     │
    │  │    similarity = cosine_similarity(query_embedding, mem.embedding)   │     │
    │  │                                                                     │     │
    │  │    ┌─────────────────────────────────────────────────────────┐     │     │
    │  │    │  COSINE SIMILARITY FORMULA:                             │     │     │
    │  │    │                                                         │     │     │
    │  │    │            A · B           Σ(Ai × Bi)                   │     │     │
    │  │    │  cos(θ) = ─────── = ─────────────────────────           │     │     │
    │  │    │           ‖A‖‖B‖   √(Σ Ai²) × √(Σ Bi²)                 │     │     │
    │  │    │                                                         │     │     │
    │  │    │  Range: 0.0 (unrelated) to 1.0 (identical)             │     │     │
    │  │    └─────────────────────────────────────────────────────────┘     │     │
    │  │                                                                     │     │
    │  │    IF memory.is_episodic AND memory.occurred_at:                   │     │
    │  │      ┌─────────────────────────────────────────────────────┐       │     │
    │  │      │  RECENCY DECAY FORMULA:                             │       │     │
    │  │      │                                                     │       │     │
    │  │      │  recency = e^(-λ × days_ago)                        │       │     │
    │  │      │                                                     │       │     │
    │  │      │  Where λ = 0.05 (decay rate)                        │       │     │
    │  │      │                                                     │       │     │
    │  │      │  Examples:                                          │       │     │
    │  │      │  • Today (0 days): e^0 = 1.0                        │       │     │
    │  │      │  • 7 days ago: e^(-0.35) = 0.70                     │       │     │
    │  │      │  • 30 days ago: e^(-1.5) = 0.22                     │       │     │
    │  │      │  • 60 days ago: e^(-3.0) = 0.05                     │       │     │
    │  │      └─────────────────────────────────────────────────────┘       │     │
    │  │    ELSE:                                                           │     │
    │  │      recency = 1.0  (semantic facts don't decay)                   │     │
    │  │                                                                     │     │
    │  │    ┌─────────────────────────────────────────────────────────┐     │     │
    │  │    │  FINAL SCORE FORMULA:                                   │     │     │
    │  │    │                                                         │     │     │
    │  │    │  final_score = similarity × importance × recency        │     │     │
    │  │    │                                                         │     │     │
    │  │    │  Example:                                               │     │     │
    │  │    │  similarity = 0.85                                      │     │     │
    │  │    │  importance = 0.8                                       │     │     │
    │  │    │  recency = 0.70 (7 days old bubble)                     │     │     │
    │  │    │  final_score = 0.85 × 0.8 × 0.70 = 0.476                │     │     │
    │  │    └─────────────────────────────────────────────────────────┘     │     │
    │  │                                                                     │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 4: SORT BY FINAL SCORE (DESCENDING)                                    │
    │  ┌─────────────────────────────────────────────────┐                         │
    │  │  scored_memories.sort(key=score, reverse=True)  │                         │
    │  └─────────────────────────────────────────────────┘                         │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 5: GET CONNECTED BUBBLES                                               │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  For top results, check memory_metadata["connections"]:             │     │
    │  │                                                                     │     │
    │  │  if "connections" in mem.memory_metadata:                           │     │
    │  │      for conn_id in mem.memory_metadata["connections"]["bubble_ids"]:│    │
    │  │          fetch and include connected bubble                         │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 6: FORMAT AND RETURN RESULTS                                           │
    │                                                                               │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                         SEARCH() OUTPUT                                       │
    │                                                                               │
    │  {                                                                            │
    │    "query": "JWT validation bug FastAPI",                                     │
    │    "results": [                                                               │
    │      {                                                                        │
    │        "memory_id": 45,                                                       │
    │        "memory": "User asked about JWT token validation",                     │
    │        "type": "bubble",                                                      │
    │        "occurred_at": "2026-01-13T15:00:00",                                  │
    │        "score": 0.89,                                                         │
    │        "connections": [42, 38]                                                │
    │      },                                                                       │
    │      {                                                                        │
    │        "memory_id": 12,                                                       │
    │        "memory": "User works with FastAPI",                                   │
    │        "type": "semantic",                                                    │
    │        "occurred_at": null,                                                   │
    │        "score": 0.82,                                                         │
    │        "connections": []                                                      │
    │      },                                                                       │
    │      {                                                                        │
    │        "memory_id": 42,                                                       │
    │        "memory": "User debugged auth middleware",                             │
    │        "type": "connected_bubble",                                            │
    │        "occurred_at": "2026-01-10T10:00:00",                                  │
    │        "score": 0,                                                            │
    │        "connections": []                                                      │
    │      }                                                                        │
    │    ]                                                                          │
    │  }                                                                            │
    │                                                                               │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         │
═════════╪═════════════════════════════════════════════════════════════════════════════
         │
         ▼
PHASE 3: AGENT RESPONDS WITH CONTEXT
────────────────────────────────────────────────────────────────────────────────────────

    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              AI AGENT                                         │
    │                                                                               │
    │  Agent now has context:                                                       │
    │  • User previously asked about JWT validation                                 │
    │  • User works with FastAPI                                                    │
    │  • User debugged auth middleware before                                       │
    │                                                                               │
    │  Agent generates informed response:                                           │
    │  "I see you're continuing with JWT issues. Based on your previous auth       │
    │   middleware debugging, here's what might help..."                            │
    │                                                                               │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         │ (Response sent to user)
         ▼
    ┌─────────┐
    │  USER   │ ←────── "I see you're continuing with JWT issues..."
    └─────────┘
         │
         │
═════════╪═════════════════════════════════════════════════════════════════════════════
         │
         ▼
PHASE 4: AGENT CALLS add() TO STORE INTERACTION
────────────────────────────────────────────────────────────────────────────────────────

    ┌───────────────────────────────────────────────────────────────────────────────┐
    │  memory.add(                                                                  │
    │      messages = [                                                             │
    │        {"role": "user", "content": "I'm debugging this JWT..."},              │
    │        {"role": "assistant", "content": "I see you're continuing..."}         │
    │      ],                                                                       │
    │      conversation_id = 1                                                      │
    │  )                                                                            │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                           ADD() INTERNAL FLOW                                 │
    │                                                                               │
    │  ╔═══════════════════════════════════════════════════════════════════════╗   │
    │  ║                      EXTRACTION PHASE                                  ║   │
    │  ╚═══════════════════════════════════════════════════════════════════════╝   │
    │                                                                               │
    │  STEP 1: PREPARE CONTEXT FOR LLM                                             │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  • latest_pair: Last user + assistant message                       │     │
    │  │  • summary_text: Existing conversation summary                      │     │
    │  │  • recent_messages: Last 10 messages from DB                        │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 2: CALL LLM WITH DUAL EXTRACTION PROMPT                                │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │                                                                     │     │
    │  │  Model: gpt-4o-mini                                                 │     │
    │  │  Temperature: 0.1                                                   │     │
    │  │                                                                     │     │
    │  │  Prompt:                                                            │     │
    │  │  "Extract TWO types of memories:                                    │     │
    │  │   1. SEMANTIC FACTS - stable, long-term                             │     │
    │  │   2. BUBBLES - moments, time-bound"                                 │     │
    │  │                                                                     │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 3: LLM EXTRACTION OUTPUT                                               │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  {                                                                  │     │
    │  │    "semantic": [],                                                  │     │
    │  │    "bubbles": [                                                     │     │
    │  │      {                                                              │     │
    │  │        "text": "User debugging JWT validation bug in FastAPI",      │     │
    │  │        "importance": 0.8                                            │     │
    │  │      }                                                              │     │
    │  │    ]                                                                │     │
    │  │  }                                                                  │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 4: STORE MESSAGES IN MESSAGE TABLE                                     │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  INSERT INTO messages (conversation_id, sender, message_text)       │     │
    │  │  VALUES (1, 'user', 'I'm debugging...'),                            │     │
    │  │         (1, 'assistant', 'I see you're...')                         │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP 5: TRIGGER SUMMARY GENERATION (if needed)                              │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  IF total_messages % 20 == 0:                                       │     │
    │  │      generate_conversation_summary()                                │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                                                                               │
    │  ╔═══════════════════════════════════════════════════════════════════════╗   │
    │  ║                      UPDATE PHASE (SEMANTIC)                           ║   │
    │  ╚═══════════════════════════════════════════════════════════════════════╝   │
    │                                                                               │
    │  FOR each semantic fact extracted:                                           │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  1. Generate embedding                                              │     │
    │  │  2. Find similar existing memories (top 10)                         │     │
    │  │  3. LLM decides: ADD / UPDATE / DELETE / NOOP                       │     │
    │  │  4. Execute action                                                  │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                                                                               │
    │  (In this example: semantic = [], so nothing to process)                     │
    │                                                                               │
    │  ╔═══════════════════════════════════════════════════════════════════════╗   │
    │  ║                      BUBBLE CREATION PHASE                             ║   │
    │  ╚═══════════════════════════════════════════════════════════════════════╝   │
    │                                                                               │
    │  FOR each bubble extracted:                                                  │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP B1: GENERATE EMBEDDING FOR BUBBLE                                      │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  bubble_embedding = embed_text(                                     │     │
    │  │      "User debugging JWT validation bug in FastAPI"                 │     │
    │  │  )                                                                  │     │
    │  │  → [0.045, -0.178, 0.092, ...] (1536 dim)                           │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP B2: CREATE BUBBLE RECORD                                               │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │  INSERT INTO memories:                                              │     │
    │  │  {                                                                  │     │
    │  │    "id": 50,                                                        │     │
    │  │    "conversation_id": 1,                                            │     │
    │  │    "memory_text": "User debugging JWT validation bug in FastAPI",   │     │
    │  │    "embedding": [0.045, -0.178, ...],                               │     │
    │  │    "is_episodic": true,                                             │     │
    │  │    "occurred_at": "2026-01-14T16:00:00",                            │     │
    │  │    "session_id": 12,                                                │     │
    │  │    "importance": 0.8,                                               │     │
    │  │    "is_active": true,                                               │     │
    │  │    "memory_metadata": {}                                            │     │
    │  │  }                                                                  │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP B3: FIND CONNECTIONS (Automatic)                                       │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │                                                                     │     │
    │  │  Fetch all existing bubbles + semantic facts:                       │     │
    │  │  SELECT * FROM memories WHERE conversation_id=1 AND id != 50       │     │
    │  │                                                                     │     │
    │  │  Calculate similarity with each:                                    │     │
    │  │  ┌───────────────────────────────────────────────────────────┐     │     │
    │  │  │  Memory 45: "JWT token validation"      → sim = 0.91 ✓    │     │     │
    │  │  │  Memory 42: "Debugged auth middleware"  → sim = 0.87 ✓    │     │     │
    │  │  │  Memory 12: "Works with FastAPI"        → sim = 0.78 ✓    │     │     │
    │  │  │  Memory 38: "Security concerns"         → sim = 0.72 ✓    │     │     │
    │  │  │  Memory 30: "Prefers dark mode"         → sim = 0.15 ✗    │     │     │
    │  │  └───────────────────────────────────────────────────────────┘     │     │
    │  │                                                                     │     │
    │  │  Keep connections where similarity > 0.6 (threshold)                │     │
    │  │                                                                     │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                          │                                                    │
    │                          ▼                                                    │
    │  STEP B4: STORE CONNECTIONS                                                  │
    │  ┌─────────────────────────────────────────────────────────────────────┐     │
    │  │                                                                     │     │
    │  │  Update Bubble 50's metadata:                                       │     │
    │  │  {                                                                  │     │
    │  │    "memory_metadata": {                                             │     │
    │  │      "connections": {                                               │     │
    │  │        "bubble_ids": [45, 42, 12, 38],                              │     │
    │  │        "scores": {                                                  │     │
    │  │          "45": 0.91,                                                │     │
    │  │          "42": 0.87,                                                │     │
    │  │          "12": 0.78,                                                │     │
    │  │          "38": 0.72                                                 │     │
    │  │        }                                                            │     │
    │  │      }                                                              │     │
    │  │    }                                                                │     │
    │  │  }                                                                  │     │
    │  │                                                                     │     │
    │  │  Also update reverse connections in 45, 42, 12, 38                  │     │
    │  │  (bidirectional linking)                                            │     │
    │  │                                                                     │     │
    │  └─────────────────────────────────────────────────────────────────────┘     │
    │                                                                               │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                           ADD() OUTPUT                                        │
    │                                                                               │
    │  {                                                                            │
    │    "semantic": [],                                                            │
    │    "bubbles": ["User debugging JWT validation bug in FastAPI"]                │
    │  }                                                                            │
    │                                                                               │
    └───────────────────────────────────────────────────────────────────────────────┘
         │
         │
═════════╪═════════════════════════════════════════════════════════════════════════════
         │
         ▼
PHASE 5: BUBBLE NETWORK GROWS
────────────────────────────────────────────────────────────────────────────────────────

    BEFORE (existing bubbles):
    
         [42]                    [45]
      "Debugged auth"         "JWT token
       middleware"            validation"
            │                      │
            └──────────┬───────────┘
                       │
                      [38]
                  "Security
                   concerns"
    
    
    AFTER (new bubble added with connections):
    
                        [12 - Semantic]
                      "Works with FastAPI"
                              │
                              │ (0.78)
                              │
         [42]─────────────[50 NEW]────────────[45]
      "Debugged auth"   "JWT validation    "JWT token
       middleware"      bug in FastAPI"    validation"
         │    (0.87)          │               │
         │                    │ (0.72)        │
         └────────────────────┼───────────────┘
                              │
                             [38]
                         "Security
                          concerns"
    
    
═══════════════════════════════════════════════════════════════════════════════════════
                              FLOW COMPLETE
═══════════════════════════════════════════════════════════════════════════════════════
```

---

## Scoring Formulas Summary

### 1. Cosine Similarity

```
                  A · B              Σ(Ai × Bi)
similarity = ─────────── = ───────────────────────────
              ‖A‖ × ‖B‖     √(Σ Ai²) × √(Σ Bi²)

Where:
  A = query embedding [1536 dimensions]
  B = memory embedding [1536 dimensions]

Range: 0.0 (completely different) to 1.0 (identical)
```

### 2. Recency Decay

```
recency_weight = e^(-λ × days_ago)

Where:
  λ = decay rate (default 0.05)
  days_ago = (current_time - occurred_at).days

For semantic facts (occurred_at = NULL):
  recency_weight = 1.0 (no decay)
```

### 3. Final Score

```
final_score = similarity × importance × recency_weight

Components:
  similarity:     0.0 - 1.0 (from embedding comparison)
  importance:     0.0 - 1.0 (assigned by LLM during extraction)
  recency_weight: 0.0 - 1.0 (calculated at search time)
```

---

## Connection Finding Algorithm

```
CONNECTION THRESHOLD = 0.6
MAX_CONNECTIONS = 5

function find_connections(new_bubble, all_memories):
    
    connections = []
    
    for each memory in all_memories:
        if memory.id == new_bubble.id:
            continue
            
        score = cosine_similarity(new_bubble.embedding, memory.embedding)
        
        if score >= CONNECTION_THRESHOLD:
            connections.append({
                "id": memory.id,
                "score": score
            })
    
    # Sort by score descending
    connections.sort(by=score, descending=True)
    
    # Keep top N
    return connections[:MAX_CONNECTIONS]
```

---

## Memory Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MEMORY LIFECYCLE                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   SEMANTIC FACTS                        BUBBLES                                     │
│   ──────────────                        ───────                                     │
│                                                                                     │
│   • Created once                        • Created continuously                      │
│   • Updated if more specific            • Never merged (kept separate)              │
│   • Deleted if contradicted             • Decay in importance over time             │
│   • Never decay (always recency=1.0)    • Archived after 90 days (is_active=false)  │
│   • ~50-100 per user                    • Can grow to thousands                     │
│                                                                                     │
│                                                                                     │
│   BUBBLE LIFECYCLE:                                                                 │
│                                                                                     │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐                  │
│   │  ACTIVE  │ ──▶ │   WARM   │ ──▶ │   COLD   │ ──▶ │ ARCHIVED │                  │
│   │  0-7 days│     │  7-30    │     │  30-90   │     │   90+    │                  │
│   │          │     │  days    │     │  days    │     │  days    │                  │
│   │ recency  │     │ recency  │     │ recency  │     │          │                  │
│   │ = 1.0    │     │ = 0.70   │     │ = 0.22   │     │ is_active│                  │
│   │          │     │          │     │          │     │ = false  │                  │
│   └──────────┘     └──────────┘     └──────────┘     └──────────┘                  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## API Methods Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTEXTMEMORY API                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  add(messages, conversation_id)                                             │   │
│  │  ───────────────────────────────                                            │   │
│  │  Purpose: Store memories from conversation                                  │   │
│  │  Input:   List of {role, content} messages                                  │   │
│  │  Process: Extract semantic facts + bubbles, find connections                │   │
│  │  Output:  {"semantic": [...], "bubbles": [...]}                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  search(query, conversation_id, limit)                                      │   │
│  │  ─────────────────────────────────────                                      │   │
│  │  Purpose: Retrieve relevant memories                                        │   │
│  │  Input:   Query string, conversation ID, result limit                       │   │
│  │  Process: Embed query, score all memories, include connections              │   │
│  │  Output:  {"query": "...", "results": [{memory, type, score, ...}]}         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  update(memory_id, text)                                                    │   │
│  │  ───────────────────────                                                    │   │
│  │  Purpose: Manually update a memory                                          │   │
│  │  Process: Update text and regenerate embedding                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  delete(memory_id)                                                          │   │
│  │  ─────────────────                                                          │   │
│  │  Purpose: Remove a memory                                                   │   │
│  │  Process: Delete from database                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Data Flow

```
USER MESSAGE
     │
     ▼
┌─────────┐    search()     ┌─────────────────┐
│  AGENT  │ ───────────────▶│  CONTEXTMEMORY  │
│         │                 │                 │
│         │◀───────────────│  Returns:       │
│         │  context        │  • Semantic     │
│         │                 │  • Bubbles      │
│         │                 │  • Connected    │
└─────────┘                 └─────────────────┘
     │                              ▲
     │ (responds with context)      │
     ▼                              │
USER RECEIVES RESPONSE              │
     │                              │
     │                              │
     ▼                              │
┌─────────┐    add()        ┌───────┴─────────┐
│  AGENT  │ ───────────────▶│  CONTEXTMEMORY  │
│         │                 │                 │
│         │                 │  Stores:        │
│         │                 │  • Messages     │
│         │                 │  • Semantic     │
│         │                 │  • Bubbles      │
│         │                 │  • Connections  │
└─────────┘                 └─────────────────┘
```

---

*Document created: January 14, 2026*
*Pickle-Inspired ContextMemory Complete Architecture*
