"""Attachments API endpoints."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File as FastAPIFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.attachment import AttachmentService
from app.schemas.attachment import (
    AttachmentResponse,
    AttachmentListResponse,
    MessageResponse,
)

router = APIRouter(prefix="/attachments", tags=["Attachments"])


def get_attachment_service(db: Session = Depends(get_db)) -> AttachmentService:
    """Get attachment service instance."""
    return AttachmentService(db)


# ========================================================================
# Upload Endpoints
# ========================================================================

@router.post("/upload", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = FastAPIFile(...),
    entity_type: str = Form(..., description="Entity type (e.g., 'requirement', 'rtm')"),
    entity_id: int = Form(..., description="Entity ID"),
    description: str = Form(None, description="Optional file description"),
    service: AttachmentService = Depends(get_attachment_service),
):
    """
    Upload an attachment for any entity type.

    - **file**: File to upload (max 50MB)
    - **entity_type**: Entity type (e.g., 'requirement', 'rtm')
    - **entity_id**: Entity ID
    - **description**: Optional file description

    Returns:
        Created attachment details
    """
    # Read file content
    file_content = await file.read()

    # Get file extension
    file_type = None
    if "." in file.filename:
        file_type = file.filename.rsplit(".", 1)[-1].lower()

    try:
        attachment = service.upload_attachment(
            entity_type=entity_type,
            entity_id=entity_id,
            file_name=file.filename,
            file_content=file_content,
            file_type=file_type,
            mime_type=file.content_type,
            uploaded_by=None,  # TODO: Get from JWT token
            description=description,
        )
        return AttachmentResponse.model_validate(attachment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requirements/{requirement_id}", response_model=AttachmentResponse)
async def upload_requirement_attachment(
    requirement_id: int,
    file: UploadFile = FastAPIFile(...),
    description: str = Query(None, description="Optional file description"),
    service: AttachmentService = Depends(get_attachment_service),
):
    """
    Upload an attachment for a requirement.

    - **requirement_id**: Requirement ID
    - **file**: File to upload (max 50MB)
    - **description**: Optional description

    Returns:
        Created attachment details
    """
    # Read file content
    file_content = await file.read()

    # Get file extension
    file_type = None
    if "." in file.filename:
        file_type = file.filename.rsplit(".", 1)[-1].lower()

    try:
        attachment = service.upload_attachment(
            entity_type="requirement",
            entity_id=requirement_id,
            file_name=file.filename,
            file_content=file_content,
            file_type=file_type,
            mime_type=file.content_type,
            uploaded_by=None,  # TODO: Get from JWT token
            description=description,
        )
        return AttachmentResponse.model_validate(attachment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========================================================================
# Query Endpoints
# ========================================================================

@router.get("/requirements/{requirement_id}", response_model=AttachmentListResponse)
async def get_requirement_attachments(
    requirement_id: int,
    service: AttachmentService = Depends(get_attachment_service),
):
    """
    Get all attachments for a requirement.

    - **requirement_id**: Requirement ID

    Returns:
        List of attachments
    """
    attachments = service.get_attachments(
        entity_type="requirement",
        entity_id=requirement_id,
    )

    items_data = [AttachmentResponse.model_validate(att) for att in attachments]

    return AttachmentListResponse(
        success=True,
        data=items_data,
    )


@router.get("/{attachment_id}", response_model=AttachmentResponse)
async def get_attachment(
    attachment_id: int,
    service: AttachmentService = Depends(get_attachment_service),
):
    """
    Get attachment by ID.

    - **attachment_id**: Attachment ID

    Returns:
        Attachment details
    """
    attachment = service.get_attachment_by_id(attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    return AttachmentResponse.model_validate(attachment)


# ========================================================================
# Download Endpoints
# ========================================================================

@router.get("/{attachment_id}/download")
async def download_attachment(
    attachment_id: int,
    service: AttachmentService = Depends(get_attachment_service),
):
    """
    Download an attachment file.

    - **attachment_id**: Attachment ID

    Returns:
        File response with original filename
    """
    try:
        file_info = service.get_attachment_file_info(attachment_id)

        return FileResponse(
            path=file_info["file_path"],
            filename=file_info["file_name"],
            media_type=file_info["mime_type"],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ========================================================================
# Delete Endpoints
# ========================================================================

@router.delete("/{attachment_id}", response_model=MessageResponse)
async def delete_attachment(
    attachment_id: int,
    service: AttachmentService = Depends(get_attachment_service),
):
    """
    Delete an attachment (soft delete).

    - **attachment_id**: Attachment ID

    Returns:
        Success message
    """
    try:
        service.delete_attachment(attachment_id)
        return MessageResponse(success=True, message="附件删除成功")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
