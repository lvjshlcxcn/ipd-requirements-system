"""Analysis schemas for Pydantic validation."""
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


# INVEST Analysis
class INVESTAnalysis(BaseModel):
    """INVEST criteria analysis schema.

    Independent: Can the requirement be implemented independently?
    Negotiable: Is the requirement negotiable?
    Valuable: Does it provide value?
    Estimable: Can effort be estimated?
    Small: Is it small enough?
    Testable: Can it be tested?
    """

    independent: bool = Field(..., description="Can be implemented independently")
    negotiable: bool = Field(..., description="Is negotiable")
    valuable: bool = Field(..., description="Provides value")
    estimable: bool = Field(..., description="Effort can be estimated")
    small: bool = Field(..., description="Is small enough")
    testable: bool = Field(..., description="Can be tested")

    notes: Optional[str] = Field(None, description="Additional notes")


# MoSCoW Analysis
class MoSCoWAnalysis(BaseModel):
    """MoSCoW prioritization schema.

    Must have: Essential requirements
    Should have: Important but not critical
    Could have: Desirable but not necessary
    Won't have: Agreed not to implement now
    """

    priority: str = Field(
        ...,
        description="Priority level",
        pattern="^(must|should|could|wont)_have$",
    )
    notes: Optional[str] = Field(None, description="Rationale for priority")


# RICE Analysis
class RICEAnalysis(BaseModel):
    """RICE scoring schema.

    Reach: How many users will this impact? (1-10)
    Impact: How much will it impact? (1-10)
    Confidence: How confident are you? (1-10)
    Effort: How much effort is required? (1-10)

    Score = (Reach * Impact * Confidence) / Effort
    """

    reach: int = Field(..., ge=1, le=10, description="Reach (1-10)")
    impact: int = Field(..., ge=1, le=10, description="Impact (1-10)")
    confidence: int = Field(..., ge=1, le=10, description="Confidence (1-10)")
    effort: int = Field(..., ge=1, le=10, description="Effort (1-10)")

    notes: Optional[str] = Field(None, description="Additional notes")

    @property
    def score(self) -> float:
        """Calculate RICE score."""
        return (self.reach * self.impact * self.confidence) / self.effort


# Combined Analysis
class AnalysisCreate(BaseModel):
    """Schema for creating/updating analysis."""

    invest: INVESTAnalysis = Field(..., description="INVEST criteria")
    moscow: MoSCoWAnalysis = Field(..., description="MoSCoW priority")
    kano_category: str = Field(
        ...,
        description="KANO category",
        pattern="^(basic|performance|excitement|indifferent|reverse)$",
    )
    rice: RICEAnalysis = Field(..., description="RICE scoring")

    notes: Optional[str] = Field(None, description="Overall analysis notes")


class AnalysisResponse(BaseModel):
    """Schema for analysis response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    invest_analysis: Dict[str, Any]
    moscow_priority: str
    kano_category: str
    rice_score: Dict[str, Any]
    overall_score: float
    analyzed_by: Optional[int]
    analyzed_at: str


class AnalysisSummary(BaseModel):
    """Schema for analysis summary across requirements."""

    total_requirements: int
    analyzed_requirements: int
    by_kano: Dict[str, int]
    by_moscow: Dict[str, int]
    average_rice_score: float
