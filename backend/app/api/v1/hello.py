"""Hello API endpoints."""
from typing import Annotated

from fastapi import APIRouter, Query

from app.services.hello import say_hello

router = APIRouter(prefix="/hello", tags=["hello"])


@router.get("")
async def hello_endpoint(
    name: Annotated[str, Query(description="Name to greet")] = "World"
):
    """Hello World endpoint.

    A simple greeting endpoint that returns a personalized message with timestamp.

    Args:
        name: Name to greet. Defaults to "World".

    Returns:
        Dictionary containing greeting message and ISO format timestamp.

    Examples:
        GET /api/v1/hello
        {"message": "Hello, World!", "timestamp": "2025-01-15T10:30:00.123456"}

        GET /api/v1/hello?name=Alice
        {"message": "Hello, Alice!", "timestamp": "2025-01-15T10:30:00.123456"}
    """
    return say_hello(name)
