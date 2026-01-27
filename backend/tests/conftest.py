"""Pytest configuration and fixtures."""

import os
import sys
import random
from typing import Generator
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.base import Base
from app.models.user import User
from app.models.tenant import Tenant
from app.models.requirement import Requirement
from app.models.insight import InsightAnalysis
from app.models.prompt_template import PromptTemplate
from app.core.security import get_password_hash, create_access_token
from app.config import get_settings

settings = get_settings()

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """Create test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Replace JSONB with JSON for SQLite compatibility
    from sqlalchemy import JSON
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if str(column.type) == 'JSONB':
                column.type = JSON()
    
    # Create all tables
    Base.metadata.create_all(engine)

    yield engine

    # Drop all tables after test
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create test database session."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
async def async_db_session() -> Generator[AsyncSession, None, None]:
    """Create async test database session."""
    # Create async engine
    async_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    # Replace JSONB with JSON for SQLite compatibility
    from sqlalchemy import JSON
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if str(column.type) == 'JSONB':
                column.type = JSON()

    # Create all tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session_maker = async_sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=async_engine,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session

    # Clean up
    await async_engine.dispose()


@pytest.fixture(scope="function")
def client(db_session: Session, test_tenant_sync: Tenant):
    """Create test HTTP client wrapper for integration tests (uses sync DB)."""

    # Dependency override for database session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    from app.db.session import get_db
    app.dependency_overrides[get_db] = override_get_db

    # Create async client
    transport = ASGITransport(app=app)
    test_client = AsyncClient(transport=transport, base_url="http://test")

    # Wrapper class to run async methods synchronously
    class SyncClientWrapper:
        def __init__(self, async_client, tenant_id):
            self._async_client = async_client
            self.tenant_id = tenant_id
            # Use current event loop instead of creating new one
            try:
                self.loop = asyncio.get_event_loop()
            except RuntimeError:
                self.loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self.loop)

        def _add_tenant_header(self, kwargs):
            """Add X-Tenant-ID header to request."""
            headers = kwargs.get('headers', {}).copy() if kwargs.get('headers') else {}
            headers['X-Tenant-ID'] = str(self.tenant_id)
            kwargs['headers'] = headers
            return kwargs

        def post(self, *args, **kwargs):
            kwargs = self._add_tenant_header(kwargs)
            return self.loop.run_until_complete(
                self._async_client.post(*args, **kwargs)
            )

        def get(self, *args, **kwargs):
            kwargs = self._add_tenant_header(kwargs)
            return self.loop.run_until_complete(
                self._async_client.get(*args, **kwargs)
            )

        def put(self, *args, **kwargs):
            kwargs = self._add_tenant_header(kwargs)
            return self.loop.run_until_complete(
                self._async_client.put(*args, **kwargs)
            )

        def delete(self, *args, **kwargs):
            kwargs = self._add_tenant_header(kwargs)
            return self.loop.run_until_complete(
                self._async_client.delete(*args, **kwargs)
            )

        def patch(self, *args, **kwargs):
            kwargs = self._add_tenant_header(kwargs)
            return self.loop.run_until_complete(
                self._async_client.patch(*args, **kwargs)
            )

        def close(self):
            self.loop.run_until_complete(self._async_client.aclose())

    wrapper = SyncClientWrapper(test_client, test_tenant_sync.id)

    yield wrapper

    app.dependency_overrides.clear()

    # Clean up
    wrapper.close()


# Async version for tests that need async DB
@pytest.fixture(scope="function")
async def async_client(async_db_session: AsyncSession, test_tenant: Tenant):
    """Create async test HTTP client wrapper."""

    # Dependency override for database session
    async def override_get_db():
        yield async_db_session

    from app.db.session import get_db
    app.dependency_overrides[get_db] = override_get_db

    # Create async client
    transport = ASGITransport(app=app)
    test_client = AsyncClient(transport=transport, base_url="http://test")

    # Wrapper class to handle async operations
    class AsyncClientWrapper:
        def __init__(self, async_client, tenant_id):
            self._async_client = async_client
            self.tenant_id = tenant_id

        def _add_tenant_header(self, kwargs):
            """Add X-Tenant-ID header to request."""
            headers = kwargs.get('headers', {}).copy() if kwargs.get('headers') else {}
            headers['X-Tenant-ID'] = str(self.tenant_id)
            kwargs['headers'] = headers
            return kwargs

        async def _request(self, method, *args, **kwargs):
            """Execute async request."""
            kwargs = self._add_tenant_header(kwargs)
            method_func = getattr(self._async_client, method)
            return await method_func(*args, **kwargs)

        def post(self, *args, **kwargs):
            return asyncio.get_event_loop().run_until_complete(
                self._request('post', *args, **kwargs)
            )

        def get(self, *args, **kwargs):
            return asyncio.get_event_loop().run_until_complete(
                self._request('get', *args, **kwargs)
            )

        def put(self, *args, **kwargs):
            return asyncio.get_event_loop().run_until_complete(
                self._request('put', *args, **kwargs)
            )

        def delete(self, *args, **kwargs):
            return asyncio.get_event_loop().run_until_complete(
                self._request('delete', *args, **kwargs)
            )

        def patch(self, *args, **kwargs):
            return asyncio.get_event_loop().run_until_complete(
                self._request('patch', *args, **kwargs)
            )

        async def aclose(self):
            await self._async_client.aclose()

    wrapper = AsyncClientWrapper(test_client, test_tenant.id)

    yield wrapper

    app.dependency_overrides.clear()

    # Clean up
    await wrapper.aclose()


@pytest.fixture(scope="function")
async def test_tenant(async_db_session: AsyncSession) -> Tenant:
    """Create test tenant."""
    tenant = Tenant(
        name="Test Tenant",
        code="test_tenant",
        is_active=True,
    )
    async_db_session.add(tenant)
    await async_db_session.commit()
    await async_db_session.refresh(tenant)
    return tenant


# Keep sync version for backward compatibility
@pytest.fixture(scope="function")
def test_tenant_sync(db_session: Session) -> Tenant:
    """Create test tenant (sync version for backward compatibility)."""
    tenant = Tenant(
        name="Test Tenant",
        code="test_tenant",
        is_active=True,
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


@pytest.fixture(scope="function")
async def test_user(async_db_session: AsyncSession, test_tenant: Tenant) -> User:
    """Create test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        role="admin",
        department="Engineering",
        is_active=True,
        tenant_id=test_tenant.id,
    )
    async_db_session.add(user)
    await async_db_session.commit()
    await async_db_session.refresh(user)
    return user


# Keep sync version for backward compatibility
@pytest.fixture(scope="function")
def test_user_sync(db_session: Session, test_tenant_sync: Tenant) -> User:
    """Create test user (sync version for backward compatibility)."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        role="admin",
        department="Engineering",
        is_active=True,
        tenant_id=test_tenant_sync.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def auth_headers(test_user: User) -> dict:
    """Get authentication headers."""
    # Generate token directly instead of making HTTP request
    token_data = {"sub": str(test_user.id), "username": test_user.username}
    access_token = create_access_token(token_data)

    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_requirement_data():
    """Sample requirement data for testing."""
    return {
        "title": "Test Requirement",
        "description": "This is a test requirement for automated testing",
        "source_channel": "customer",
        "customer_need_10q": {
            "q1_what_problem": "Customer needs to manage requirements efficiently",
            "q2_who_benefits": "Product managers and stakeholders",
            "q3_why_important": "Critical for product development",
            "q4_how_measured": "Number of requirements tracked",
            "q5_alternatives": "Manual spreadsheets",
            "q6_consequences_not_doing": "Lost requirements and miscommunication",
            "q7_related_requirements": [],
            "q8_assumptions": "Users have basic computer skills",
            "q9_constraints": "Must comply with company policies",
            "q10_acceptance_criteria": "All CRUD operations working",
        },
        "priority": 3,
        "complexity": "medium",
        "target_version": "v1.0",
    }


# Test configuration
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers", "asyncio: mark test as async"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


# ============ 业务对象 Fixtures ============

@pytest.fixture(scope="function")
async def test_requirement(async_db_session: AsyncSession, test_user: User, test_tenant: Tenant) -> Requirement:
    """Create test requirement in database."""
    requirement = Requirement(
        requirement_no="REQ-001",
        title="Test Requirement",
        description="Test description",
        source_channel="customer",
        status="collected",
        tenant_id=test_tenant.id,
        created_by=test_user.id,
    )
    async_db_session.add(requirement)
    await async_db_session.commit()
    await async_db_session.refresh(requirement)
    return requirement


@pytest.fixture(scope="function")
async def test_insight(async_db_session: AsyncSession, test_user: User, test_tenant: Tenant) -> InsightAnalysis:
    """Create test insight analysis."""
    insight = InsightAnalysis(
        insight_number="AI-001",
        input_text="Test customer interview",
        text_length=50,
        input_source="manual",
        analysis_mode="full",
        analysis_result={
            "q1_who": "Product Manager",
            "q2_why": "Need to manage requirements",
            "q3_what_problem": "Excel management is chaotic",
            "q4_current_solution": "Using Excel spreadsheets",
            "q5_current_issues": "Hard to track changes",
            "q6_ideal_solution": "A dedicated requirement management system",
            "q7_priority": "high",
            "q8_frequency": "daily",
            "q9_impact_scope": "Entire product team",
            "q10_value": "Improve efficiency by 50%"
        },
        tenant_id=test_tenant.id,
        created_by=test_user.id,
    )
    async_db_session.add(insight)
    await async_db_session.commit()
    await async_db_session.refresh(insight)
    return insight


@pytest.fixture(scope="function")
async def test_prompt_template(async_db_session: AsyncSession, test_user: User, test_tenant: Tenant) -> PromptTemplate:
    """Create test prompt template."""
    template = PromptTemplate(
        template_key="test_template",
        version="v1.0",
        is_active=True,
        name="Test Template",
        description="A test template for unit testing",
        content="Test prompt content with {variable}",
        variables='["variable"]',
        tenant_id=test_tenant.id,
        created_by=test_user.id,
    )
    async_db_session.add(template)
    await async_db_session.commit()
    await async_db_session.refresh(template)
    return template


# ============ 角色特定 Fixtures ============

@pytest.fixture(scope="function")
def test_admin_user(db_session: Session, test_tenant: Tenant) -> User:
    """Create admin user."""
    user = User(
        username="adminuser",
        email="admin@example.com",
        hashed_password=get_password_hash("adminpass123"),
        full_name="Admin User",
        role="admin",
        department="Engineering",
        is_active=True,
        tenant_id=test_tenant.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_product_manager(db_session: Session, test_tenant: Tenant) -> User:
    """Create product manager user."""
    user = User(
        username="productmanager",
        email="pm@example.com",
        hashed_password=get_password_hash("pmpass123"),
        full_name="Product Manager",
        role="product_manager",
        department="Product",
        is_active=True,
        tenant_id=test_tenant.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ============ 工厂模式 Fixtures ============

@pytest.fixture
def requirement_factory(db_session: Session, test_user: User, test_tenant: Tenant):
    """Factory for creating requirements with flexible parameters."""
    def _create(**kwargs):
        data = {
            "requirement_no": f"REQ-{random.randint(1000, 9999)}",
            "title": "Auto Requirement",
            "description": "Auto generated requirement",
            "source_channel": "customer",
            "status": "collected",
            "tenant_id": test_tenant.id,
            "created_by": test_user.id,
            **kwargs
        }
        req = Requirement(**data)
        db_session.add(req)
        db_session.commit()
        db_session.refresh(req)
        return req
    return _create


@pytest.fixture
def insight_factory(db_session: Session, test_user: User, test_tenant: Tenant):
    """Factory for creating insights with flexible parameters."""
    def _create(**kwargs):
        data = {
            "insight_number": f"AI-{random.randint(1000, 9999)}",
            "input_text": "Auto generated insight text",
            "text_length": 50,
            "input_source": "manual",
            "analysis_mode": "full",
            "analysis_result": {
                "q1_who": "Test User",
                "q2_why": "Test reason",
                "q3_what_problem": "Test problem",
            },
            "tenant_id": test_tenant.id,
            "created_by": test_user.id,
            **kwargs
        }
        insight = InsightAnalysis(**data)
        db_session.add(insight)
        db_session.commit()
        db_session.refresh(insight)
        return insight
    return _create
