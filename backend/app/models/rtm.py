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

    # 文档ID字段（保留用于向后兼容和手动输入）
    design_id = Column(String(100), nullable=True)
    code_id = Column(String(100), nullable=True)
    test_id = Column(String(100), nullable=True)

    # 附件关联字段（新增：用于文件上传）
    design_attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
    code_attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
    test_attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)

    status = Column(String(50), default="active", nullable=False)
    notes = Column(Text, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships to attachments
    design_attachment = relationship("Attachment", foreign_keys=[design_attachment_id])
    code_attachment = relationship("Attachment", foreign_keys=[code_attachment_id])
    test_attachment = relationship("Attachment", foreign_keys=[test_attachment_id])

    # Relationship to requirement
    # requirement = relationship("Requirement", back_populates="traceability_links")
