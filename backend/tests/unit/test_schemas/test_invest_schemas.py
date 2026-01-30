"""
Unit tests for INVEST analysis schemas - 评分系统

Tests Pydantic schema validation for INVEST criteria analysis
including Independent, Negotiable, Valuable, Estimable, Small, Testable.
Each criterion is scored 0-100 instead of boolean.
"""

import pytest
from pydantic import ValidationError

from app.schemas.invest import (
    INVESTAnalysisCreate,
    INVESTAnalysisResponse,
)


@pytest.mark.unit
class TestINVESTAnalysisCreateSchema:
    """Test INVEST analysis create schema - 评分系统."""

    def test_invest_valid_perfect_scores(self):
        """Test creating valid INVEST analysis with perfect scores (100)."""
        data = {
            "independent": 100,
            "negotiable": 100,
            "valuable": 100,
            "estimable": 100,
            "small": 100,
            "testable": 100,
            "notes": "Perfect requirement",
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent == 100
        assert schema.negotiable == 100
        assert schema.valuable == 100
        assert schema.estimable == 100
        assert schema.small == 100
        assert schema.testable == 100
        assert schema.notes == "Perfect requirement"

    def test_invest_valid_zero_scores(self):
        """Test creating valid INVEST analysis with zero scores."""
        data = {
            "independent": 0,
            "negotiable": 0,
            "valuable": 0,
            "estimable": 0,
            "small": 0,
            "testable": 0,
            "notes": "Poor requirement",
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent == 0
        assert schema.negotiable == 0
        assert schema.valuable == 0
        assert schema.estimable == 0
        assert schema.small == 0
        assert schema.testable == 0

    def test_invest_mixed_scores(self):
        """Test INVEST analysis with mixed scores."""
        data = {
            "independent": 85,
            "negotiable": 40,
            "valuable": 75,
            "estimable": 90,
            "small": 55,
            "testable": 70,
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent == 85
        assert schema.negotiable == 40
        assert schema.valuable == 75
        assert schema.estimable == 90
        assert schema.small == 55
        assert schema.testable == 70

    def test_invest_required_fields(self):
        """Test that all INVEST score fields are required."""
        data = {
            "independent": 50,
            "negotiable": 50,
            # Missing other required fields
        }

        with pytest.raises(ValidationError) as exc:
            INVESTAnalysisCreate(**data)
        assert "valuable" in str(exc.value)

    def test_invest_without_notes(self):
        """Test INVEST analysis without notes (optional field)."""
        data = {
            "independent": 75,
            "negotiable": 80,
            "valuable": 85,
            "estimable": 90,
            "small": 70,
            "testable": 80,
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.notes is None

    def test_invest_notes_validation(self):
        """Test that notes field accepts string values."""
        data = {
            "independent": 85,
            "negotiable": 60,
            "valuable": 90,
            "estimable": 75,
            "small": 70,
            "testable": 80,
            "notes": "This requirement meets most INVEST criteria.",
        }

        schema = INVESTAnalysisCreate(**data)
        assert isinstance(schema.notes, str)
        assert len(schema.notes) > 0

    def test_invest_score_range_validation(self):
        """Test that scores must be between 0 and 100."""
        # Test negative score (should fail)
        data = {
            "independent": -10,
            "negotiable": 50,
            "valuable": 50,
            "estimable": 50,
            "small": 50,
            "testable": 50,
        }

        with pytest.raises(ValidationError):
            INVESTAnalysisCreate(**data)

        # Test score > 100 (should fail)
        data = {
            "independent": 150,
            "negotiable": 50,
            "valuable": 50,
            "estimable": 50,
            "small": 50,
            "testable": 50,
        }

        with pytest.raises(ValidationError):
            INVESTAnalysisCreate(**data)

    def test_invest_boundary_scores(self):
        """Test boundary values (0 and 100)."""
        data = {
            "independent": 0,
            "negotiable": 100,
            "valuable": 50,
            "estimable": 0,
            "small": 100,
            "testable": 50,
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent == 0
        assert schema.negotiable == 100
        assert schema.estimable == 0
        assert schema.small == 100


@pytest.mark.unit
class TestINVESTAnalysisResponseSchema:
    """Test INVEST analysis response schema - 评分系统."""

    def test_response_structure_valid(self):
        """Test creating valid INVEST analysis response."""
        data = {
            "requirement_id": 1,
            "independent": 85,
            "negotiable": 60,
            "valuable": 90,
            "estimable": 75,
            "small": 70,
            "testable": 80,
            "total_score": 460,
            "average_score": 76.67,
            "notes": "Good requirement",
            "analyzed_at": "2026-01-28T10:00:00",
        }

        schema = INVESTAnalysisResponse(**data)
        assert schema.requirement_id == 1
        assert schema.total_score == 460
        assert schema.average_score == 76.67
        assert schema.analyzed_at == "2026-01-28T10:00:00"

    def test_response_without_notes(self):
        """Test response without optional notes field."""
        data = {
            "requirement_id": 1,
            "independent": 100,
            "negotiable": 100,
            "valuable": 100,
            "estimable": 100,
            "small": 100,
            "testable": 100,
            "total_score": 600,
            "average_score": 100.00,
            "analyzed_at": "2026-01-28T10:00:00",
        }

        schema = INVESTAnalysisResponse(**data)
        assert schema.notes is None

    def test_response_score_calculation(self):
        """Test total_score and average_score calculation."""
        # Test maximum scores
        data_max = {
            "requirement_id": 1,
            "independent": 100,
            "negotiable": 100,
            "valuable": 100,
            "estimable": 100,
            "small": 100,
            "testable": 100,
            "total_score": 600,
            "average_score": 100.00,
            "analyzed_at": "2026-01-28T10:00:00",
        }
        schema_max = INVESTAnalysisResponse(**data_max)
        assert schema_max.total_score == 600
        assert schema_max.average_score == 100.00

        # Test minimum scores
        data_min = {
            "requirement_id": 2,
            "independent": 0,
            "negotiable": 0,
            "valuable": 0,
            "estimable": 0,
            "small": 0,
            "testable": 0,
            "total_score": 0,
            "average_score": 0.00,
            "analyzed_at": "2026-01-28T10:00:00",
        }
        schema_min = INVESTAnalysisResponse(**data_min)
        assert schema_min.total_score == 0
        assert schema_min.average_score == 0.00

    def test_response_average_score_precision(self):
        """Test that average_score can have decimal precision."""
        data = {
            "requirement_id": 1,
            "independent": 85,
            "negotiable": 60,
            "valuable": 90,
            "estimable": 75,
            "small": 70,
            "testable": 80,
            "total_score": 460,
            "average_score": 76.67,
            "analyzed_at": "2026-01-28T10:00:00",
        }

        schema = INVESTAnalysisResponse(**data)
        assert schema.average_score == 76.67
        assert isinstance(schema.average_score, float)


@pytest.mark.unit
class TestINVESTEdgeCases:
    """Test edge cases and special scenarios - 评分系统."""

    def test_perfect_invest_score(self):
        """Test a perfect INVEST analysis (600/600)."""
        data = {
            "independent": 100,
            "negotiable": 100,
            "valuable": 100,
            "estimable": 100,
            "small": 100,
            "testable": 100,
            "notes": "Excellent requirement",
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = (
            schema.independent +
            schema.negotiable +
            schema.valuable +
            schema.estimable +
            schema.small +
            schema.testable
        )
        assert total_score == 600
        assert total_score / 600 == 1.0  # 100% score

    def test_poor_invest_score(self):
        """Test a poor INVEST analysis (0/600)."""
        data = {
            "independent": 0,
            "negotiable": 0,
            "valuable": 0,
            "estimable": 0,
            "small": 0,
            "testable": 0,
            "notes": "Needs significant improvement",
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = (
            schema.independent +
            schema.negotiable +
            schema.valuable +
            schema.estimable +
            schema.small +
            schema.testable
        )
        assert total_score == 0
        assert total_score / 600 == 0.0  # 0% score

    def test_partial_invest_score(self):
        """Test a partial INVEST analysis (300/600 = 50%)."""
        data = {
            "independent": 50,
            "negotiable": 50,
            "valuable": 50,
            "estimable": 50,
            "small": 50,
            "testable": 50,
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = (
            schema.independent +
            schema.negotiable +
            schema.valuable +
            schema.estimable +
            schema.small +
            schema.testable
        )
        assert total_score == 300
        assert total_score / 600 == 0.5  # 50% score

    def test_single_dimension_perfect(self):
        """Test when only one dimension has perfect score."""
        data = {
            "independent": 100,
            "negotiable": 0,
            "valuable": 0,
            "estimable": 0,
            "small": 0,
            "testable": 0,
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = (
            schema.independent +
            schema.negotiable +
            schema.valuable +
            schema.estimable +
            schema.small +
            schema.testable
        )
        assert total_score == 100
        assert total_score / 600 == pytest.approx(0.1667, rel=0.01)

    def test_average_scores(self):
        """Test when all dimensions have average scores."""
        data = {
            "independent": 75,
            "negotiable": 80,
            "valuable": 70,
            "estimable": 85,
            "small": 65,
            "testable": 75,
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert total_score == 450
        average = total_score / 6
        assert average == 75.0

    def test_high_quality_scores(self):
        """Test high quality requirement (80+ average)."""
        data = {
            "independent": 85,
            "negotiable": 80,
            "valuable": 90,
            "estimable": 85,
            "small": 75,
            "testable": 85,
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert total_score == 500
        average = total_score / 6
        assert average >= 80  # High quality threshold

    def test_medium_quality_scores(self):
        """Test medium quality requirement (60-80 average)."""
        data = {
            "independent": 65,
            "negotiable": 60,
            "valuable": 70,
            "estimable": 65,
            "small": 60,
            "testable": 60,
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert total_score == 380
        average = total_score / 6
        assert 60 <= average < 80  # Medium quality range

    def test_low_quality_scores(self):
        """Test low quality requirement (<60 average)."""
        data = {
            "independent": 50,
            "negotiable": 40,
            "valuable": 55,
            "estimable": 45,
            "small": 50,
            "testable": 40,
        }

        schema = INVESTAnalysisCreate(**data)
        total_score = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert total_score == 280
        average = total_score / 6
        assert average < 60  # Low quality threshold
