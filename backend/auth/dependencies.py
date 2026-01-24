"""
Auth Dependencies
=================
FastAPI dependencies for route protection.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.api_key import UserApiKey
from auth.jwt import decode_token
from auth.encryption import decrypt_api_key


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Dependency to get the current authenticated user from access token cookie."""
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Dependency to get the current user if authenticated, or None."""
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


def require_api_key(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> str:
    """Dependency to require a valid API key and return the decrypted key."""
    api_key_record = db.query(UserApiKey).filter(
        UserApiKey.user_id == user.id,
        UserApiKey.is_valid == True
    ).first()

    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key required. Please add your OpenRouter API key.",
        )

    try:
        decrypted_key = decrypt_api_key(api_key_record.encrypted_api_key)
        return decrypted_key
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key. Please update your OpenRouter API key.",
        )
