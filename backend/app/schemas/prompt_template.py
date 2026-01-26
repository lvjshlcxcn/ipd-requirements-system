"""Prompt template schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class PromptTemplateBase(BaseModel):
    """Base prompt template fields."""

    name: str = Field(..., min_length=1, max_length=200, description="Template display name")
    description: Optional[str] = Field(None, description="Template description")
    content: str = Field(..., min_length=10, description="Prompt content with variables")
    variables: Optional[List[str]] = Field(default_factory=list, description="Variable names in template")


class PromptTemplateCreate(PromptTemplateBase):
    """Schema for creating a prompt template."""

    template_key: str = Field(
        ...,
        pattern="^(ipd_ten_questions|quick_insight)$",
        description="Template identifier"
    )


class PromptTemplateUpdate(BaseModel):
    """Schema for updating a prompt template."""

    content: str = Field(..., min_length=10, description="New prompt content")
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    variables: Optional[List[str]] = None


class PromptTemplateResponse(BaseModel):
    """Prompt template response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    template_key: str
    version: str
    is_active: bool
    name: str
    description: Optional[str]
    content: str
    variables: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime


class PromptTemplateListResponse(BaseModel):
    """List of prompt templates response."""

    success: bool = True
    data: List[PromptTemplateResponse]
    total: int
