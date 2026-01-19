"""Attachment repository for file data access."""
import os
import uuid
from typing import Optional, List
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.attachment import Attachment


class AttachmentRepository:
    """Repository for Attachment model."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create(
        self,
        entity_type: str,
        entity_id: int,
        file_name: str,
        file_path: str,
        file_size: int,
        file_type: Optional[str] = None,
        mime_type: Optional[str] = None,
        uploaded_by: Optional[int] = None,
        description: Optional[str] = None,
    ) -> Attachment:
        """
        Create a new attachment record.

        Args:
            entity_type: Type of entity (e.g., 'requirement')
            entity_id: ID of the entity
            file_name: Original file name
            file_path: Server storage path
            file_size: File size in bytes
            file_type: File type/extension
            mime_type: MIME type
            uploaded_by: User ID who uploaded
            description: Optional description

        Returns:
            Created attachment
        """
        attachment = Attachment(
            entity_type=entity_type,
            entity_id=entity_id,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            description=description,
        )
        self.db.add(attachment)
        return attachment

    def get_by_id(self, attachment_id: int) -> Optional[Attachment]:
        """
        Get attachment by ID.

        Args:
            attachment_id: Attachment ID

        Returns:
            Attachment or None
        """
        return self.db.get(Attachment, attachment_id)

    def get_by_entity(
        self,
        entity_type: str,
        entity_id: int,
        include_deleted: bool = False,
    ) -> List[Attachment]:
        """
        Get all attachments for an entity.

        Args:
            entity_type: Type of entity
            entity_id: ID of the entity
            include_deleted: Whether to include soft-deleted attachments

        Returns:
            List of attachments
        """
        query = select(Attachment).where(
            and_(
                Attachment.entity_type == entity_type,
                Attachment.entity_id == entity_id,
            )
        )

        if not include_deleted:
            query = query.where(Attachment.is_deleted == False)  # noqa: E712

        query = query.order_by(Attachment.uploaded_at.desc())

        result = self.db.execute(query)
        return list(result.scalars().all())

    def delete(self, attachment: Attachment) -> None:
        """
        Soft delete an attachment.

        Args:
            attachment: Attachment to delete
        """
        attachment.is_deleted = True

    def hard_delete(self, attachment: Attachment) -> None:
        """
        Hard delete an attachment and remove physical file.

        Args:
            attachment: Attachment to delete
        """
        # Delete physical file
        if attachment.file_path and os.path.exists(attachment.file_path):
            try:
                os.remove(attachment.file_path)
            except Exception:
                # Log error but continue with database deletion
                pass

        # Delete database record
        self.db.delete(attachment)

    # ========================================================================
    # File Operations
    # ========================================================================

    def generate_storage_path(
        self,
        entity_type: str,
        entity_id: int,
        original_filename: str,
        base_upload_dir: str = "uploads",
    ) -> str:
        """
        Generate a unique storage path for uploaded file.

        Args:
            entity_type: Type of entity
            entity_id: ID of the entity
            original_filename: Original file name
            base_upload_dir: Base upload directory

        Returns:
            Relative path from project root
        """
        import time

        # Create entity-specific directory
        entity_dir = Path(base_upload_dir) / entity_type / str(entity_id)
        entity_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename: timestamp_uuid_sanitized_filename
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]
        sanitized_name = self._sanitize_filename(original_filename)

        storage_filename = f"{timestamp}_{unique_id}_{sanitized_name}"
        return str(entity_dir / storage_filename)

    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename for safe storage.

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        # Remove path separators
        filename = filename.replace("/", "").replace("\\", "")

        # Remove special characters
        import re
        filename = re.sub(r'[<>:"|?*]', '_', filename)

        # Limit length
        if len(filename) > 200:
            name, ext = os.path.splitext(filename)
            filename = name[:200 - len(ext)] + ext

        return filename
