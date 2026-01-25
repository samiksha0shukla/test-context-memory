"""
Auth Routes
===========
Authentication endpoints for signup, signin, logout, and token refresh.
Uses Bearer token authentication (tokens returned in response body).
"""

import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, FREE_MESSAGE_LIMIT
from models.refresh_token import RefreshToken
from models.api_key import UserApiKey
from auth.password import hash_password, verify_password
from auth.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ═══════════════════════════════════════════════════════
# REQUEST/RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════


class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class UsageResponse(BaseModel):
    free_messages_remaining: int
    free_message_limit: int
    message_count: int
    has_api_key: bool


class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    usage: UsageResponse

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Response for signup/signin with tokens."""
    user: UserInfo
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60


class TokenResponse(BaseModel):
    """Response for token refresh."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60


class MessageResponse(BaseModel):
    message: str


def build_user_info(user: User, db: Session) -> dict:
    """Build user info with usage data."""
    has_api_key = db.query(UserApiKey).filter(
        UserApiKey.user_id == user.id,
        UserApiKey.is_valid == True
    ).first() is not None

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_active": user.is_active,
        "usage": {
            "free_messages_remaining": user.free_messages_remaining,
            "free_message_limit": FREE_MESSAGE_LIMIT,
            "message_count": user.message_count,
            "has_api_key": has_api_key,
        }
    }


# ═══════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════


@router.post("/signup", response_model=AuthResponse)
def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    """Create a new user account and return tokens."""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate password
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )

    # Create user
    user = User(
        name=request.name,
        email=request.email,
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token, expires_at = create_refresh_token(user.id)

    # Store refresh token hash
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=expires_at,
    )
    db.add(token_record)
    db.commit()

    return {
        "user": build_user_info(user, db),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/signin", response_model=AuthResponse)
def signin(request: SignInRequest, db: Session = Depends(get_db)):
    """Authenticate user and return tokens."""
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
        )

    # Create tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token, expires_at = create_refresh_token(user.id)

    # Store refresh token hash
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=expires_at,
    )
    db.add(token_record)
    db.commit()

    return {
        "user": build_user_info(user, db),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/logout", response_model=MessageResponse)
def logout(request: LogoutRequest, db: Session = Depends(get_db)):
    """Logout user and invalidate refresh token."""
    if request.refresh_token:
        token_hash = hash_token(request.refresh_token)
        db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).delete()
        db.commit()

    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    """Issue a new access token using refresh token."""
    # Validate refresh token
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Check if token exists in database and is not expired
    token_hash = hash_token(request.refresh_token)
    token_record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.expires_at > datetime.now(timezone.utc),
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )

    # Get user
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Issue new access token
    access_token = create_access_token(user.id, user.email)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=UserInfo)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current authenticated user info."""
    return build_user_info(user, db)


@router.get("/usage", response_model=UsageResponse)
def get_usage(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's usage info."""
    has_api_key = db.query(UserApiKey).filter(
        UserApiKey.user_id == user.id,
        UserApiKey.is_valid == True
    ).first() is not None

    return {
        "free_messages_remaining": user.free_messages_remaining,
        "free_message_limit": FREE_MESSAGE_LIMIT,
        "message_count": user.message_count,
        "has_api_key": has_api_key,
    }


@router.get("/debug")
def debug_env():
    """Debug endpoint to check environment configuration."""
    return {
        "auth_type": "bearer_token",
        "is_vercel": os.getenv("VERCEL") == "1",
    }
