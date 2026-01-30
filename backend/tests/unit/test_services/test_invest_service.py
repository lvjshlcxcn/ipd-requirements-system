"""
Unit tests for INVEST Service - 评分系统

Tests INVEST analysis business logic including:
- Getting INVEST analysis for a requirement
- Saving INVEST analysis with total_score and average_score calculation
- Handling requirement not found scenarios
- Backward compatibility with boolean format
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
        """Test successfully getting INVEST analysis (评分系统)."""
        # Mock requirement
        mock_requirement = Mock()
        mock_requirement.invest_analysis = {
            "independent": 85,
            "negotiable": 60,
            "valuable": 90,
            "estimable": 75,
            "small": 70,
            "testable": 80,
            "total_score": 460,
            "average_score": 76.67,
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
        assert result["independent"] == 85
        assert result["total_score"] == 460
        assert result["average_score"] == 76.67
        assert result["notes"] == "Good requirement"

    @pytest.mark.asyncio
    async def test_get_invest_analysis_backward_compatibility(self):
        """Test getting INVEST analysis with old boolean format."""
        # Mock requirement with old boolean format
        mock_requirement = Mock()
        mock_requirement.invest_analysis = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": False,
            "testable": True,
            "passed_count": 5,
            "notes": "Old format"
        }

        # Mock repository
        mock_session = Mock()
        mock_repo = Mock()
        mock_repo.get_by_id = AsyncMock(return_value=mock_requirement)

        # Create service
        service = InvestService(mock_session)
        service.req_repo = mock_repo

        # Get analysis - should auto-convert
        result = await service.get_invest_analysis(1)

        assert result is not None
        assert result["independent"] == 85  # True -> 85
        assert result["small"] == 40  # False -> 40
        assert result["_migrated"] is True
        assert result["total_score"] > 0

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
    """Test saving INVEST analysis - 评分系统."""

    @pytest.mark.asyncio
    async def test_save_invest_analysis_perfect_scores(self):
        """Test saving INVEST analysis with perfect scores."""
        invest_data = INVESTAnalysisCreate(
            independent=100,
            negotiable=100,
            valuable=100,
            estimable=100,
            small=100,
            testable=100,
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
        assert result["total_score"] == 600
        assert result["average_score"] == 100.0
        assert result["independent"] == 100
        assert result["notes"] == "Perfect requirement"

        # Verify update was called
        mock_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_invest_analysis_zero_scores(self):
        """Test saving INVEST analysis with zero scores."""
        invest_data = INVESTAnalysisCreate(
            independent=0,
            negotiable=0,
            valuable=0,
            estimable=0,
            small=0,
            testable=0,
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
        assert result["total_score"] == 0
        assert result["average_score"] == 0.0
        assert result["independent"] == 0

    @pytest.mark.asyncio
    async def test_save_invest_analysis_mixed_scores(self):
        """Test saving INVEST analysis with mixed scores."""
        invest_data = INVESTAnalysisCreate(
            independent=85,
            negotiable=40,
            valuable=75,
            estimable=90,
            small=55,
            testable=70,
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
        assert result["total_score"] == 415  # 85+40+75+90+55+70
        assert result["average_score"] == pytest.approx(69.17, rel=0.01)

    @pytest.mark.asyncio
    async def test_save_invest_analysis_without_notes(self):
        """Test saving INVEST analysis without notes."""
        invest_data = INVESTAnalysisCreate(
            independent=75,
            negotiable=80,
            valuable=85,
            estimable=90,
            small=70,
            testable=80
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
        assert result["total_score"] == 480  # 75+80+85+90+70+80

    @pytest.mark.asyncio
    async def test_save_invest_analysis_requirement_not_found(self):
        """Test saving INVEST analysis for non-existent requirement."""
        invest_data = INVESTAnalysisCreate(
            independent=50,
            negotiable=50,
            valuable=50,
            estimable=50,
            small=50,
            testable=50
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
            independent=85,
            negotiable=60,
            valuable=90,
            estimable=75,
            small=70,
            testable=80
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
        mock_repo.update.assert_called_once()
        # Extract the kwargs from the call
        call_kwargs = mock_repo.update.call_args.kwargs
        assert "updated_by" in call_kwargs
        assert call_kwargs["updated_by"] == user_id


@pytest.mark.unit
class TestInvestServiceScoreCalculation:
    """Test score calculation logic."""

    @pytest.mark.asyncio
    async def test_total_score_zero(self):
        """Test total_score calculation when all scores are 0."""
        invest_data = INVESTAnalysisCreate(
            independent=0,
            negotiable=0,
            valuable=0,
            estimable=0,
            small=0,
            testable=0
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

        assert result["total_score"] == 0
        assert result["average_score"] == 0.0

    @pytest.mark.asyncio
    async def test_total_score_partial(self):
        """Test total_score calculation with mixed scores."""
        invest_data = INVESTAnalysisCreate(
            independent=85,
            negotiable=40,
            valuable=75,
            estimable=60,
            small=55,
            testable=70
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

        assert result["total_score"] == 385  # 85+40+75+60+55+70
        assert result["average_score"] == pytest.approx(64.17, rel=0.01)

    @pytest.mark.asyncio
    async def test_total_score_full(self):
        """Test total_score calculation when all scores are 100."""
        invest_data = INVESTAnalysisCreate(
            independent=100,
            negotiable=100,
            valuable=100,
            estimable=100,
            small=100,
            testable=100
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

        assert result["total_score"] == 600
        assert result["average_score"] == 100.0

    @pytest.mark.asyncio
    async def test_average_score_precision(self):
        """Test that average_score is calculated with 2 decimal places."""
        invest_data = INVESTAnalysisCreate(
            independent=85,
            negotiable=85,
            valuable=85,
            estimable=85,
            small=85,
            testable=85
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

        assert result["total_score"] == 510
        assert result["average_score"] == 85.0  # Exactly 85


@pytest.mark.unit
class TestInvestServiceDataStructure:
    """Test data structure and formatting."""

    @pytest.mark.asyncio
    async def test_saved_data_contains_all_fields(self):
        """Test that saved data contains all required fields."""
        invest_data = INVESTAnalysisCreate(
            independent=85,
            negotiable=60,
            valuable=90,
            estimable=75,
            small=70,
            testable=80,
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
        assert "total_score" in result
        assert "average_score" in result
        assert "notes" in result
        assert "analyzed_at" in result

    @pytest.mark.asyncio
    async def test_analyzed_at_is_string(self):
        """Test that analyzed_at is returned as ISO format string."""
        invest_data = INVESTAnalysisCreate(
            independent=75,
            negotiable=80,
            valuable=85,
            estimable=90,
            small=70,
            testable=80
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


@pytest.mark.unit
class TestInvestServiceDataConversion:
    """Test backward compatibility data conversion."""

    def test_convert_bool_to_score_all_true(self):
        """Test converting all True values to scores."""
        mock_session = Mock()
        service = InvestService(mock_session)

        old_data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "passed_count": 6
        }

        result = service._convert_bool_to_score(old_data)

        assert result["independent"] == 85
        assert result["negotiable"] == 85
        assert result["valuable"] == 85
        assert result["estimable"] == 85
        assert result["small"] == 85
        assert result["testable"] == 85
        assert result["total_score"] == 510  # 6 * 85
        assert result["_migrated"] is True

    def test_convert_bool_to_score_all_false(self):
        """Test converting all False values to scores."""
        mock_session = Mock()
        service = InvestService(mock_session)

        old_data = {
            "independent": False,
            "negotiable": False,
            "valuable": False,
            "estimable": False,
            "small": False,
            "testable": False,
            "passed_count": 0
        }

        result = service._convert_bool_to_score(old_data)

        assert result["independent"] == 40
        assert result["negotiable"] == 40
        assert result["valuable"] == 40
        assert result["estimable"] == 40
        assert result["small"] == 40
        assert result["testable"] == 40
        assert result["total_score"] == 240  # 6 * 40

    def test_convert_bool_to_score_mixed(self):
        """Test converting mixed boolean values to scores."""
        mock_session = Mock()
        service = InvestService(mock_session)

        old_data = {
            "independent": True,
            "negotiable": False,
            "valuable": True,
            "estimable": True,
            "small": False,
            "testable": True,
            "passed_count": 4
        }

        result = service._convert_bool_to_score(old_data)

        assert result["independent"] == 85
        assert result["negotiable"] == 40
        assert result["valuable"] == 85
        assert result["estimable"] == 85
        assert result["small"] == 40
        assert result["testable"] == 85
        assert result["total_score"] == 420  # 4*85 + 2*40

    def test_convert_bool_to_score_preserves_notes(self):
        """Test that conversion preserves notes field."""
        mock_session = Mock()
        service = InvestService(mock_session)

        old_data = {
            "independent": True,
            "negotiable": True,
            "valuable": True,
            "estimable": True,
            "small": True,
            "testable": True,
            "notes": "Test notes"
        }

        result = service._convert_bool_to_score(old_data)

        assert result["notes"] == "Test notes"
