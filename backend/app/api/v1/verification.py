"""Verification API endpoints."""
from typing import List, Optional
from datetime import datetime
import json

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


def serialize_checklist(checklist) -> dict:
    """Serialize verification checklist to dict for JSON response."""
    # Parse JSON strings back to Python objects for JSONB fields
    checklist_items = checklist.checklist_items
    if isinstance(checklist_items, str):
        checklist_items = json.loads(checklist_items)

    evidence_attachments = checklist.evidence_attachments
    if evidence_attachments and isinstance(evidence_attachments, str):
        evidence_attachments = json.loads(evidence_attachments)

    return {
        "id": checklist.id,
        "requirement_id": checklist.requirement_id,
        "verification_type": checklist.verification_type,
        "checklist_name": checklist.checklist_name,
        "checklist_items": checklist_items,  # Parsed from JSON string
        "result": checklist.result,
        "evidence_attachments": evidence_attachments,
        "customer_feedback": checklist.customer_feedback,
        "issues_found": checklist.issues_found,
        "verified_by": checklist.verified_by,
        "reviewed_by": checklist.reviewed_by,
        "tenant_id": checklist.tenant_id,
        "created_at": checklist.created_at.isoformat() if checklist.created_at else None,
        "updated_at": checklist.updated_at.isoformat() if checklist.updated_at else None,
    }

router = APIRouter(prefix="/requirements/{requirement_id}/verification", tags=["verification"])


@router.get("")
async def get_verifications(
    requirement_id: int,
    verification_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Get verification checklists for a requirement with pagination."""
    from sqlalchemy import select, func

    repo = BaseRepository(VerificationChecklist, db)

    # 先获取总数
    count_query = select(func.count(VerificationChecklist.id))
    count_query = count_query.where(VerificationChecklist.requirement_id == requirement_id)
    if verification_type:
        count_query = count_query.where(VerificationChecklist.verification_type == verification_type)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # 获取分页数据
    query = repo._get_query()
    query = query.where(VerificationChecklist.requirement_id == requirement_id)

    if verification_type:
        query = query.where(VerificationChecklist.verification_type == verification_type)

    query = query.order_by(VerificationChecklist.created_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    checklists = list(result.scalars().all())

    return {
        "success": True,
        "data": [serialize_checklist(c) for c in checklists],
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": (skip // limit) + 1,
        "pages": (total + limit - 1) // limit
    }


@router.get("/summary")
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

    summary = VerificationSummary(
        requirement_id=requirement_id,
        total_checklists=total,
        passed=passed,
        failed=failed,
        in_progress=in_progress,
        not_started=not_started,
    )

    return {
        "success": True,
        "data": summary
    }


@router.get("/{checklist_id}")
async def get_checklist(
    requirement_id: int,
    checklist_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Get a single verification checklist by ID."""
    repo = BaseRepository(VerificationChecklist, db)

    checklist = await repo.get_by_id(checklist_id)
    if not checklist or checklist.requirement_id != requirement_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    return {
        "success": True,
        "data": serialize_checklist(checklist)
    }


@router.post("")
async def create_checklist(
    requirement_id: int,
    checklist_data: VerificationChecklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional = Depends(lambda: None),
):
    """Create a new verification checklist."""
    repo = BaseRepository(VerificationChecklist, db)
    tenant_id = get_current_tenant() or (current_user.tenant_id if current_user else 1)

    # Convert Pydantic models to dicts, then to JSON string for JSONB
    checklist_items_dict = [item.model_dump() for item in checklist_data.checklist_items]
    checklist_items_json = json.dumps(checklist_items_dict)

    try:
        checklist = await repo.create(
            requirement_id=requirement_id,
            tenant_id=tenant_id,
            verification_type=checklist_data.verification_type,
            checklist_name=checklist_data.checklist_name,
            checklist_items=checklist_items_json,
            result="not_started",
            verified_by=None,
        )

        # 显式提交事务
        await db.commit()

        # Serialize the checklist object properly
        return {
            "success": True,
            "data": serialize_checklist(checklist)
        }
    except Exception as e:
        await db.rollback()
        raise


@router.put("/{checklist_id}")
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

    # Convert Pydantic models to dicts, then to JSON string for JSONB
    checklist_items_dict = [item.model_dump() for item in checklist_data.checklist_items]
    checklist_items_json = json.dumps(checklist_items_dict)

    try:
        updated = await repo.update(checklist_id, checklist_items=checklist_items_json)

        # 显式提交事务，确保数据保存到数据库
        await db.commit()

        if updated:
            return {
                "success": True,
                "data": serialize_checklist(updated)
            }
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    except Exception as e:
        await db.rollback()
        raise


@router.post("/{checklist_id}/submit")
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

    try:
        updated = await repo.update(
            checklist_id,
            result=submit_data.result,
            evidence_attachments=submit_data.evidence_attachments,
            customer_feedback=submit_data.customer_feedback,
            issues_found=submit_data.issues_found,
            verified_by=current_user.id if current_user else None,
        )

        # 显式提交事务，确保数据保存到数据库
        await db.commit()

        if updated:
            return {
                "success": True,
                "data": serialize_checklist(updated)
            }
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )
    except Exception as e:
        await db.rollback()
        raise
