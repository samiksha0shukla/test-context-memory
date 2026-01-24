"""
FastAPI Backend for ContextMemory Chatbot
==========================================
Main application entry point.
Provides API endpoints for the Next.js frontend to interact with ContextMemory.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize auth tables first
from config import init_auth_tables, init_contextmemory, OPENROUTER_API_KEY
init_auth_tables()

# Initialize ContextMemory with API key for embeddings
if OPENROUTER_API_KEY:
    init_contextmemory(OPENROUTER_API_KEY)
else:
    print("Warning: OPENROUTER_API_KEY not set - ContextMemory features will require user API keys")

# Import route modules
from routes.chat import router as chat_router
from routes.memories import router as memories_router
from routes.auth import router as auth_router
from routes.api_keys import router as api_keys_router


# ═══════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════

app = FastAPI(
    title="ContextMemory API",
    description="API for ContextMemory chatbot with bubble visualization",
    version="1.0.0",
)

# CORS for Next.js frontend
# Allow multiple origins for development (3000 and 3001)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# Override with environment variable in production
if os.getenv("FRONTEND_URL"):
    ALLOWED_ORIGINS = [os.getenv("FRONTEND_URL")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "ContextMemory API", "status": "running"}


# Register route modules
app.include_router(auth_router)
app.include_router(api_keys_router)
app.include_router(chat_router)
app.include_router(memories_router)


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
