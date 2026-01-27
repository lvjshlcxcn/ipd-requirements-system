"""
Unit tests for INVEST analysis schemas.

Tests Pydantic schema validation for INVEST criteria analysis
including Independent, Negotiable, Valuable, Estimable, Small, Testable.
"""

import pytest
from pydantic import ValidationError

from app.schemas.invest import (
    INVESTAnalysisCreate,
    INVESTAnalysisResponse,
)


@pytest.mark.unit
class TestINVESTAnalysisCreateSchema:
    """Test INVEST analysis create schema."""

    def test_invest_valid_all_true(self):
        """Test creating valid INVEST analysis with all criteria True."""
        data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "notes": "Perfect requirement",
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent is True
        assert schema.negotiable is True
        assert schema.valuable is True
        assert schema.estimable is True
        assert schema.small is True
        assert schema.testable is True
        assert schema.notes == "Perfect requirement"

    def test_invest_valid_all_false(self):
        """Test creating valid INVEST analysis with all criteria False."""
        data = {
            "independent": False,
            "negotiable": False,
            "valuable": False,
            "estimable": False,
            "small": False,
            "testable": False,
            "notes": "Poor requirement",
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent is False
        assert schema.negotiable is False
        assert schema.valuable is False
        assert schema.estimable is False
        assert schema.small is False
        assert schema.testable is False

    def test_invest_mixed_values(self):
        """Test INVEST analysis with mixed boolean values."""
        data = {
            "independent": True,
            "negotiable": False,
            "valuable": True,
            "estimable": True,
            "small": False,
            "testable": True,
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.independent is True
        assert schema.negotiable is False
        assert schema.valuable is True
        assert schema.estimable is True
        assert schema.small is False
        assert schema.testable is True

    def test_invest_required_fields(self):
        """Test that all INVEST boolean fields are required."""
        data = {
            "independent": True,
            "negotiable": True,
            # Missing other required fields
        }

        with pytest.raises(ValidationError) as exc:
            INVESTAnalysisCreate(**data)
        assert "valuable" in str(exc.value)

    def test_invest_without_notes(self):
        """Test INVEST analysis without notes (optional field)."""
        data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
        }

        schema = INVESTAnalysisCreate(**data)
        assert schema.notes is None

    def test_invest_notes_validation(self):
        """Test that notes field accepts string values."""
        data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": False,
            "testable": True,
            "notes": "This requirement meets most INVEST criteria except for size.",
        }

        schema = INVESTAnalysisCreate(**data)
        assert isinstance(schema.notes, str)
        assert len(schema.notes) > 0

    def test_invest_passed_count_calculation(self):
        """Test calculating passed count from boolean values."""
        data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": False,
            "small": False,
            "testable": True,
        }

        schema = INVESTAnalysisCreate(**data)
        passed_count = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert passed_count == 4


@pytest.mark.unit
class TestINVESTAnalysisResponseSchema:
    """Test INVEST analysis response schema."""

    def test_response_structure_valid(self):
        """Test creating valid INVEST analysis response."""
        data = {
            "requirement_id": 1,
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": False,
            "testable": True,
            "passed_count": 5,
            "total_count": 6,
            "notes": "Good requirement",
            "analyzed_at": "2026-01-28T10:00:00",
        }

        schema = INVESTAnalysisResponse(**data)
        assert schema.requirement_id == 1
        assert schema.passed_count == 5
        assert schema.total_count == 6
        assert schema.analyzed_at == "2026-01-28T10:00:00"

    def test_response_default_total_count(self):
        """Test that total_count defaults to 6."""
        data = {
            "requirement_id": 1,
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "passed_count": 6,
            "analyzed_at": "2026-01-28T10:00:00",
        }

        schema = INVESTAnalysisResponse(**data)
        assert schema.total_count == 6

    def test_response_without_notes(self):
        """Test response without optional notes field."""
        data = {
            "requirement_id": 1,
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "passed_count": 6,
            "analyzed_at": "2026-01-28T10:00:00",
        }

        schema = INVESTAnalysisResponse(**data)
        assert schema.notes is None

    def test_response_passed_count_range(self):
        """Test that passed_count is between 0 and 6."""
        # Test minimum
        data_min = {
            "requirement_id": 1,
            "independent": False,
            "negotiable": False,
            "valuable": False,
            "estimable": False,
            "small": False,
            "testable": False,
            "passed_count": 0,
            "analyzed_at": "2026-01-28T10:00:00",
        }
        schema_min = INVESTAnalysisResponse(**data_min)
        assert schema_min.passed_count == 0

        # Test maximum
        data_max = {
            "requirement_id": 1,
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "passed_count": 6,
            "analyzed_at": "2026-01-28T10:00:00",
        }
        schema_max = INVESTAnalysisResponse(**data_max)
        assert schema_max.passed_count == 6


@pytest.mark.unit
class TestINVESTEdgeCases:
    """Test edge cases and special scenarios."""

    def test_perfect_invest_score(self):
        """Test a perfect INVEST analysis (6/6 criteria met)."""
        data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "notes": "Excellent requirement",
        }

        schema = INVESTAnalysisCreate(**data)
        passed_count = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert passed_count == 6
        assert passed_count / 6 == 1.0  # 100% pass rate

    def test_poor_invest_score(self):
        """Test a poor INVEST analysis (0/6 criteria met)."""
        data = {
            "independent": False,
            "negotiable": False,
            "valuable": False,
            "estimable": False,
            "small": False,
            "testable": False,
            "notes": "Needs significant improvement",
        }

        schema = INVESTAnalysisCreate(**data)
        passed_count = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert passed_count == 0
        assert passed_count / 6 == 0.0  # 0% pass rate

    def test_partial_invest_score(self):
        """Test a partial INVEST analysis (3/6 criteria met)."""
        data = {
            "independent": True,
            "negotiable": False,
            "valuable": True,
            "estimable": False,
            "small": True,
            "testable": False,
        }

        schema = INVESTAnalysisCreate(**data)
        passed_count = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert passed_count == 3
        assert passed_count / 6 == 0.5  # 50% pass rate

    def test_single_criterion_met(self):
        """Test when only one criterion is met."""
        data = {
            "independent": True,
            "negotiable": False,
            "valuable": False,
            "estimable": False,
            "small": False,
            "testable": False,
        }

        schema = INVESTAnalysisCreate(**data)
        passed_count = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert passed_count == 1
        assert passed_count / 6 == pytest.approx(0.1667, rel=0.01)

    def test_five_criteria_met(self):
        """Test when five criteria are met."""
        data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": False,
        }

        schema = INVESTAnalysisCreate(**data)
        passed_count = sum([
            schema.independent,
            schema.negotiable,
            schema.valuable,
            schema.estimable,
            schema.small,
            schema.testable
        ])
        assert passed_count == 5
        assert passed_count / 6 == pytest.approx(0.8333, rel=0.01)
