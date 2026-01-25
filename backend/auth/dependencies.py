"""
Auth Dependencies
=================
FastAPI dependencies for route protection and free trial management.
"""

from typing import Optional, Tuple
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, FREE_MESSAGE_LIMIT
from models.api_key import UserApiKey
from auth.jwt import decode_token
from auth.encryption import decrypt_api_key

# Bearer token security scheme
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get the current authenticated user from Bearer token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency to get the current user if authenticated, or None."""
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


def get_user_api_key(user: User, db: Session) -> Optional[str]:
    """Get the decrypted API key for a user, or None if not set."""
    api_key_record = db.query(UserApiKey).filter(
        UserApiKey.user_id == user.id,
        UserApiKey.is_valid == True
    ).first()

    if not api_key_record:
        return None

    try:
        return decrypt_api_key(api_key_record.encrypted_api_key)
    except Exception:
        return None


def require_api_key_or_free_tier(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Tuple[Optional[str], User]:
    """
    Dependency for chat that allows either:
    1. Users with free messages remaining (returns None for api_key)
    2. Users with a valid API key (returns the decrypted key)

    Returns: (api_key_or_none, user)
    """
    # Check if user has a valid API key
    api_key = get_user_api_key(user, db)

    if api_key:
        # User has API key, unlimited access
        return (api_key, user)

    # No API key - check free tier
    if user.has_free_messages:
        # User has free messages remaining
        return (None, user)

    # No API key and no free messages
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "API_KEY_REQUIRED",
            "message": "Free trial expired. Please add your OpenRouter API key to continue.",
            "free_messages_used": user.message_count,
            "free_message_limit": FREE_MESSAGE_LIMIT,
        }
    )


def require_api_key(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> str:
    """Dependency to require a valid API key and return the decrypted key."""
    api_key = get_user_api_key(user, db)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key required. Please add your OpenRouter API key.",
        )

    return api_key
