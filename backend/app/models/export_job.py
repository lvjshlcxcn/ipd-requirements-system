"""Export job model for tracking bulk exports."""
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin


# Export type enum
ExportType = PG_ENUM(
    "excel",
    "pdf",
    "csv",
    name="export_type",
    create_type=True,
)


# Export status enum
ExportStatus = PG_ENUM(
    "processing",
    "completed",
    "failed",
    name="export_status",
    create_type=True,
)


class ExportJob(Base, TimestampMixin, TenantMixin):
    """Export job model for tracking Excel/PDF exports."""

    __tablename__ = "export_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exported_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    export_type: Mapped[str] = mapped_column(ExportType, nullable=False)

    # Filters applied to export (JSONB)
    filters: Mapped[dict | None] = mapped_column(JSONB)

    status: Mapped[str] = mapped_column(ExportStatus, default="processing")

    # Result
    file_path: Mapped[str | None] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column(Integer)
    download_url: Mapped[str | None] = mapped_column(String(500))

    def __repr__(self) -> str:
        return (
            f"<ExportJob(id={self.id}, type='{self.export_type}', status='{self.status}', "
            f"file_path='{self.file_path}')>"
        )
