"""Import/Export API endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from app.schemas.import_export import (
    ExcelImportRequest,
    ImportJobResponse,
    ExportRequest,
    ExportJobResponse,
    ImportResult,
)
from app.models.import_job import ImportJob, ImportStatus
from app.models.export_job import ExportJob, ExportType, ExportStatus
from app.repositories.base import BaseRepository
from app.api.deps import get_db, get_current_user
from app.core.tenant import get_current_tenant
from sqlalchemy.orm import Session
import os

router = APIRouter(prefix="/import-export", tags=["import-export"])


@router.post("/import/excel", response_model=ImportJobResponse)
async def import_excel(
    file: UploadFile = File(...),
    skip_header: bool = Query(True, description="Skip header row"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Import requirements from Excel file."""
    repo = BaseRepository(ImportJob, db)
    tenant_id = get_current_tenant() or current_user.tenant_id

    # Save file to disk
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{file.filename}"

    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    # Create import job
    import_job = await repo.create(
        tenant_id=tenant_id,
        imported_by=current_user.id,
        import_type="excel",
        file_name=file.filename,
        file_path=file_path,
        status=ImportStatus.pending,
        total_records=0,
        success_count=0,
        failed_count=0,
        error_log={},
    )

    # TODO: Trigger async import task
    # For now, mark as completed
    await repo.update(import_job.id, status=ImportStatus.completed)

    return ImportJobResponse.model_validate(import_job)


@router.get("/import/jobs", response_model=List[ImportJobResponse])
async def get_import_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get import jobs for current tenant."""
    repo = BaseRepository(ImportJob, db)
    query = repo._get_query()

    # Filter by tenant
    from app.models.import_job import ImportJob
    query = query.where(ImportJob.tenant_id == current_user.tenant_id)

    query = query.offset(skip).limit(limit)
    result = db.execute(query)
    jobs = list(result.scalars().all())
    return [ImportJobResponse.model_validate(j) for j in jobs]


@router.get("/import/jobs/{job_id}", response_model=ImportJobResponse)
async def get_import_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific import job."""
    repo = BaseRepository(ImportJob, db)
    job = await repo.get_by_id(job_id)

    if not job or job.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import job not found",
        )

    return ImportJobResponse.model_validate(job)


@router.post("/export", response_model=ExportJobResponse)
async def export_data(
    export_request: ExportRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export requirements to Excel or PDF."""
    repo = BaseRepository(ExportJob, db)
    tenant_id = get_current_tenant() or current_user.tenant_id

    # Create export job
    export_job = await repo.create(
        tenant_id=tenant_id,
        exported_by=current_user.id,
        export_type=export_request.export_type,
        filters=export_request.filters.model_dump(),
        status=ExportStatus.processing,
        file_path="",
        file_size=0,
        download_url="",
    )

    # TODO: Trigger async export task
    # For now, mark as completed
    await repo.update(export_job.id, status=ExportStatus.completed)

    return ExportJobResponse.model_validate(export_job)


@router.get("/export/jobs", response_model=List[ExportJobResponse])
async def get_export_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get export jobs for current tenant."""
    repo = BaseRepository(ExportJob, db)
    query = repo._get_query()

    # Filter by tenant
    from app.models.export_job import ExportJob
    query = query.where(ExportJob.tenant_id == current_user.tenant_id)

    query = query.offset(skip).limit(limit)
    result = db.execute(query)
    jobs = list(result.scalars().all())
    return [ExportJobResponse.model_validate(j) for j in jobs]


@router.get("/export/jobs/{job_id}", response_model=ExportJobResponse)
async def get_export_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific export job."""
    repo = BaseRepository(ExportJob, db)
    job = await repo.get_by_id(job_id)

    if not job or job.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found",
        )

    return ExportJobResponse.model_validate(job)


@router.get("/export/jobs/{job_id}/download")
async def download_export(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Download an exported file."""
    repo = BaseRepository(ExportJob, db)
    job = await repo.get_by_id(job_id)

    if not job or job.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found",
        )

    if not job.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not available",
        )

    # TODO: Return file content
    return {
        "success": True,
        "download_url": job.download_url,
    }
