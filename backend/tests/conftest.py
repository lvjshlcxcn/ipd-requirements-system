"""Pytest configuration and fixtures."""

import os
import sys
from typing import Generator
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.base import Base
from app.models.user import User
from app.models.tenant import Tenant
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
def client(db_session: Session, test_tenant: Tenant):
    """Create test HTTP client wrapper."""
    
    # Dependency override for database session
    def override_get_db():
        yield db_session

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
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
        
        def _add_tenant_header(self, kwargs):
            """Add X-Tenant-ID header to request."""
            headers = kwargs.get('headers', {}).copy()
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
            self.loop.close()
    
    wrapper = SyncClientWrapper(test_client, test_tenant.id)
    
    yield wrapper
    
    app.dependency_overrides.clear()
    
    # Clean up
    wrapper.close()


@pytest.fixture(scope="function")
def test_tenant(db_session: Session) -> Tenant:
    """Create test tenant."""
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
def test_user(db_session: Session, test_tenant: Tenant) -> User:
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
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(test_user: User) -> dict:
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
