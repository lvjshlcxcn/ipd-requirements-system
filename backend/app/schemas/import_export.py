"""Import/Export schemas for Pydantic validation."""
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


# Excel import request
class ExcelImportRequest(BaseModel):
    """Schema for Excel import request."""

    file_name: str = Field(..., description="Uploaded file name")
    file_path: str = Field(..., description="File storage path")
    skip_header: bool = Field(default=True, description="Skip header row")
    column_mapping: Optional[Dict[str, str]] = Field(
        None, description="Column mapping (source -> target)"
    )


# Import job response
class ImportJobResponse(BaseModel):
    """Schema for import job response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    imported_by: int
    import_type: str
    file_name: Optional[str]
    status: str
    total_records: Optional[int]
    success_count: Optional[int]
    failed_count: Optional[int]
    error_log: Optional[Dict[str, Any]]
    created_at: str
    started_at: Optional[int]
    completed_at: Optional[int]


# Export request
class ExportRequest(BaseModel):
    """Schema for export request."""

    export_type: str = Field(
        ..., pattern="^(excel|pdf|csv)$", description="Export format"
    )
    filters: Optional[Dict[str, Any]] = Field(None, description="Export filters")
    include_analysis: bool = Field(default=True, description="Include analysis data")
    include_history: bool = Field(default=False, description="Include version history")


# Export job response
class ExportJobResponse(BaseModel):
    """Schema for export job response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    exported_by: int
    export_type: str
    status: str
    file_path: Optional[str]
    file_size: Optional[int]
    download_url: Optional[str]
    created_at: str


# Import result
class ImportResult(BaseModel):
    """Schema for import result."""

    total_rows: int
    success_count: int
    failed_count: int
    errors: List[str] = Field(default_factory=list)
