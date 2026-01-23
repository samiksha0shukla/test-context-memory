"""
FastAPI Backend for ContextMemory Chatbot
==========================================
Main application entry point.
Provides API endpoints for the Next.js frontend to interact with ContextMemory.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize ContextMemory before importing routes
from config import init_contextmemory
init_contextmemory()

# Import route modules
from routes.chat import router as chat_router
from routes.memories import router as memories_router


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
# ROUTES
# ═══════════════════════════════════════════════════════

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "ContextMemory API", "status": "running"}


# Register route modules
app.include_router(chat_router)
app.include_router(memories_router)


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
