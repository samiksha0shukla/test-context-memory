"""
User API Key Model
==================
SQLAlchemy model for storing encrypted OpenRouter API keys.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from models.user import Base


class UserApiKey(Base):
    """Encrypted API key storage model."""

    __tablename__ = "user_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    encrypted_api_key = Column(Text, nullable=False)
    is_valid = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="api_key")
