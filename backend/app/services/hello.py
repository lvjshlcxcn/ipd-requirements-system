"""Hello service for simple greeting functionality."""
from datetime import datetime
from typing import Dict


def say_hello(name: str = "World") -> Dict[str, str]:
    """Generate a greeting message.

    Args:
        name: Name to greet. Defaults to "World".

    Returns:
        Dictionary containing greeting message and ISO format timestamp.

    Examples:
        >>> say_hello("Alice")
        {'message': 'Hello, Alice!', 'timestamp': '2025-01-15T10:30:00.123456'}

        >>> say_hello()
        {'message': 'Hello, World!', 'timestamp': '2025-01-15T10:30:00.123456'}
    """
    timestamp = datetime.utcnow().isoformat()
    return {
        "message": f"Hello, {name}!",
        "timestamp": timestamp,
    }
