"""Import job model for tracking bulk imports."""
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin


# Import status enum
ImportStatus = PG_ENUM(
    "pending",
    "processing",
    "completed",
    "failed",
    name="import_status",
    create_type=True,
)


class ImportJob(Base, TimestampMixin, TenantMixin):
    """Import job model for tracking Excel/API imports."""

    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    imported_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    import_type: Mapped[str] = mapped_column(String(20), nullable=False)  # excel, api
    file_name: Mapped[str | None] = mapped_column(String(255))
    file_path: Mapped[str | None] = mapped_column(String(500))

    status: Mapped[str] = mapped_column(ImportStatus, default="pending")

    # Import statistics
    total_records: Mapped[int | None] = mapped_column(Integer)
    success_count: Mapped[int | None] = mapped_column(Integer, default=0)
    failed_count: Mapped[int | None] = mapped_column(Integer, default=0)

    # Error log (JSONB): Array of {row, error}
    error_log: Mapped[dict | None] = mapped_column(JSONB)

    started_at: Mapped[int | None] = mapped_column(Integer)
    completed_at: Mapped[int | None] = mapped_column(Integer)

    def __repr__(self) -> str:
        return (
            f"<ImportJob(id={self.id}, type='{self.import_type}', status='{self.status}', "
            f"success={self.success_count}, failed={self.failed_count})>"
        )
