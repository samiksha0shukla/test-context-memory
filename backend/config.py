"""
Configuration Module
====================
Handles environment variables, ContextMemory configuration, and API clients.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

from contextmemory import configure, create_table, SessionLocal

# Load environment variables
load_dotenv()

# ═══════════════════════════════════════════════════════
# ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")
EXTRACTION_MODEL = os.getenv("EXTRACTION_MODEL", "anthropic/claude-sonnet-4.5")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small")

# Auth configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

# Validate required environment variables
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY environment variable is required")


def init_contextmemory(api_key: str = None):
    """Initialize ContextMemory with configuration and create tables."""
    # Use provided API key or fall back to environment variable
    key = api_key or OPENROUTER_API_KEY
    if not key:
        raise ValueError("OpenRouter API key is required for ContextMemory initialization")

    configure(
        openrouter_api_key=key,
        llm_provider="openrouter",
        llm_model=EXTRACTION_MODEL,
        embedding_model=EMBEDDING_MODEL,
        database_url=DATABASE_URL,
    )
    create_table()


def init_auth_tables():
    """Create auth-related database tables."""
    from sqlalchemy import create_engine
    from models.user import Base

    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
