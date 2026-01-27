"""
Unit tests for INVEST Service.

Tests INVEST analysis business logic including:
- Getting INVEST analysis for a requirement
- Saving INVEST analysis with passed count calculation
- Handling requirement not found scenarios
"""

import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime

from app.services.invest import InvestService
from app.schemas.invest import INVESTAnalysisCreate


@pytest.mark.unit
class TestInvestServiceGetAnalysis:
    """Test getting INVEST analysis."""

    @pytest.mark.asyncio
    async def test_get_invest_analysis_success(self):
        """Test successfully getting INVEST analysis."""
        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.invest_analysis = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": False,
            "testable": True,
            "passed_count": 5,
            "notes": "Good requirement"
        }

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.get_by_id = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Get analysis
        result = await service.get_invest_analysis(1)

        assert result is not None
        assert result["independent"] is True
        assert result["passed_count"] == 5
        assert result["notes"] == "Good requirement"

    @pytest.mark.asyncio
    async def test_get_invest_analysis_not_found(self):
        """Test getting INVEST analysis for non-existent requirement."""
        # Mock repository returns None
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.get_by_id = AsyncMock(return_value=None)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Get analysis
        result = await service.get_invest_analysis(999)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_invest_analysis_no_data(self):
        """Test getting INVEST analysis when requirement exists but no analysis data."""
        # Mock requirement without invest_analysis
        mock_requirement = Mock()
        mock_requirement.invest_analysis = None

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.get_by_id = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Get analysis
        result = await service.get_invest_analysis(1)

        assert result is None


@pytest.mark.unit
class TestInvestServiceSaveAnalysis:
    """Test saving INVEST analysis."""

    @pytest.mark.asyncio
    async def test_save_invest_analysis_all_true(self):
        """Test saving INVEST analysis with all criteria True."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True,
            notes="Perfect requirement"
        )

        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Save analysis
        result = await service.save_invest_analysis(1, invest_data, user_id=10)

        assert result is not None
        assert result["requirement_id"] == 1
        assert result["passed_count"] == 6
        assert result["independent"] is True
        assert result["notes"] == "Perfect requirement"

        # Verify update was called
        mock_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_invest_analysis_all_false(self):
        """Test saving INVEST analysis with all criteria False."""
        invest_data = INVESTAnalysisCreate(
            independent=False,
            negotiable=False,
            valuable=False,
            estimable=False,
            small=False,
            testable=False,
            notes="Poor requirement"
        )

        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.id = 2
        mock_requirement.updated_at = datetime.now()

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Save analysis
        result = await service.save_invest_analysis(2, invest_data, user_id=10)

        assert result is not None
        assert result["passed_count"] == 0
        assert result["independent"] is False

    @pytest.mark.asyncio
    async def test_save_invest_analysis_mixed_values(self):
        """Test saving INVEST analysis with mixed boolean values."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=False,
            valuable=True,
            estimable=True,
            small=False,
            testable=True,
            notes="Partial requirement"
        )

        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.id = 3
        mock_requirement.updated_at = datetime.now()

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Save analysis
        result = await service.save_invest_analysis(3, invest_data, user_id=10)

        assert result is not None
        assert result["passed_count"] == 4  # True, False, True, True, False, True

    @pytest.mark.asyncio
    async def test_save_invest_analysis_without_notes(self):
        """Test saving INVEST analysis without notes."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True
        )

        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.id = 4
        mock_requirement.updated_at = datetime.now()

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Save analysis
        result = await service.save_invest_analysis(4, invest_data, user_id=10)

        assert result is not None
        assert result["notes"] is None
        assert result["passed_count"] == 6

    @pytest.mark.asyncio
    async def test_save_invest_analysis_requirement_not_found(self):
        """Test saving INVEST analysis for non-existent requirement."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True
        )

        # Mock repository returns None
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=None)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Save analysis
        result = await service.save_invest_analysis(999, invest_data, user_id=10)

        assert result is None

    @pytest.mark.asyncio
    async def test_save_invest_analysis_passes_user_id(self):
        """Test that user_id is correctly passed to update method."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True
        )

        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Save analysis with specific user_id
        user_id = 42
        await service.save_invest_analysis(1, invest_data, user_id=user_id)

        # Verify update was called with correct user_id
        call_args = mock_repo.update.call_args
        assert call_args[0][0] == 1  # requirement_id
        assert "updated_by" in call_args[1]["kwargs"]
        assert call_args[1]["kwargs"]["updated_by"] == user_id


@pytest.mark.unit
class TestInvestServicePassedCountCalculation:
    """Test passed count calculation logic."""

    @pytest.mark.asyncio
    async def test_passed_count_zero(self):
        """Test passed count calculation when all False."""
        invest_data = INVESTAnalysisCreate(
            independent=False,
            negotiable=False,
            valuable=False,
            estimable=False,
            small=False,
            testable=False
        )

        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        service = InvestService(mock_session)
        service.req_repo = mock_repo

        result = await service.save_invest_analysis(1, invest_data, user_id=10)

        assert result["passed_count"] == 0

    @pytest.mark.asyncio
    async def test_passed_count_partial(self):
        """Test passed count calculation with mixed values."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=False,
            valuable=True,
            estimable=False,
            small=True,
            testable=False
        )

        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        service = InvestService(mock_session)
        service.req_repo = mock_repo

        result = await service.save_invest_analysis(1, invest_data, user_id=10)

        assert result["passed_count"] == 3

    @pytest.mark.asyncio
    async def test_passed_count_full(self):
        """Test passed count calculation when all True."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True
        )

        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        service = InvestService(mock_session)
        service.req_repo = mock_repo

        result = await service.save_invest_analysis(1, invest_data, user_id=10)

        assert result["passed_count"] == 6


@pytest.mark.unit
class TestInvestServiceDataStructure:
    """Test data structure and formatting."""

    @pytest.mark.asyncio
    async def test_saved_data_contains_all_fields(self):
        """Test that saved data contains all required fields."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True,
            notes="Test"
        )

        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        service = InvestService(mock_session)
        service.req_repo = mock_repo

        result = await service.save_invest_analysis(1, invest_data, user_id=10)

        # Verify all fields are present
        assert "requirement_id" in result
        assert "independent" in result
        assert "negotiable" in result
        assert "valuable" in result
        assert "estimable" in result
        assert "small" in result
        assert "testable" in result
        assert "passed_count" in result
        assert "notes" in result
        assert "analyzed_at" in result

    @pytest.mark.asyncio
    async def test_analyzed_at_is_string(self):
        """Test that analyzed_at is returned as ISO format string."""
        invest_data = INVESTAnalysisCreate(
            independent=True,
            negotiable=True,
            valuable=True,
            estimable=True,
            small=True,
            testable=True
        )

        mock_requirement = Mock()
        mock_requirement.id = 1
        mock_requirement.updated_at = datetime.now()

        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.update = AsyncMock(return_value=mock_requirement)

        service = InvestService(mock_session)
        service.req_repo = mock_repo

        result = await service.save_invest_analysis(1, invest_data, user_id=10)

        assert isinstance(result["analyzed_at"], str)
        assert "T" in result["analyzed_at"]  # ISO format contains 'T'
