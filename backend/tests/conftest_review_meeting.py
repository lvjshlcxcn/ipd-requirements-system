"""
Enhanced pytest fixtures for Requirement Review Meeting testing.

This module provides comprehensive fixtures for testing the complete
requirement review meeting workflow including:
- Meeting creation and lifecycle
- Attendee management
- Requirement assignment
- Voting mechanism
- Vote statistics and archiving
"""

import pytest
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.requirement import Requirement
from app.models.requirement_review_meeting import RequirementReviewMeeting
from app.models.requirement_review_meeting_attendee import RequirementReviewMeetingAttendee
from app.models.requirement_review_meeting_requirement import RequirementReviewMeetingRequirement
from app.models.requirement_review_vote import RequirementReviewVote
from app.models.vote_result import VoteResult
from app.core.security import create_access_token


# ============================================================================
# User Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_moderator(db_session: Session, test_tenant_sync) -> User:
    """Create moderator user."""
    moderator = User(
        username="moderator",
        email="moderator@example.com",
        hashed_password="hashed_password",
        full_name="Meeting Moderator",
        role="admin",
        department="Product",
        is_active=True,
        tenant_id=test_tenant_sync.id,
    )
    db_session.add(moderator)
    db_session.commit()
    db_session.refresh(moderator)
    return moderator


@pytest.fixture(scope="function")
def test_attendees_factory(db_session: Session, test_tenant_sync):
    """Factory to create multiple attendees."""
    def _create(count: int = 3, **kwargs) -> List[User]:
        attendees = []
        for i in range(count):
            user = User(
                username=f"attendee{i}",
                email=f"attendee{i}@example.com",
                hashed_password="hashed_password",
                full_name=f"Attendee {i}",
                role="product_manager",
                department="Product",
                is_active=True,
                tenant_id=test_tenant_sync.id,
                **kwargs
            )
            db_session.add(user)
            db_session.flush()
            attendees.append(user)
        db_session.commit()
        for attendee in attendees:
            db_session.refresh(attendee)
        return attendees
    return _create


@pytest.fixture(scope="function")
def test_voters(test_attendees_factory):
    """Create standard set of 3 voters."""
    return test_attendees_factory(count=3)


# ============================================================================
# Meeting Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_meeting_data():
    """Sample meeting data for testing."""
    scheduled_time = datetime.now() + timedelta(days=1)
    return {
        "title": "Weekly Requirement Review",
        "description": "Review Q1 feature requirements",
        "scheduled_at": scheduled_time.isoformat(),  # Convert to ISO string for JSON serialization
        "meeting_settings": {
            "auto_assign_voters": True,
            "require_comment_for_reject": True
        }
    }


@pytest.fixture(scope="function")
def test_meeting(db_session: Session, test_meeting_data, test_moderator: User, test_tenant_sync) -> RequirementReviewMeeting:
    """Create test meeting in scheduled status."""
    scheduled_time = datetime.now() + timedelta(days=1)
    meeting = RequirementReviewMeeting(
        meeting_no="REV-001",
        title=test_meeting_data["title"],
        description=test_meeting_data["description"],
        scheduled_at=scheduled_time,  # Use datetime object directly
        moderator_id=test_moderator.id,
        status="scheduled",
        meeting_settings=test_meeting_data["meeting_settings"],
        created_by=test_moderator.id,
        tenant_id=test_tenant_sync.id,
    )
    db_session.add(meeting)
    db_session.commit()
    db_session.refresh(meeting)
    return meeting


@pytest.fixture(scope="function")
def test_meeting_in_progress(test_meeting: RequirementReviewMeeting, db_session: Session):
    """Start a meeting and return it in in_progress status."""
    test_meeting.status = "in_progress"
    test_meeting.started_at = datetime.now()
    db_session.commit()
    db_session.refresh(test_meeting)
    return test_meeting


@pytest.fixture(scope="function")
def test_meeting_completed(test_meeting: RequirementReviewMeeting, db_session: Session):
    """End a meeting and return it in completed status."""
    test_meeting.status = "completed"
    test_meeting.started_at = datetime.now() - timedelta(hours=1)
    test_meeting.ended_at = datetime.now()
    db_session.commit()
    db_session.refresh(test_meeting)
    return test_meeting


# ============================================================================
# Requirement Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_requirements_factory(db_session: Session, test_tenant_sync, test_user_sync):
    """Factory to create multiple requirements."""
    def _create(count: int = 3, **kwargs) -> List[Requirement]:
        requirements = []
        for i in range(count):
            req = Requirement(
                requirement_no=f"REQ-{100+i}",
                title=f"Test Requirement {i}",
                description=f"Test requirement {i} description",
                source_channel="customer",
                status="collected",
                tenant_id=test_tenant_sync.id,
                created_by=test_user_sync.id,
                **kwargs
            )
            db_session.add(req)
            db_session.flush()
            requirements.append(req)
        db_session.commit()
        for req in requirements:
            db_session.refresh(req)
        return requirements
    return _create


@pytest.fixture(scope="function")
def test_requirements(test_requirements_factory):
    """Create standard set of 3 requirements."""
    return test_requirements_factory(count=3)


# ============================================================================
# Meeting Attendee Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_meeting_attendees(db_session: Session, test_meeting: RequirementReviewMeeting, test_voters: List[User]):
    """Add attendees to meeting."""
    attendees = []
    for voter in test_voters:
        attendee = RequirementReviewMeetingAttendee(
            meeting_id=test_meeting.id,
            attendee_id=voter.id,
            attendance_status="attended",
            tenant_id=test_meeting.tenant_id,
        )
        db_session.add(attendee)
        db_session.flush()
        attendees.append(attendee)
    db_session.commit()
    for attendee in attendees:
        db_session.refresh(attendee)
    return attendees


# ============================================================================
# Meeting Requirement Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_meeting_requirements(db_session: Session, test_meeting: RequirementReviewMeeting, test_requirements: List[Requirement]):
    """Add requirements to meeting."""
    meeting_requirements = []
    for idx, req in enumerate(test_requirements):
        meeting_req = RequirementReviewMeetingRequirement(
            meeting_id=test_meeting.id,
            requirement_id=req.id,
            review_order=idx + 1,
            tenant_id=test_meeting.tenant_id,
        )
        db_session.add(meeting_req)
        db_session.flush()
        meeting_requirements.append(meeting_req)
    db_session.commit()
    for meeting_req in meeting_requirements:
        db_session.refresh(meeting_req)
    return meeting_requirements


@pytest.fixture(scope="function")
def test_meeting_requirement_with_voters(db_session: Session, test_meeting_requirements: List[RequirementReviewMeetingRequirement], test_voters: List[User]):
    """Assign voters to first meeting requirement."""
    meeting_req = test_meeting_requirements[0]
    meeting_req.assigned_voter_ids = [v.id for v in test_voters]
    db_session.commit()
    db_session.refresh(meeting_req)
    return meeting_req


# ============================================================================
# Vote Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_votes_factory(db_session: Session):
    """Factory to create votes."""
    def _create(
        meeting_id: int,
        requirement_id: int,
        voters: List[User],
        tenant_id: int,
        vote_pattern: str = "mixed"
    ) -> List[RequirementReviewVote]:
        """
        Create votes for given voters.

        Args:
            meeting_id: Meeting ID
            requirement_id: Requirement ID
            voters: List of voters
            tenant_id: Tenant ID
            vote_pattern: "approve_all", "reject_all", "abstain_all", "mixed"
        """
        votes = []

        vote_options = {
            "approve_all": "approve",
            "reject_all": "reject",
            "abstain_all": "abstain",
            "mixed": ["approve", "reject", "abstain"]
        }

        for idx, voter in enumerate(voters):
            if vote_pattern == "mixed":
                vote_option = vote_options["mixed"][idx % 3]
            else:
                vote_option = vote_options[vote_pattern]

            vote = RequirementReviewVote(
                meeting_id=meeting_id,
                requirement_id=requirement_id,
                voter_id=voter.id,
                vote_option=vote_option,
                comment=f"Vote {idx + 1}",
                tenant_id=tenant_id,
            )
            db_session.add(vote)
            db_session.flush()
            votes.append(vote)

        db_session.commit()
        for vote in votes:
            db_session.refresh(vote)

        return votes
    return _create


@pytest.fixture(scope="function")
def test_votes(test_votes_factory, test_meeting: RequirementReviewMeeting, test_meeting_requirements: List[RequirementReviewMeetingRequirement], test_voters: List[User]):
    """Create standard mixed votes for first requirement."""
    if not test_meeting_requirements:
        return []
    meeting_req = test_meeting_requirements[0]
    return test_votes_factory(
        meeting_id=test_meeting.id,
        requirement_id=meeting_req.requirement_id,
        voters=test_voters,
        tenant_id=test_meeting.tenant_id,
        vote_pattern="mixed"
    )


# ============================================================================
# Vote Result Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_vote_result(db_session: Session, test_meeting: RequirementReviewMeeting, test_meeting_requirements: List[RequirementReviewMeetingRequirement]):
    """Create archived vote result."""
    if not test_meeting_requirements:
        return None

    meeting_req = test_meeting_requirements[0]
    vote_stats = {
        "total_votes": 3,
        "approve_count": 1,
        "approve_percentage": 33.33,
        "reject_count": 1,
        "reject_percentage": 33.33,
        "abstain_count": 1,
        "abstain_percentage": 33.33,
        "votes": [
            {
                "voter_id": 1,
                "voter_name": "Attendee 0",
                "vote_option": "approve",
                "comment": "Vote 1"
            },
            {
                "voter_id": 2,
                "voter_name": "Attendee 1",
                "vote_option": "reject",
                "comment": "Vote 2"
            },
            {
                "voter_id": 3,
                "voter_name": "Attendee 2",
                "vote_option": "abstain",
                "comment": "Vote 3"
            }
        ]
    }

    result = VoteResult(
        meeting_id=test_meeting.id,
        requirement_id=meeting_req.requirement_id,
        requirement_title=f"Requirement {meeting_req.requirement_id}",
        vote_statistics=vote_stats,
        tenant_id=test_meeting.tenant_id,
    )
    db_session.add(result)
    db_session.commit()
    db_session.refresh(result)
    return result


# ============================================================================
# Auth Headers Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def moderator_auth_headers(test_moderator: User):
    """Get authentication headers for moderator."""
    token_data = {"sub": str(test_moderator.id), "username": test_moderator.username}
    access_token = create_access_token(token_data)
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def voter_auth_headers_factory(test_voters: List[User]):
    """Factory to get auth headers for any voter."""
    def _get_headers(voter_index: int = 0) -> dict:
        voter = test_voters[voter_index]
        token_data = {"sub": str(voter.id), "username": voter.username}
        access_token = create_access_token(token_data)
        return {"Authorization": f"Bearer {access_token}"}
    return _get_headers


# ============================================================================
# Complete Workflow Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_complete_meeting_setup(
    db_session: Session,
    test_meeting: RequirementReviewMeeting,
    test_meeting_attendees: List[RequirementReviewMeetingAttendee],
    test_meeting_requirements: List[RequirementReviewMeetingRequirement]
):
    """
    Complete meeting setup with attendees and requirements ready for voting.

    This fixture provides:
    - Meeting in scheduled status
    - 3 attendees added
    - 3 requirements added
    - Ready to start meeting and vote
    """
    # Start the meeting
    test_meeting.status = "in_progress"
    test_meeting.started_at = datetime.now()
    db_session.commit()
    db_session.refresh(test_meeting)

    # Assign all attendees as voters for first requirement
    if test_meeting_requirements:
        first_req = test_meeting_requirements[0]
        first_req.assigned_voter_ids = [att.attendee_id for att in test_meeting_attendees]
        db_session.commit()
        db_session.refresh(first_req)

    return {
        "meeting": test_meeting,
        "attendees": test_meeting_attendees,
        "requirements": test_meeting_requirements,
        "voters": [att.attendee for att in test_meeting_attendees]
    }


@pytest.fixture(scope="function")
def test_voted_meeting(
    db_session: Session,
    test_complete_meeting_setup: Dict[str, Any],
    test_votes_factory
):
    """
    Complete meeting setup with all votes cast.

    This fixture provides:
    - Meeting in in_progress status
    - 3 attendees
    - 3 requirements
    - All votes cast for first requirement
    """
    setup = test_complete_meeting_setup
    meeting = setup["meeting"]
    first_req = setup["requirements"][0]
    voters = setup["voters"]

    # Cast votes
    votes = test_votes_factory(
        meeting_id=meeting.id,
        requirement_id=first_req.requirement_id,
        voters=voters,
        tenant_id=meeting.tenant_id,
        vote_pattern="mixed"
    )

    return {
        **setup,
        "votes": votes
    }


# ============================================================================
# Helper Functions
# ============================================================================

@pytest.fixture(scope="function")
def meeting_helpers():
    """Helper functions for meeting tests."""
    class Helpers:
        @staticmethod
        def create_vote_payload(vote_option: str, comment: str = None) -> Dict[str, Any]:
            """Create vote request payload."""
            payload = {"vote_option": vote_option}
            if comment:
                payload["comment"] = comment
            return payload

        @staticmethod
        def assert_vote_stats(stats: Dict[str, Any], expected: Dict[str, int]):
            """Assert vote statistics match expected values."""
            assert stats["total_votes"] == sum(expected.values())
            assert stats["approve_count"] == expected.get("approve", 0)
            assert stats["reject_count"] == expected.get("reject", 0)
            assert stats["abstain_count"] == expected.get("abstain", 0)

        @staticmethod
        def calculate_percentage(count: int, total: int) -> float:
            """Calculate percentage rounded to 2 decimals."""
            if total == 0:
                return 0.0
            return round((count / total) * 100, 2)

    return Helpers
