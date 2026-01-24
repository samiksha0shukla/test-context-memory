"""
Encryption Utilities
====================
AES-256 encryption for API keys using pycryptodome.
"""

import os
import base64

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad


def get_encryption_key() -> bytes:
    """Get the encryption key from environment (must be 32 bytes for AES-256)."""
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise ValueError("ENCRYPTION_KEY environment variable is required")
    # Decode from base64 (expected to be 32 bytes when decoded)
    key_bytes = base64.b64decode(key)
    if len(key_bytes) != 32:
        raise ValueError("ENCRYPTION_KEY must be 32 bytes when decoded from base64")
    return key_bytes


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key using AES-256-CBC."""
    key = get_encryption_key()
    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_data = pad(api_key.encode(), AES.block_size)
    encrypted = cipher.encrypt(padded_data)
    # Store IV + encrypted data, base64 encoded
    combined = iv + encrypted
    return base64.b64encode(combined).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key."""
    key = get_encryption_key()
    combined = base64.b64decode(encrypted_key)
    iv = combined[:16]
    encrypted = combined[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = unpad(cipher.decrypt(encrypted), AES.block_size)
    return decrypted.decode()
