# IPD Requirements Management System - Backend

FastAPI backend for the IPD Requirements Management System.

## Features

- JWT Authentication
- Requirement CRUD with customer 10 questions
- APPEALS analysis (8-dimensional scoring)
- KANO classification
- Distribution to SP/BP/Charter/PCR
- Requirements Traceability Matrix (RTM)
- Verification records
- Workflow history tracking

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Cache**: Redis 7
- **Authentication**: JWT (python-jose)

## Setup

### Local Development

1. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL and Redis**:
```bash
# Using Docker Compose
docker-compose up -d postgres redis

# Or manually ensure PostgreSQL is running on localhost:5432
```

4. **Run database migrations**:
```bash
alembic upgrade head
```

5. **Start the development server**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Docker

1. **Build and run with Docker Compose**:
```bash
docker-compose up backend
```

## Database Migrations

### Create a new migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback migration
```bash
alembic downgrade -1
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Configuration settings
│   ├── core/                # Core utilities (auth, security)
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/v1/              # API routes
│   ├── services/            # Business logic
│   ├── repositories/        # Data access layer
│   ├── db/                  # Database configuration
│   └── utils/               # Utility functions
├── alembic/                 # Database migrations
├── tests/                   # Test files
├── requirements.txt
└── Dockerfile
```

## Testing

Run tests with pytest:
```bash
pytest tests/ -v --cov=app
```

## License

MIT
