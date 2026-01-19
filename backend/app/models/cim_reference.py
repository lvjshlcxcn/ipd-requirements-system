"""CIM model reference model."""
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, TenantMixin


# CIM model type enum
CIMModelType = PG_ENUM(
    "process",
    "data",
    "functional",
    "non_functional",
    name="cim_model_type",
    create_type=True,
)


class CIMReference(Base, TimestampMixin, TenantMixin):
    """CIM (Common Information Model) reference model."""

    __tablename__ = "cim_references"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reference_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(200), nullable=False)
    model_type: Mapped[str] = mapped_column(CIMModelType, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Storage path to model file
    storage_path: Mapped[str | None] = mapped_column(String(500))

    version: Mapped[str | None] = mapped_column(String(20))

    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return f"<CIMReference(id={self.id}, code='{self.reference_code}', name='{self.model_name}')>"


class RequirementCIMLink(Base, TimestampMixin, TenantMixin):
    """Many-to-many relationship between requirements and CIM references."""

    __tablename__ = "requirement_cim_links"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requirement_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cim_reference_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("cim_references.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Link type enum
    link_type: Mapped[str] = mapped_column(
        PG_ENUM(
            "implements",
            "extends",
            "refines",
            "references",
            name="cim_link_type",
            create_type=True,
        ),
        nullable=False,
    )

    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    def __repr__(self) -> str:
        return (
            f"<RequirementCIMLink(requirement_id={self.requirement_id}, "
            f"cim_id={self.cim_reference_id}, type='{self.link_type}')>"
        )
