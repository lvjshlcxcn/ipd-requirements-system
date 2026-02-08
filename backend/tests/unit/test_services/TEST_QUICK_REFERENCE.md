# Quick Reference: RequirementReviewMeetingService Tests

## Test File Location
```
/Users/kingsun/claude_study/backend/tests/unit/test_services/test_requirement_review_meeting_service.py
```

## Run Tests

### All Tests
```bash
cd /Users/kingsun/claude_study/backend
pytest tests/unit/test_services/test_requirement_review_meeting_service.py -v
```

### With Coverage
```bash
pytest tests/unit/test_services/test_requirement_review_meeting_service.py \
  --cov=app/services/requirement_review_meeting \
  --cov-report=html \
  --cov-report=term
```

### Single Test Class
```bash
# Test voting permissions
pytest tests/unit/test_services/test_requirement_review_meeting_service.py::TestCanVote -v

# Test meeting number generation
pytest tests/unit/test_services/test_requirement_review_meeting_service.py::TestGenerateMeetingNo -v

# Test meeting lifecycle
pytest tests/unit/test_services/test_requirement_review_meeting_service.py::TestStartMeeting -v
pytest tests/unit/test_services/test_requirement_review_meeting_service.py::TestEndMeeting -v
```

## Results Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Tests | 30 | - | ✅ |
| Passed | 30 | - | ✅ |
| Failed | 0 | - | ✅ |
| Coverage | 96% | 90%+ | ✅ |
| Execution Time | 2.14s | - | ✅ |

## Test Coverage by Method

| Service Method | Tests | Coverage |
|----------------|-------|----------|
| `can_vote()` | 7 | 100% |
| `generate_meeting_no()` | 4 | 100% |
| `create_meeting()` | 3 | 100% |
| `start_meeting()` | 4 | 100% |
| `end_meeting()` | 4 | 100% |
| `is_moderator()` | 3 | 100% |
| `get_vote_statistics()` | 1 | 100% |
| Edge Cases | 4 | 100% |

## Key Fixtures Used

```python
pytest_plugins = ["tests.conftest_review_meeting"]

# Available fixtures:
- db_session: Database session
- test_tenant_sync: Test tenant
- test_moderator: Moderator user
- test_voters: List of 3 voter users
- test_meeting: Test meeting in "scheduled" status
- test_meeting_attendees: Attendees for test_meeting
- test_requirements: List of 3 test requirements
- test_meeting_requirements: Requirements assigned to meeting
```

## Test Categories

### 1. Permission Tests (TestCanVote)
- ✅ Attendees can vote when meeting is in progress
- ✅ Non-attendees cannot vote (even admins)
- ✅ Cannot vote when meeting is scheduled
- ✅ Cannot vote when meeting is completed
- ✅ Cannot vote when meeting is cancelled
- ✅ Non-existent users cannot vote
- ✅ Cannot vote in non-existent meetings

### 2. Meeting Number Generation (TestGenerateMeetingNo)
- ✅ First meeting of day: RM-YYYYMMDD-001
- ✅ Second meeting of day: RM-YYYYMMDD-002
- ✅ Proper incrementing logic
- ✅ New day resets to -001

### 3. Meeting Creation (TestCreateMeeting)
- ✅ Auto-generates meeting number
- ✅ Supports custom meeting settings
- ✅ Tracks creator user
- ✅ Optional description field

### 4. Meeting Lifecycle (TestStartMeeting, TestEndMeeting)
- ✅ Start: scheduled → in_progress
- ✅ End: in_progress → completed
- ✅ Validates state transitions
- ✅ Archives vote results on end

### 5. Moderator Checks (TestIsModerator)
- ✅ Correctly identifies moderator
- ✅ Returns false for non-moderators
- ✅ Returns false for different users

### 6. Vote Statistics (TestGetVoteStatistics)
- ✅ Properly delegates to repository

### 7. Edge Cases (TestEdgeCases)
- ✅ Declined attendees cannot vote
- ✅ Tenant isolation enforced
- ✅ Optional fields work correctly
- ✅ Default values applied

## Coverage Report

```
app/services/requirement_review_meeting.py
Statements: 47 total, 45 covered
Coverage: 96%
Uncovered Lines: 111, 116 (race condition defensive checks)
```

## Documentation

Full test report: `SERVICE_LAYER_TEST_REPORT.md`

---

**Last Updated**: 2026-02-04
**Status**: ✅ All tests passing, 96% coverage
