"""
FastAPI Backend for ContextMemory Chatbot
==========================================
Main application entry point.
Provides API endpoints for the Next.js frontend to interact with ContextMemory.
"""

import os

# CRITICAL: Fix for Read-only file system on Vercel
# Force libraries to use /tmp for caching/config
os.environ['HOME'] = '/tmp'
os.environ['HF_HOME'] = '/tmp/hf_home'
os.environ['TIKTOKEN_CACHE_DIR'] = '/tmp/tiktoken'
os.environ['XDG_CACHE_HOME'] = '/tmp/cache'
os.environ['NLTK_DATA'] = '/tmp/nltk_data'

# Ensure these directories exist
try:
    os.makedirs('/tmp/hf_home', exist_ok=True)
    os.makedirs('/tmp/tiktoken', exist_ok=True)
    os.makedirs('/tmp/cache', exist_ok=True)
    os.makedirs('/tmp/nltk_data', exist_ok=True)
except Exception as e:
    print(f"Warning: Failed to create temp dirs: {e}")

from fastapi import FastAPI, Request
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
# Always allow localhost for development
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# Add production frontend URL (don't replace, append)
if os.getenv("FRONTEND_URL"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://test-context-memory.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        import traceback
        error_details = traceback.format_exc()
        print(f"GLOBAL SERVER ERROR: {error_details}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(exc)}", "trace": error_details}
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
