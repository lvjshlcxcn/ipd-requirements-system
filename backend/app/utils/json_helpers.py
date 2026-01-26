"""JSON helper functions."""
from typing import Optional, List
import json
import logging

logger = logging.getLogger(__name__)


def parse_json_variables(variables_str: Optional[str]) -> List[str]:
    """Safely parse JSON variables string to list.

    Args:
        variables_str: JSON string representing a list of variables

    Returns:
        List of variable names, empty list if parsing fails
    """
    if not variables_str:
        return []

    try:
        return json.loads(variables_str)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Failed to parse variables JSON: {e}")
        return []


def truncate_content(text: str, max_len: int = 200) -> str:
    """Truncate text with ellipsis if too long.

    Args:
        text: Text to truncate
        max_len: Maximum length before truncation

    Returns:
        Truncated text with ellipsis if needed
    """
    if len(text) <= max_len:
        return text
    return text[:max_len] + "..."
