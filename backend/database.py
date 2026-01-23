"""
Database Module
===============
Database session dependency for FastAPI.
"""

from typing import Generator
from sqlalchemy.orm import Session
from contextmemory import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Dependency that creates a fresh database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
