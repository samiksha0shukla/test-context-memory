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

# Validate required environment variables
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")


def init_contextmemory():
    """Initialize ContextMemory with configuration and create tables."""
    configure(
        openrouter_api_key=OPENROUTER_API_KEY,
        llm_provider="openrouter",
        llm_model=EXTRACTION_MODEL,
        embedding_model=EMBEDDING_MODEL,
        database_url=DATABASE_URL,
    )
    create_table()


# ═══════════════════════════════════════════════════════
# API CLIENTS
# ═══════════════════════════════════════════════════════

chat_client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)
