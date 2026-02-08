# Requirement Review Meeting - Integration Test Plan

## Overview
This document outlines the comprehensive test suite for the Requirement Review Meeting voting system, covering the complete user workflow from meeting creation to vote archiving.

## Test Structure
```
backend/tests/
├── conftest_review_meeting.py  # Enhanced fixtures for meeting tests
├── integration/test_api/
│   └── test_requirement_review_meetings_api.py  # API integration tests
├── unit/test_services/
│   └── test_requirement_review_meeting_service.py  # Service unit tests
└── unit/test_repositories/
    └── test_requirement_review_meeting_repository.py  # Repository unit tests
```

---

## Part 1: Integration Tests (API Layer)

### Test File: `test_requirement_review_meetings_api.py`

#### Category 1: Meeting Lifecycle Tests

##### 1.1 Create Meeting
- **Test**: `test_create_meeting_success`
  - Given: Valid meeting data with moderator
  - When: POST /requirement-review-meetings/
  - Then: Returns 201 with meeting data, status="scheduled"

- **Test**: `test_create_meeting_invalid_moderator`
  - Given: Meeting data with non-existent moderator_id
  - When: POST /requirement-review-meetings/
  - Then: Returns 400/404 error

- **Test**: `test_create_meeting_past_date`
  - Given: Meeting with scheduled_at in the past
  - When: POST /requirement-review-meetings/
  - Then: Returns 400 validation error

##### 1.2 Start Meeting
- **Test**: `test_start_meeting_success_by_moderator`
  - Given: Scheduled meeting and current user is moderator
  - When: POST /{meeting_id}/start
  - Then: Meeting status changes to "in_progress", started_at is set

- **Test**: `test_start_meeting_forbidden_non_moderator`
  - Given: Scheduled meeting and current user is NOT moderator
  - When: POST /{meeting_id}/start
  - Then: Returns 403 Forbidden

- **Test**: `test_start_meeting_already_in_progress`
  - Given: Meeting already in_progress
  - When: POST /{meeting_id}/start
  - Then: Returns 400 error

- **Test**: `test_start_meeting_already_completed`
  - Given: Meeting in completed status
  - When: POST /{meeting_id}/start
  - Then: Returns 400 error

##### 1.3 End Meeting
- **Test**: `test_end_meeting_success_by_moderator`
  - Given: Meeting in_progress and current user is moderator
  - When: POST /{meeting_id}/end
  - Then: Status changes to "completed", ended_at is set

- **Test**: `test_end_meeting_forbidden_non_moderator`
  - Given: Meeting in_progress, current user is attendee (not moderator)
  - When: POST /{meeting_id}/end
  - Then: Returns 403 Forbidden

- **Test**: `test_end_meeting_creates_vote_results`
  - Given: Meeting with completed votes
  - When: POST /{meeting_id}/end
  - Then: Vote results are archived to vote_results table

##### 1.4 List Meetings
- **Test**: `test_list_meetings_default`
  - Given: Multiple meetings exist
  - When: GET /requirement-review-meetings/
  - Then: Returns paginated list (page=1, page_size=20)

- **Test**: `test_list_meetings_filter_by_status`
  - Given: Meetings with different statuses
  - When: GET /?status=in_progress
  - Then: Returns only in_progress meetings

- **Test**: `test_list_meetings_filter_by_date`
  - Given: Meetings scheduled on different dates
  - When: GET /?date_filter=2026-02-04
  - Then: Returns only meetings on that date

- **Test**: `test_list_meetings_pagination`
  - Given: 25 meetings exist
  - When: GET /?page=2&page_size=10
  - Then: Returns items 11-20, total=25, total_pages=3

##### 1.5 Get Meeting Details
- **Test**: `test_get_meeting_success`
  - Given: Meeting exists
  - When: GET /{meeting_id}
  - Then: Returns meeting details with all fields

- **Test**: `test_get_meeting_not_found`
  - Given: Meeting does not exist
  - When: GET /{meeting_id}
  - Then: Returns 404 error

---

#### Category 2: Attendee Management Tests

##### 2.1 Add Attendee
- **Test**: `test_add_attendee_to_in_progress_meeting`
  - Given: Meeting in_progress, valid attendee_id
  - When: POST /{meeting_id}/attendees
  - Then: Attendee added with status="invited"

- **Test**: `test_add_attendee_to_scheduled_meeting_fails`
  - Given: Meeting in scheduled status
  - When: POST /{meeting_id}/attendees
  - Then: Returns 400 error ("只有会议开始后才能添加参会人员")

- **Test**: `test_add_duplicate_attendee_fails`
  - Given: User already added as attendee
  - When: POST /{meeting_id}/attendees (same user)
  - Then: Returns 400 error ("该用户已经是参会人员")

- **Test**: `test_add_attendee_nonexistent_user`
  - Given: attendee_id doesn't exist in users table
  - When: POST /{meeting_id}/attendees
  - Then: Returns 404/500 error

##### 2.2 Get Attendees
- **Test**: `test_get_attendees_success`
  - Given: Meeting with 3 attendees
  - When: GET /{meeting_id}/attendees
  - Then: Returns list with user information populated

- **Test**: `test_get_attendees_empty_meeting`
  - Given: Meeting with no attendees
  - When: GET /{meeting_id}/attendees
  - Then: Returns empty list

##### 2.3 Remove Attendee
- **Test**: `test_remove_attendee_success`
  - Given: Meeting with attendee
  - When: DELETE /{meeting_id}/attendees/{attendee_id}
  - Then: Attendee removed, cascade deletes their votes

- **Test**: `test_remove_attendee_deletes_their_votes`
  - Given: Attendee has cast votes
  - When: DELETE /{meeting_id}/attendees/{attendee_id}
  - Then: All votes by this attendee are deleted

---

#### Category 3: Requirement Management Tests

##### 3.1 Add Requirement to Meeting
- **Test**: `test_add_requirement_to_in_progress_meeting`
  - Given: Meeting in_progress, valid requirement_id
  - When: POST /{meeting_id}/requirements
  - Then: Requirement added with auto-incremented review_order

- **Test**: `test_add_requirement_to_scheduled_meeting_fails`
  - Given: Meeting in scheduled status
  - When: POST /{meeting_id}/requirements
  - Then: Returns 400 error ("只有会议开始后才能添加评审需求")

- **Test**: `test_add_duplicate_requirement_fails`
  - Given: Requirement already added to meeting
  - When: POST /{meeting_id}/requirements (same requirement)
  - Then: Returns 400 error ("该需求已添加到会议")

- **Test**: `test_review_order_auto_increment`
  - Given: Meeting with 2 requirements (orders 1, 2)
  - When: POST /{meeting_id}/requirements
  - Then: New requirement has review_order=3

##### 3.2 Get Meeting Requirements
- **Test**: `test_get_meeting_requirements_success`
  - Given: Meeting with 3 requirements
  - When: GET /{meeting_id}/requirements
  - Then: Returns requirements ordered by review_order

- **Test**: `test_get_requirements_filters_deleted_requirements`
  - Given: Meeting with requirements, one has been deleted from requirements table
  - When: GET /{meeting_id}/requirements
  - Then: Returns only valid requirements (excludes null requirement records)

##### 3.3 Update Meeting Requirement
- **Test**: `test_update_requirement_review_order`
  - Given: Meeting requirement
  - When: PUT /{meeting_id}/requirements/{requirement_id} with review_order=5
  - Then: Review order updated successfully

##### 3.4 Remove Requirement from Meeting
- **Test**: `test_remove_requirement_success`
  - Given: Meeting with requirement
  - When: DELETE /{meeting_id}/requirements/{requirement_id}
  - Then: Requirement removed, cascade deletes votes for this requirement

- **Test**: `test_remove_requirement_deletes_votes`
  - Given: Requirement has votes cast
  - When: DELETE /{meeting_id}/requirements/{requirement_id}
  - Then: All votes for this requirement are deleted

---

#### Category 4: Voting Tests (Core Functionality)

##### 4.1 Cast Vote
- **Test**: `test_cast_vote_approve_success`
  - Given: Meeting in_progress, user is assigned voter, hasn't voted
  - When: POST /{meeting_id}/requirements/{requirement_id}/vote with vote_option="approve"
  - Then: Vote recorded successfully

- **Test**: `test_cast_vote_reject_success`
  - Given: Same as above
  - When: POST with vote_option="reject"
  - Then: Vote recorded with reject option

- **Test**: `test_cast_vote_abstain_success`
  - Given: Same as above
  - When: POST with vote_option="abstain"
  - Then: Vote recorded with abstain option

- **Test**: `test_cast_vote_with_comment`
  - Given: User is assigned voter
  - When: POST with vote_option="reject" and comment="Needs more clarity"
  - Then: Vote recorded with comment

##### 4.2 Voting Restrictions

- **Test**: `test_cast_vote_duplicate_fails`
  - Given: User has already voted on this requirement
  - When: POST /{meeting_id}/requirements/{requirement_id}/vote again
  - Then: Returns 400 error ("您已经投过票了，不能修改投票选项")

- **Test**: `test_cast_vote_non_attendee_fails`
  - Given: User is NOT in attendees list
  - When: POST vote endpoint
  - Then: Returns 403 error ("您没有投票权限")

- **Test**: `test_cast_vote_not_assigned_voter_fails`
  - Given: User is attendee but NOT in assigned_voter_ids for this requirement
  - When: POST vote endpoint
  - Then: Returns 403 error ("您没有投票权限")

- **Test**: `test_cast_vote_meeting_not_in_progress_fails`
  - Given: Meeting in scheduled status
  - When: POST vote endpoint
  - Then: Returns 403 error

- **Test**: `test_cast_vote_unauthenticated_fails`
  - Given: No authentication token
  - When: POST vote endpoint
  - Then: Returns 401 error

##### 4.3 Vote Statistics

- **Test**: `test_get_vote_statistics_mixed_votes`
  - Given: 3 votes: 1 approve, 1 reject, 1 abstain
  - When: GET /{meeting_id}/requirements/{requirement_id}/votes
  - Then:
    ```json
    {
      "total_votes": 3,
      "approve_count": 1,
      "approve_percentage": 33.33,
      "reject_count": 1,
      "reject_percentage": 33.33,
      "abstain_count": 1,
      "abstain_percentage": 33.33
    }
    ```

- **Test**: `test_get_vote_statistics_unanimous_approve`
  - Given: All 5 votes are approve
  - When: GET statistics endpoint
  - Then: approve_percentage=100.0, others=0

- **Test**: `test_get_vote_statistics_no_votes_yet`
  - Given: No votes cast
  - When: GET statistics endpoint
  - Then: All counts are 0, percentages are 0.0

- **Test**: `test_get_vote_statistics_includes_voter_names`
  - Given: Votes cast by users
  - When: GET statistics endpoint
  - Then: votes array includes voter_name for each vote

##### 4.4 Get My Vote

- **Test**: `test_get_my_vote_success`
  - Given: User has voted
  - When: GET /{meeting_id}/requirements/{requirement_id}/my-vote
  - Then: Returns user's vote with option and comment

- **Test**: `test_get_my_vote_not_found`
  - Given: User hasn't voted yet
  - When: GET /my-vote endpoint
  - Then: Returns 404 error ("您尚未投票")

---

#### Category 5: Assigned Voters Tests

##### 5.1 Update Assigned Voters
- **Test**: `test_update_assigned_voters_success`
  - Given: Meeting requirement exists
  - When: PATCH /{meeting_id}/requirements/{requirement_id}/voters with assigned_voter_ids=[1,2,3]
  - Then: Voters list updated

- **Test**: `test_update_assigned_voters_replaces_existing`
  - Given: Requirement has assigned_voter_ids=[1,2]
  - When: PATCH with assigned_voter_ids=[3,4]
  - Then: New list replaces old (not appended)

##### 5.2 Get Voter Status
- **Test**: `test_get_voter_status_partial_votes`
  - Given: 5 assigned voters, 2 have voted, 3 haven't
  - When: GET /{meeting_id}/requirements/{requirement_id}/voters
  - Then:
    ```json
    {
      "requirement_id": 123,
      "assigned_voter_ids": [1,2,3,4,5],
      "voters": [
        {"attendee_id": 1, "has_voted": true, "vote_option": "approve"},
        {"attendee_id": 2, "has_voted": true, "vote_option": "reject"},
        {"attendee_id": 3, "has_voted": false},
        ...
      ],
      "total_assigned": 5,
      "total_voted": 2,
      "is_complete": false
    }
    ```

- **Test**: `test_get_voter_status_all_voted`
  - Given: All assigned voters have voted
  - When: GET voter status endpoint
  - Then: is_complete=true, total_voted=total_assigned

---

#### Category 6: Vote Result Archive Tests

##### 6.1 List Vote Results
- **Test**: `test_list_vote_results_success`
  - Given: Multiple archived vote results exist
  - When: GET /archive/vote-results
  - Then: Returns paginated list of archived results

- **Test**: `test_list_vote_results_filter_by_meeting`
  - Given: Vote results from multiple meetings
  - When: GET /archive/vote-results?meeting_id=123
  - Then: Returns only results for meeting 123

##### 6.2 Get Specific Vote Result
- **Test**: `test_get_vote_result_success`
  - Given: Archived vote result exists
  - When: GET /archive/vote-results/{result_id}
  - Then: Returns complete vote statistics snapshot

- **Test**: `test_get_vote_result_not_found`
  - Given: Result doesn't exist
  - When: GET /archive/vote-results/{result_id}
  - Then: Returns 404 error

##### 6.3 Meeting Vote Results
- **Test**: `test_list_meeting_vote_results_success`
  - Given: Completed meeting with 5 requirements
  - When: GET /{meeting_id}/archive/vote-results
  - Then: Returns all 5 archived vote results

---

#### Category 7: Edge Cases and Error Handling

##### 7.1 Concurrency Tests
- **Test**: `test_concurrent_voting_same_requirement`
  - Given: 2 users try to vote simultaneously on same requirement
  - When: Both POST vote at same time
  - Then: Both votes recorded (no race condition)

- **Test**: `test_concurrent_vote_statistics`
  - Given: Votes being cast while fetching statistics
  - When: GET statistics during voting
  - Then: Returns consistent snapshot

##### 7.2 Data Integrity Tests
- **Test**: `test_delete_meeting_cascades_to_attendees`
  - Given: Meeting with attendees
  - When: DELETE /{meeting_id}
  - Then: All attendees cascade deleted

- **Test**: `test_delete_meeting_cascades_to_votes`
  - Given: Meeting with votes cast
  - When: DELETE /{meeting_id}
  - Then: All votes cascade deleted

- **Test**: `test_delete_requirement_cascades_to_meeting_requirements`
  - Given: Requirement added to meetings
  - When: Delete requirement from requirements table
  - Then: Meeting requirement records remain but requirement=null

##### 7.3 Tenant Isolation Tests
- **Test**: `test_meetings_isolated_by_tenant`
  - Given: Meetings in tenant 1 and tenant 2
  - When: User from tenant 1 lists meetings
  - Then: Only sees tenant 1 meetings

- **Test**: `test_cross_tenant_vote_forbidden`
  - Given: User from tenant 1, meeting from tenant 2
  - When: User tries to vote
  - Then: Returns 403/404 error

##### 7.4 Permission Tests
- **Test**: `test_unauthenticated_access_blocked`
  - Given: No auth token
  - When: Any POST/PUT/DELETE request
  - Then: Returns 401 error

- **Test**: `test_inactive_user_blocked`
  - Given: User with is_active=false
  - When: User tries to vote
  - Then: Returns 403 error

---

## Part 2: Unit Tests (Service Layer)

### Test File: `test_requirement_review_meeting_service.py`

#### Service Method Tests

##### 2.1 Meeting Creation
- **Test**: `test_create_meeting_generates_unique_meeting_no`
  - Verify meeting_no format: "REV-YYYYMMDD-XXXX"
  - Verify uniqueness constraint

- **Test**: `test_create_meeting_with_settings`
  - Verify meeting_settings stored correctly

##### 2.2 Meeting Lifecycle
- **Test**: `test_start_meeting_updates_timestamps`
  - Verify started_at set, status changed

- **Test**: `test_start_meeting_validates_status`
  - Verify can't start completed meeting

- **Test**: `test_end_meeting_archives_results`
  - Verify vote results created for all requirements

##### 2.3 Voting Logic
- **Test**: `test_can_vote_assigned_voter`
  - Verify returns True for assigned voter

- **Test**: `test_can_vote_attendee_not_assigned`
  - Verify returns False for non-assigned attendee

- **Test**: `test_can_vote_non_attendee`
  - Verify returns False for non-attendee

- **Test**: `test_can_vote_meeting_not_in_progress`
  - Verify returns False for scheduled/completed meetings

##### 2.4 Vote Statistics
- **Test**: `test_get_vote_statistics_calculates_percentages`
  - Verify percentage calculation accuracy

- **Test**: `test_get_vote_statistics_includes_completion_status`
  - Verify is_voting_complete flag logic

---

## Part 3: Unit Tests (Repository Layer)

### Test File: `test_requirement_review_meeting_repository.py`

#### Repository Method Tests

##### 3.1 CRUD Operations
- **Test**: `test_get_meeting_by_id`
- **Test**: `test_get_meeting_by_meeting_no`
- **Test**: `test_get_multi_with_filters`

##### 3.2 Attendee Operations
- **Test**: `test_add_attendee`
- **Test**: `test_remove_attendee`
- **Test**: `test_get_attendees_with_user_info`

##### 3.3 Requirement Operations
- **Test**: `test_add_requirement_auto_order`
- **Test**: `test_update_requirement_order`
- **Test**: `test_get_requirements_ordered`

##### 3.4 Vote Operations
- **Test**: `test_cast_vote`
- **Test**: `test_get_user_vote`
- **Test**: `test_get_votes_by_requirement`

##### 3.5 Voter Assignment
- **Test**: `test_update_assigned_voters`
- **Test**: `test_get_voter_status`

##### 3.6 Vote Results
- **Test**: `test_create_vote_result`
- **Test**: `test_get_vote_results`
- **Test**: `test_get_vote_result_by_id`

---

## Test Execution Plan

### Phase 1: Core Functionality (Priority 1)
1. Meeting lifecycle (create, start, end)
2. Add attendees and requirements
3. Basic voting (approve/reject/abstain)
4. Vote statistics calculation

### Phase 2: Advanced Features (Priority 2)
1. Assigned voter management
2. Voter status tracking
3. Vote result archiving
4. Permission checks

### Phase 3: Edge Cases (Priority 3)
1. Concurrency handling
2. Data integrity (cascade deletes)
3. Tenant isolation
4. Error handling

### Phase 4: Performance (Priority 4)
1. Pagination performance
2. Statistics query optimization
3. Concurrent voting stress test

---

## Success Criteria

### Coverage Requirements
- **Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: 100% for public methods

### Quality Requirements
- All tests must be independent (no shared state)
- All tests must clean up database after execution
- All tests must use fixtures, not hardcoded data
- All edge cases must have corresponding tests

### Documentation Requirements
- Each test file must have docstring explaining purpose
- Complex test logic must have inline comments
- Test names must follow `test_<action>_<expected_result>` pattern

---

## Mock Requirements

### External Dependencies to Mock
- OpenAI Service (not used in meeting flow)
- Redis Cache (if implemented)
- Email Notification Service (if implemented)

### Database Mocking Strategy
- Use in-memory SQLite for unit tests
- Use transaction rollback for test isolation
- Use factories for complex object creation

---

## Test Data Management

### Factory Pattern Usage
```python
# Use factories for flexible test data
@pytest.fixture
def meeting_factory(db_session, tenant):
    def _create(**kwargs):
        default_data = {...}
        data = {**default_data, **kwargs}
        return RequirementReviewMeeting(**data)
    return _create
```

### Cleanup Strategy
- Each test uses `db_session` fixture with automatic rollback
- No manual cleanup required in tests
- Fixtures use function scope for isolation

---

## Running the Tests

### Run All Meeting Tests
```bash
pytest tests/integration/test_api/test_requirement_review_meetings_api.py -v
```

### Run Specific Test Category
```bash
pytest tests/ -k "test_cast_vote" -v
```

### Run with Coverage
```bash
pytest tests/ --cov=app/services/requirement_review_meeting --cov-report=html
```

### Run Specific Test File
```bash
pytest tests/unit/test_services/test_requirement_review_meeting_service.py -v
```

---

## Next Steps

1. **Create Test Files**: Generate empty test files with structure
2. **Implement Fixtures**: Ensure all fixtures work correctly
3. **Write Tests Phase 1**: Implement core functionality tests
4. **Run & Fix**: Execute tests and fix any failures
5. **Implement Phase 2-4**: Complete remaining test phases
6. **Verify Coverage**: Ensure coverage targets met
7. **Document Results**: Update this document with actual test results
