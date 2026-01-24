"""
OpenRouter Client Factory
=========================
Creates per-user OpenAI client instances for OpenRouter API.
"""

from openai import OpenAI


def create_openrouter_client(api_key: str) -> OpenAI:
    """Create an OpenAI client configured for OpenRouter with the given API key."""
    return OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )
