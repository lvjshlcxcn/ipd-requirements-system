"""Verification API endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.schemas.verification import (
    VerificationChecklistCreate,
    VerificationChecklistUpdate,
    VerificationChecklistSubmit,
    VerificationChecklistResponse,
    VerificationSummary,
)
from app.models.verification_checklist import VerificationChecklist
from app.repositories.base import BaseRepository
from app.api.deps import get_db, get_current_user
from app.core.tenant import get_current_tenant
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

router = APIRouter(prefix="/requirements/{requirement_id}/verification", tags=["verification"])


@router.get("", response_model=List[VerificationChecklistResponse])
async def get_verifications(
    requirement_id: int,
    verification_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Get verification checklists for a requirement."""
    repo = BaseRepository(VerificationChecklist, db)
    query = repo._get_query()
    query = query.where(VerificationChecklist.requirement_id == requirement_id)

    if verification_type:
        query = query.where(VerificationChecklist.verification_type == verification_type)

    result = await db.execute(query)
    checklists = list(result.scalars().all())
    return [VerificationChecklistResponse.model_validate(c) for c in checklists]


@router.post("", response_model=VerificationChecklistResponse)
async def create_checklist(
    requirement_id: int,
    checklist_data: VerificationChecklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Create a new verification checklist."""
    repo = BaseRepository(VerificationChecklist, db)
    tenant_id = get_current_tenant() or (current_user.tenant_id if current_user else 1)

    checklist = await repo.create(
        requirement_id=requirement_id,
        tenant_id=tenant_id,
        verification_type=checklist_data.verification_type,
        checklist_name=checklist_data.checklist_name,
        checklist_items=checklist_data.checklist_items,
        result="not_started",
        verified_by=None,
    )
    return VerificationChecklistResponse.model_validate(checklist)


@router.put("/{checklist_id}", response_model=VerificationChecklistResponse)
async def update_checklist(
    requirement_id: int,
    checklist_id: int,
    checklist_data: VerificationChecklistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Update verification checklist items."""
    repo = BaseRepository(VerificationChecklist, db)

    checklist = await repo.get_by_id(checklist_id)
    if not checklist or checklist.requirement_id != requirement_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    updated = await repo.update(checklist_id, checklist_items=checklist_data.checklist_items)
    if updated:
        return VerificationChecklistResponse.model_validate(updated)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Checklist not found",
    )


@router.post("/{checklist_id}/submit", response_model=VerificationChecklistResponse)
async def submit_checklist(
    requirement_id: int,
    checklist_id: int,
    submit_data: VerificationChecklistSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Submit verification checklist with results."""
    repo = BaseRepository(VerificationChecklist, db)

    checklist = await repo.get_by_id(checklist_id)
    if not checklist or checklist.requirement_id != requirement_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    updated = await repo.update(
        checklist_id,
        result=submit_data.result,
        evidence_attachments=submit_data.evidence_attachments,
        customer_feedback=submit_data.customer_feedback,
        issues_found=submit_data.issues_found,
        verified_by=current_user.id if current_user else None,
    )
    if updated:
        return VerificationChecklistResponse.model_validate(updated)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Checklist not found",
    )


@router.get("/summary", response_model=VerificationSummary)
async def get_verification_summary(
    requirement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Get verification summary for a requirement."""
    repo = BaseRepository(VerificationChecklist, db)
    query = repo._get_query()
    query = query.where(VerificationChecklist.requirement_id == requirement_id)

    result = await db.execute(query)
    checklists = list(result.scalars().all())

    total = len(checklists)
    passed = sum(1 for c in checklists if c.result == "passed")
    failed = sum(1 for c in checklists if c.result == "failed")
    in_progress = sum(1 for c in checklists if c.result == "in_progress")
    not_started = sum(1 for c in checklists if c.result == "not_started")

    return VerificationSummary(
        requirement_id=requirement_id,
        total_checklists=total,
        passed=passed,
        failed=failed,
        in_progress=in_progress,
        not_started=not_started,
    )
