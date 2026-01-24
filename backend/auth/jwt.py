"""
JWT Utilities
=============
Token creation and validation using python-jose.
"""

import os
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError

# Token configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Extended from 15 to 60 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7


def get_jwt_secret_key() -> str:
    """Get the JWT secret key from environment."""
    key = os.getenv("JWT_SECRET_KEY")
    if not key:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    return key


def create_access_token(user_id: int, email: str) -> str:
    """Create a short-lived access token."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, get_jwt_secret_key(), algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    """Create a long-lived refresh token. Returns (token, expires_at)."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, get_jwt_secret_key(), algorithm=ALGORITHM)
    return token, expires_at


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(token, get_jwt_secret_key(), algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def hash_token(token: str) -> str:
    """Create a SHA-256 hash of a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()
