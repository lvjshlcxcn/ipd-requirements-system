"""Database session management."""
from typing import AsyncGenerator, Generator

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import SessionLocal, AsyncSessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get synchronous database session.

    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()  # Commit transaction if no exceptions
    except Exception:
        db.rollback()  # Rollback on error
        raise
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session.

    Yields:
        Async database session
    """
    async with AsyncSessionLocal() as session:
        yield session


# Alias for compatibility with existing code
async_session = get_async_db
