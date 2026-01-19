"""Attachment service for file upload business logic."""
import os
from typing import Optional, List
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.repositories.attachment import AttachmentRepository


class AttachmentService:
    """Service for Attachment business logic."""

    # Maximum file size: 50MB
    MAX_FILE_SIZE = 50 * 1024 * 1024

    def __init__(self, db: Session):
        self.db = db
        self.repo = AttachmentRepository(db)

    # ========================================================================
    # Upload Operations
    # ========================================================================

    def upload_attachment(
        self,
        entity_type: str,
        entity_id: int,
        file_name: str,
        file_content: bytes,
        file_type: Optional[str] = None,
        mime_type: Optional[str] = None,
        uploaded_by: Optional[int] = None,
        description: Optional[str] = None,
    ) -> Attachment:
        """
        Upload and save an attachment.

        Args:
            entity_type: Type of entity (e.g., 'requirement')
            entity_id: ID of the entity
            file_name: Original file name
            file_content: File content as bytes
            file_type: File type/extension
            mime_type: MIME type
            uploaded_by: User ID who uploaded
            description: Optional description

        Returns:
            Created attachment

        Raises:
            ValueError: If file size exceeds limit
        """
        file_size = len(file_content)

        # Validate file size
        if file_size > self.MAX_FILE_SIZE:
            raise ValueError(
                f"File size ({file_size} bytes) exceeds "
                f"maximum allowed size ({self.MAX_FILE_SIZE} bytes)"
            )

        # Generate storage path
        file_path = self.repo.generate_storage_path(
            entity_type=entity_type,
            entity_id=entity_id,
            original_filename=file_name,
        )

        # Convert to absolute path
        abs_file_path = Path(file_path).resolve()

        # Save file to disk
        abs_file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(abs_file_path, "wb") as f:
            f.write(file_content)

        # Create database record (store relative path)
        attachment = self.repo.create(
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

        self.db.commit()
        self.db.refresh(attachment)

        return attachment

    # ========================================================================
    # Query Operations
    # ========================================================================

    def get_attachments(
        self,
        entity_type: str,
        entity_id: int,
    ) -> List[Attachment]:
        """
        Get all attachments for an entity.

        Args:
            entity_type: Type of entity
            entity_id: ID of the entity

        Returns:
            List of attachments
        """
        return self.repo.get_by_entity(entity_type, entity_id)

    def get_attachment_by_id(self, attachment_id: int) -> Optional[Attachment]:
        """
        Get attachment by ID.

        Args:
            attachment_id: Attachment ID

        Returns:
            Attachment or None
        """
        return self.repo.get_by_id(attachment_id)

    # ========================================================================
    # Delete Operations
    # ========================================================================

    def delete_attachment(self, attachment_id: int) -> bool:
        """
        Delete an attachment (soft delete).

        Args:
            attachment_id: Attachment ID

        Returns:
            True if deleted, False if not found

        Raises:
            ValueError: If attachment not found
        """
        attachment = self.repo.get_by_id(attachment_id)
        if not attachment:
            raise ValueError(f"Attachment with ID {attachment_id} not found")

        self.repo.delete(attachment)
        self.db.commit()

        return True

    def hard_delete_attachment(self, attachment_id: int) -> bool:
        """
        Hard delete an attachment and remove physical file.

        Args:
            attachment_id: Attachment ID

        Returns:
            True if deleted, False if not found

        Raises:
            ValueError: If attachment not found
        """
        attachment = self.repo.get_by_id(attachment_id)
        if not attachment:
            raise ValueError(f"Attachment with ID {attachment_id} not found")

        self.repo.hard_delete(attachment)
        self.db.commit()

        return True

    # ========================================================================
    # Download Operations
    # ========================================================================

    def get_attachment_file_path(self, attachment_id: int) -> str:
        """
        Get the absolute file path for an attachment.

        Args:
            attachment_id: Attachment ID

        Returns:
            Absolute file path

        Raises:
            ValueError: If attachment not found
        """
        attachment = self.repo.get_by_id(attachment_id)
        if not attachment:
            raise ValueError(f"Attachment with ID {attachment_id} not found")

        # Convert relative path to absolute
        abs_path = Path(attachment.file_path).resolve()

        if not abs_path.exists():
            raise ValueError(f"File not found: {attachment.file_path}")

        return str(abs_path)

    def get_attachment_file_info(self, attachment_id: int) -> dict:
        """
        Get file information for download.

        Args:
            attachment_id: Attachment ID

        Returns:
            Dictionary with file_name, file_path, mime_type

        Raises:
            ValueError: If attachment not found
        """
        attachment = self.repo.get_by_id(attachment_id)
        if not attachment:
            raise ValueError(f"Attachment with ID {attachment_id} not found")

        return {
            "file_name": attachment.file_name,
            "file_path": self.get_attachment_file_path(attachment_id),
            "mime_type": attachment.mime_type or "application/octet-stream",
        }
