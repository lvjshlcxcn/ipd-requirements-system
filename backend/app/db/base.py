"""Database base configuration."""
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import get_settings

settings = get_settings()

# Support both PostgreSQL and SQLite
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

# Synchronous engine (for Alembic migrations)
# Remove async driver prefix for sync engine
sync_url = settings.DATABASE_URL
if "+asyncpg" in sync_url:
    sync_url = sync_url.replace("+asyncpg", "").replace("postgresql://", "postgresql+psycopg2://")
elif "+aiosqlite" in sync_url:
    sync_url = sync_url.replace("+aiosqlite", "").replace("sqlite://", "sqlite+pysqlite://")

sync_engine = create_engine(
    sync_url,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Asynchronous engine (for API)
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()
