"""
Services Package
================
Service layer for external API clients.
"""

from services.openrouter_client import create_openrouter_client

__all__ = ["create_openrouter_client"]
