"""Distribution API endpoints for generating target IDs."""
from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.repositories.requirement import RequirementRepository

router = APIRouter(prefix="/distribution", tags=["Distribution"])


@router.get("/next-target-id")
async def get_next_target_id(
    target_type: str,
    db: Session = Depends(get_db),
):
    """
    Generate the next available target ID for a given target type.

    Args:
        target_type: Type of target (sp, bp, charter, pcr)
        db: Database session

    Returns:
        Next available target ID in format PREFIX-NNN
    """
    repo = RequirementRepository(db)

    # Get all requirements with the specified target_type
    requirements, _ = repo.list(page=1, page_size=1000)

    # Filter requirements by target_type and extract target_id
    target_ids = []
    for req in requirements:
        if req.target_type == target_type and req.target_id:
            target_ids.append(req.target_id)

    # Find the maximum numeric ID
    max_id = 0
    for tid in target_ids:
        if isinstance(tid, int):
            max_id = max(max_id, tid)
        elif isinstance(tid, str):
            # Try to extract numeric part from string ID (e.g., "SP-001" -> 1)
            import re
            match = re.search(r'\d+', tid)
            if match:
                max_id = max(max_id, int(match.group()))

    # Generate next ID
    next_id = max_id + 1

    # Format based on target type
    prefix_map = {
        "sp": "SP",
        "bp": "BP",
        "charter": "CHARTER",
        "pcr": "PCR",
    }

    prefix = prefix_map.get(target_type, target_type.upper())
    formatted_id = f"{prefix}-{next_id:03d}"

    return {
        "success": True,
        "data": {
            "target_type": target_type,
            "next_numeric_id": next_id,
            "formatted_id": formatted_id,
            "prefix": prefix,
        },
    }
