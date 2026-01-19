"""Verification schemas for Pydantic validation."""
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


# Checklist item
class ChecklistItem(BaseModel):
    """Single checklist item."""

    id: str = Field(..., description="Item ID")
    item: str = Field(..., description="Item description")
    checked: bool = Field(default=False, description="Item checked status")
    notes: Optional[str] = Field(None, description="Additional notes")


# Verification checklist create
class VerificationChecklistCreate(BaseModel):
    """Schema for creating a verification checklist."""

    verification_type: str = Field(
        ...,
        description="Verification type",
        pattern="^(fat|sat|uat|prototype|test)$",
    )
    checklist_name: str = Field(..., description="Checklist name")
    checklist_items: List[ChecklistItem] = Field(..., description="Checklist items")


# Verification checklist update
class VerificationChecklistUpdate(BaseModel):
    """Schema for updating a verification checklist."""

    checklist_items: List[ChecklistItem] = Field(..., description="Updated checklist items")


# Verification checklist submit
class VerificationChecklistSubmit(BaseModel):
    """Schema for submitting a verification checklist."""

    result: str = Field(
        ...,
        description="Verification result",
        pattern="^(not_started|in_progress|passed|failed|partial_passed|blocked)$",
    )
    evidence_attachments: Optional[Dict[str, Any]] = Field(None, description="Evidence attachments")
    customer_feedback: Optional[str] = Field(None, description="Customer feedback")
    issues_found: Optional[str] = Field(None, description="Issues found")


# Verification checklist response
class VerificationChecklistResponse(BaseModel):
    """Schema for verification checklist response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    verification_type: str
    checklist_name: str
    checklist_items: Dict[str, Any]
    result: str
    evidence_attachments: Optional[Dict[str, Any]]
    customer_feedback: Optional[str]
    issues_found: Optional[str]
    verified_by: Optional[int]
    created_at: str
    updated_at: str


# Verification summary
class VerificationSummary(BaseModel):
    """Schema for verification summary."""

    requirement_id: int
    total_checklists: int
    passed: int
    failed: int
    in_progress: int
    not_started: int
