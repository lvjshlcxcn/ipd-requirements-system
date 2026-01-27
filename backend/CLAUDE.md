# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Start development server (runs on http://localhost:8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic revision --autogenerate -m "Description"  # Create migration
alembic upgrade head                               # Apply migrations
alembic downgrade -1                              # Rollback one migration

# Testing
pytest tests/ -v                    # Run tests with verbose output
pytest tests/ -v --cov=app         # Run with coverage report
pytest tests/ -v -k "test_name"    # Run specific test

# Code quality
black .                            # Format code
flake8 .                          # Lint code
mypy .                            # Type check
```

### Environment Setup
- **Virtual Environment**: `.venv/` or `python -m venv .venv`
- **Dependencies**: `pip install -r requirements.txt`
- **Environment File**: Copy `.env.example` to `.env` and configure
- **Database**: PostgreSQL on localhost:5432 + Redis on localhost:6379

## Architecture Overview

### Project Structure
FastAPI application following clean architecture and dependency injection patterns:

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration (Pydantic Settings)
│   ├── api/v1/              # API route handlers (organized by domain)
│   ├── core/                # Core functionality (auth, security, tenant)
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic schemas (request/response DTOs)
│   ├── services/            # Business logic layer
│   ├── repositories/        # Data access layer (CRUD operations)
│   ├── db/                  # Database connection and session management
│   ├── utils/               # Utility functions
│   └── prompts.py           # LLM prompt templates
├── alembic/                 # Database migrations
├── tests/                   # Test suite (pytest)
└── requirements.txt         # Python dependencies
```

### Key Architectural Patterns

**1. Layered Architecture**
```
API Layer (api/v1/) → Service Layer (services/) → Repository Layer (repositories/) → Database
```
- **API Layer** (`app/api/v1/`): Route handlers, request validation, response formatting
- **Service Layer** (`app/services/`): Business logic, cross-domain operations
- **Repository Layer** (`app/repositories/`): Database CRUD, queries
- **Models** (`app/models/`): SQLAlchemy ORM models (database schema)

**2. Dependency Injection Pattern**
- Repositories injected into Services via constructor
- Services injected into API routes via FastAPI Depends
- Database session managed via context manager

**3. Tenant Isolation**
- Multi-tenancy via `tenant_id` column
- Tenant middleware (`app/core/tenant.py`) extracts tenant from `X-Tenant-ID` header
- All queries automatically filtered by tenant_id

**4. Mixed Async/Sync Patterns**
- Most database operations use async SQLAlchemy
- Some operations (like LLM calls) use sync/async hybrid approach
- Always use `async def` for route handlers

**5. Exception Handling**
- Custom exception class: `AppException` (`app/core/exceptions.py`)
- Global exception handlers in `main.py` for consistent error responses
- Response format: `{ "success": False, "message": "error details" }`

### Domain Organization

API routes organized by business domain in `app/api/v1/`:

| Domain | Route File | Description |
|--------|-----------|-------------|
| Auth | `auth.py` | Login, register, token refresh |
| Requirements | `requirements.py` | CRUD, 10 questions, history |
| Analysis | `analysis.py` | INVEST, MoSCoW, RICE, Kano analysis |
| APPEALS | `appeals.py` | 8-dimensional scoring |
| Distribution | `distribution.py` | SP/BP/Charter/PCR distribution |
| RTM | `rtm.py` | Requirements Traceability Matrix |
| Verification | `verification.py` | Verification records |
| Insights | `insights.py` | AI-powered insights (OpenAI integration) |
| Prompt Templates | `prompt_templates.py` | LLM prompt template management |
| Notifications | `notifications.py` | User notifications |
| Import/Export | `import_export.py` | Data import/export jobs |
| Tenant | `tenant.py` | Tenant management |

## Important Technical Details

### Database Management
- **ORM**: SQLAlchemy 2.0 with async support
- **Session Management**: Context manager pattern
  ```python
  async with get_db() as db:
      # database operations
  # session automatically closed
  ```
- **Migrations**: Alembic with auto-generation from models
- **Base Model**: `TenantMixin` for tenant_id inheritance

### Authentication & Authorization
- **Strategy**: JWT (JSON Web Tokens)
- **Library**: python-jose
- **Token Storage**: Redis (optional, for blacklisting)
- **Password Hashing**: bcrypt
- **Current User**: Depends via `get_current_user()` and `get_current_active_user()`
- **Admin Check**: `require_admin()` dependency for admin-only routes

### Pydantic Schemas
Two types of schemas in `app/schemas/`:
- **Request schemas**: Input validation, alias for snake_case to camelCase
- **Response schemas**: Output formatting, exclude sensitive fields
- Generic response wrapper: Most endpoints return `{ "success": bool, "data": ..., "message": ... }`

### LLM Integration (OpenAI)
- **Service**: `app/services/openai_service.py` (if exists) or inline in `insights.py`
- **Prompts**: Managed in `app/prompts.py`
- **Error Handling**: Tenacity retry logic for API failures
- **Models**: GPT-4 for insights/analysis (configurable via env)

### Redis Usage
- **Cache**: Query result caching (if implemented)
- **Sessions**: Optional session storage
- **Background Jobs**: Optional job queue (if Celery/Redis implemented)

## API Design Patterns

### Standard Response Format
```python
{
    "success": True/False,
    "data": {...},           # Actual data on success
    "message": "...",       # Error message on failure
    "total": 10,            # For paginated responses
    "page": 1,
    "page_size": 10
}
```

### Pagination Pattern
```python
@router.get("/requirements")
async def list_requirements(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    # Use skip/limit for pagination
    # Return total count for frontend
```

### Common Route Patterns

**GET by ID (404 if not found)**:
```python
@router.get("/{id}")
async def get_item(id: int, db: AsyncSession = Depends(get_db)):
    item = await repository.get(db, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True, "data": item}
```

**POST (Validation + Create)**:
```python
@router.post("/")
async def create_item(
    item_create: ItemCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = await repository.create(db, item_create, current_user.id)
    return {"success": True, "data": item}
```

**PUT/DELETE (Ownership Check)**:
```python
@router.put("/{id}")
async def update_item(
    id: int,
    item_update: ItemUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = await repository.get(db, id)
    if not item or item.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Not found or unauthorized")
    # ... update logic
```

## Testing Patterns

### Test Structure
Mirrors `app/` structure in `tests/`:
```
tests/
├── api/v1/           # API route tests
├── services/         # Service layer tests
├── repositories/     # Repository tests
└── conftest.py       # Test fixtures and configuration
```

### Pytest Configuration
- **Config File**: `pytest.ini` in project root
- **Coverage**: `.coverage` and `htmlcov/` generated after `pytest --cov`
- **Async Tests**: `pytest-asyncio` plugin required

### Common Test Fixtures (in `tests/conftest.py`)
```python
@pytest.fixture
async def db_session():
    # Create test database session
    async with async_session_maker() as session:
        yield session
        await session.rollback()  # Rollback after test

@pytest.fixture
def client():
    # Test FastAPI client
    return TestClient(app)
```

### Testing Routes
```python
@pytest.mark.asyncio
async def test_create_item(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/v1/items/",
        json={"name": "Test"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
```

## Common Gotchas

### When Creating Migrations
1. Always review auto-generated migrations before committing
2. Check that tenant_id is properly handled for new models
3. Use `alembic upgrade head` immediately after creation to verify
4. Don't modify existing migrations (create new ones instead)

### When Working with Database Sessions
- Always use `async with get_db() as db:` context manager
- Never store db session across requests (not request-safe)
- Expired sessions will cause errors

### When Adding New Routes
1. Create model in `app/models/`
2. Create schemas in `app/schemas/`
3. Create repository in `app/repositories/`
4. Create service in `app/services/`
5. Create route in `app/api/v1/`
6. Register route in `app/api/v1/__init__.py` or `main.py`

### When Implementing Tenant Isolation
- Inherit from `TenantMixin` for all multi-tenant models
- Repository methods automatically filter by `tenant_id`
- Service layer should pass `current_user.tenant_id` to repositories
- Never let frontend control `tenant_id` (always from authenticated user)

### When Working with OpenAI/LLMs
- API key in `.env`: `OPENAI_API_KEY=sk-...`
- Implement retry logic with tenacity for rate limits
- Cache expensive LLM calls when appropriate
- Validate prompts before sending (length, content)

### When Writing Tests
- Always use `@pytest.mark.asyncio` for async tests
- Use fixtures for common setup (db, client, auth)
- Mock external dependencies (OpenAI, Redis) in tests
- Test both success and failure cases
- Verify tenant isolation in multi-tenant tests

## Code Quality Standards

### Formatting & Linting
```bash
black .          # Auto-format (required before commit)
flake8 .         # Lint (must pass)
mypy .           # Type check (optional but recommended)
```

### Import Order (PEP 8)
1. Standard library imports
2. Third-party imports
3. Local application imports
4. Each group separated by blank line

### Type Hints
- Required for all function signatures
- Use `typing` module for generic types
- Use Pydantic models for complex data structures

### Documentation
- Docstrings for all public functions/classes (Google style preferred)
- Inline comments for complex logic
- API documentation auto-generated from docstrings (Swagger UI)

## Environment Variables

Key environment variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT signing key
- `OPENAI_API_KEY` - OpenAI API key for insights
- `DEBUG` - Enable debug mode (more verbose logging)
- `CORS_ORIGINS` - Comma-separated list of allowed origins

API Documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
