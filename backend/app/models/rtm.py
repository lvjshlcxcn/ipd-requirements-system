"""RTM (Requirements Traceability Matrix) models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.db.base import Base


class TraceabilityLink(Base):
    """需求追溯关联表."""

    __tablename__ = "traceability_links"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    design_id = Column(String(100), nullable=True)
    code_id = Column(String(100), nullable=True)
    test_id = Column(String(100), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    notes = Column(Text, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to requirement
    # requirement = relationship("Requirement", back_populates="traceability_links")
