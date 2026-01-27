"""Mock fixtures for external services."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from typing import Dict, Any


# ============ LLM Service Mocks ============

@pytest.fixture
def mock_llm_service(monkeypatch):
    """
    Mock LLM service for testing.

    Returns a successful analysis result with all required fields.
    """
    mock_result = {
        "q1_who": "产品经理",
        "q2_why": "需要高效管理产品需求，提高团队协作效率",
        "q3_what_problem": "当前使用Excel管理需求，存在版本混乱、协作困难、历史追溯不便等问题",
        "q4_current_solution": "使用Excel电子表格进行需求管理，通过文件共享的方式协作",
        "q5_current_issues": "1. 版本管理混乱，多人协作时容易覆盖 2. 缺乏状态跟踪 3. 历史变更难以追溯 4. 无法进行需求分析",
        "q6_ideal_solution": "一个专业的需求管理系统，支持多租户、工作流管理、需求分析、版本控制等功能",
        "q7_priority": "high",
        "q8_frequency": "daily",
        "q9_impact_scope": "产品团队、研发团队、测试团队，约50人",
        "q10_value": "预计提高需求管理效率50%，减少需求遗漏和误解，加快产品迭代速度"
    }

    async def mock_analyze(*args, **kwargs):
        """Mock successful LLM analysis."""
        return mock_result

    # Import and patch the llm_service
    from app.services import llm_service
    monkeypatch.setattr(llm_service.llm_service, "analyze_insight", mock_analyze)

    return mock_result


@pytest.fixture
def mock_llm_service_quick_mode(monkeypatch):
    """
    Mock LLM service in quick mode.

    Returns a simplified analysis result for quick testing.
    """
    mock_result = {
        "q1_who": "产品经理",
        "q2_why": "快速需求收集",
        "q3_what_problem": "需要快速记录和管理需求",
        "q4_current_solution": "口头沟通或即时通讯",
        "q5_current_issues": "容易遗漏，难以追踪",
        "q6_ideal_solution": "简单的需求管理工具",
        "q7_priority": "medium",
        "q8_frequency": "weekly",
        "q9_impact_scope": "小团队",
        "q10_value": "提高需求记录效率"
    }

    async def mock_analyze(*args, **kwargs):
        """Mock quick mode LLM analysis."""
        return mock_result

    from app.services import llm_service
    monkeypatch.setattr(llm_service.llm_service, "analyze_insight", mock_analyze)

    return mock_result


@pytest.fixture
def mock_llm_service_error(monkeypatch):
    """
    Mock LLM service with error scenarios.

    Use this to test error handling in your code.
    """
    async def mock_analyze(*args, **kwargs):
        """Mock LLM service that raises an error."""
        raise Exception("DeepSeek API error: Connection timeout")

    from app.services import llm_service
    monkeypatch.setattr(llm_service.llm_service, "analyze_insight", mock_analyze)


@pytest.fixture
def mock_llm_service_invalid_json(monkeypatch):
    """
    Mock LLM service that returns invalid JSON.

    Use this to test JSON parsing error handling.
    """
    async def mock_analyze(*args, **kwargs):
        """Mock LLM service returning invalid JSON."""
        return {"invalid": "response", "missing": "fields"}

    from app.services import llm_service
    monkeypatch.setattr(llm_service.llm_service, "analyze_insight", mock_analyze)


@pytest.fixture
def mock_llm_service_timeout(monkeypatch):
    """
    Mock LLM service with timeout error.

    Use this to test timeout handling.
    """
    async def mock_analyze(*args, **kwargs):
        """Mock LLM service that times out."""
        import asyncio
        await asyncio.sleep(5)  # Simulate timeout
        return {}

    from app.services import llm_service
    monkeypatch.setattr(llm_service.llm_service, "analyze_insight", mock_analyze)


# ============ Redis Mocks ============

@pytest.fixture
def mock_redis_client(monkeypatch):
    """
    Mock Redis client for testing.

    Simulates successful Redis operations.
    """
    # Create a mock Redis client
    mock_redis = MagicMock()

    # Mock common Redis operations
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.delete.return_value = 1
    mock_redis.exists.return_value = False
    mock_redis.expire.return_value = True
    mock_redis.ttl.return_value = -1
    mock_redis.keys.return_value = []

    # Patch Redis if it's used in the codebase
    try:
        from app.core import redis_client
        monkeypatch.setattr(redis_client, "redis_client", mock_redis)
    except ImportError:
        # Redis not used in this project, skip
        pass

    return mock_redis


@pytest.fixture
def mock_redis_cache_hit(monkeypatch):
    """
    Mock Redis client with cache hit scenario.

    Simulates data already existing in cache.
    """
    mock_redis = MagicMock()

    cached_data = '{"cached": "data", "from": "redis"}'
    mock_redis.get.return_value = cached_data.encode() if isinstance(cached_data, str) else cached_data
    mock_redis.set.return_value = True
    mock_redis.exists.return_value = True

    try:
        from app.core import redis_client
        monkeypatch.setattr(redis_client, "redis_client", mock_redis)
    except ImportError:
        pass

    return mock_redis


# ============ External API Mocks ============

@pytest.fixture
def mock_external_api_client(monkeypatch):
    """
    Mock external API client for testing.

    Generic mock for any external HTTP service calls.
    """
    mock_client = AsyncMock()

    # Mock successful response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "success", "data": {}}
    mock_response.text = '{"status": "success"}'

    mock_client.get.return_value = mock_response
    mock_client.post.return_value = mock_response
    mock_client.put.return_value = mock_response
    mock_client.delete.return_value = mock_response

    return mock_client


@pytest.fixture
def mock_external_api_error(monkeypatch):
    """
    Mock external API client with error response.

    Use this to test error handling for external API calls.
    """
    mock_client = AsyncMock()

    # Mock error response
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"
    mock_response.raise_for_status.side_effect = Exception("API Error")

    mock_client.get.return_value = mock_response
    mock_client.post.return_value = mock_response

    return mock_client


# ============ File System Mocks ============

@pytest.fixture
def mock_file_upload(monkeypatch, tmp_path):
    """
    Mock file upload operations.

    Provides a temporary directory for file operations.
    """
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()

    return upload_dir


@pytest.fixture
def mock_export_file(monkeypatch, tmp_path):
    """
    Mock export file generation.

    Returns path to a temporary export file.
    """
    export_file = tmp_path / "export.csv"
    export_file.write_text("header1,header2\nvalue1,value2\n")

    return export_file
