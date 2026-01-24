"""
API Keys Routes
===============
Endpoints for managing user OpenRouter API keys.
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.api_key import UserApiKey
from auth.dependencies import get_current_user
from auth.encryption import encrypt_api_key, decrypt_api_key

router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])


# ═══════════════════════════════════════════════════════
# REQUEST/RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════


class ApiKeyRequest(BaseModel):
    api_key: str


class ApiKeyStatusResponse(BaseModel):
    has_key: bool
    is_valid: bool


class MessageResponse(BaseModel):
    message: str


class ValidateResponse(BaseModel):
    valid: bool
    message: str


# ═══════════════════════════════════════════════════════
# API KEY ENDPOINTS
# ═══════════════════════════════════════════════════════


@router.post("/validate", response_model=ValidateResponse)
async def validate_api_key(request: ApiKeyRequest, user: User = Depends(get_current_user)):
    """Validate an OpenRouter API key by making a test request."""
    api_key = request.api_key.strip()

    if not api_key:
        return {"valid": False, "message": "API key is required"}

    if not api_key.startswith("sk-or-"):
        return {"valid": False, "message": "Invalid API key format. OpenRouter keys start with 'sk-or-'"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0,
            )

            if response.status_code == 200:
                return {"valid": True, "message": "API key is valid"}
            elif response.status_code == 401:
                return {"valid": False, "message": "Invalid or expired API key"}
            else:
                return {"valid": False, "message": f"Validation failed with status {response.status_code}"}

    except httpx.TimeoutException:
        return {"valid": False, "message": "Request timed out. Please try again."}
    except Exception as e:
        return {"valid": False, "message": f"Validation error: {str(e)}"}


@router.post("", response_model=MessageResponse)
def store_api_key(
    request: ApiKeyRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Store or update user's encrypted API key."""
    api_key = request.api_key.strip()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is required",
        )

    # Encrypt the API key
    encrypted_key = encrypt_api_key(api_key)

    # Check for existing key
    existing_key = db.query(UserApiKey).filter(UserApiKey.user_id == user.id).first()

    if existing_key:
        # Update existing key
        existing_key.encrypted_api_key = encrypted_key
        existing_key.is_valid = True
    else:
        # Create new key record
        key_record = UserApiKey(
            user_id=user.id,
            encrypted_api_key=encrypted_key,
            is_valid=True,
        )
        db.add(key_record)

    db.commit()

    return {"message": "API key stored successfully"}


@router.get("/status", response_model=ApiKeyStatusResponse)
def get_api_key_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Check if user has a valid API key stored."""
    key_record = db.query(UserApiKey).filter(UserApiKey.user_id == user.id).first()

    if not key_record:
        return {"has_key": False, "is_valid": False}

    return {"has_key": True, "is_valid": key_record.is_valid}


@router.delete("", response_model=MessageResponse)
def delete_api_key(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete user's API key."""
    deleted = db.query(UserApiKey).filter(UserApiKey.user_id == user.id).delete()
    db.commit()

    if deleted:
        return {"message": "API key deleted successfully"}
    else:
        return {"message": "No API key found to delete"}
