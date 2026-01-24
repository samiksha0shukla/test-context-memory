"""
User Model
==========
SQLAlchemy model for user accounts.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


FREE_MESSAGE_LIMIT = 10


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    message_count = Column(Integer, default=0)  # Track free messages used
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    api_key = relationship("UserApiKey", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    @property
    def free_messages_remaining(self) -> int:
        """Return number of free messages remaining."""
        return max(0, FREE_MESSAGE_LIMIT - self.message_count)

    @property
    def has_free_messages(self) -> bool:
        """Check if user has free messages remaining."""
        return self.message_count < FREE_MESSAGE_LIMIT
