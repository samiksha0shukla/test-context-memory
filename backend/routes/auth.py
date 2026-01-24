"""
Auth Routes
===========
Authentication endpoints for signup, signin, logout, and token refresh.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.refresh_token import RefreshToken
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


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str


# ═══════════════════════════════════════════════════════
# COOKIE HELPERS
# ═══════════════════════════════════════════════════════


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set HTTP-only cookies for access and refresh tokens."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response):
    """Clear auth cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


# ═══════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════


@router.post("/signup", response_model=UserResponse)
def signup(request: SignUpRequest, response: Response, db: Session = Depends(get_db)):
    """Create a new user account and return tokens in cookies."""
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

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    return user


@router.post("/signin", response_model=UserResponse)
def signin(request: SignInRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate user and return tokens in cookies."""
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

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    return user


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Logout user and invalidate refresh token."""
    # Get refresh token from cookie and invalidate it
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        token_hash = hash_token(refresh_token)
        db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).delete()
        db.commit()

    # Clear cookies
    clear_auth_cookies(response)

    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=MessageResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """Issue a new access token using refresh token."""
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    # Validate refresh token
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Check if token exists in database and is not expired
    token_hash = hash_token(refresh_token)
    token_record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.expires_at > datetime.now(timezone.utc),
    ).first()

    if not token_record:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )

    # Get user
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user or not user.is_active:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Issue new access token
    access_token = create_access_token(user.id, user.email)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return {"message": "Token refreshed"}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return user
