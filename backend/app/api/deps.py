"""API dependencies."""
from typing import AsyncGenerator, Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.db.session import get_async_db, get_db as get_db_sync
from app.db.base import AsyncSessionLocal
from app.models.user import User, UserRole
from app.config import get_settings

settings = get_settings()

# OAuth2 scheme for JWT tokens (optional token for sync endpoints)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session.

    Yields:
        Async database session
    """
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """Get current authenticated user from JWT token.

    Args:
        token: JWT access token (optional)
        db: Database session

    Returns:
        Current authenticated user or None

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not token:
        return None

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        tenant_id: int = payload.get("tenant_id")
        if user_id_str is None:
            return None

        # Convert user_id from string to int
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            return None

        # Set tenant context for multi-tenancy
        if tenant_id is not None:
            from app.core.tenant import set_tenant_context
            set_tenant_context(tenant_id)
    except JWTError:
        return None

    # Fetch user from database
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        Active user

    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ========================================================================
# Sync dependencies for synchronous endpoints
# ========================================================================

def get_current_user_sync(
    token: Annotated[Optional[str], Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db_sync)],
) -> Optional[User]:
    """Get current authenticated user from JWT token (sync version).

    This is a synchronous version for use with sync database sessions.
    Returns None if no token is provided or token is invalid.

    Args:
        token: JWT access token (optional)
        db: Database session

    Returns:
        Current authenticated user or None
    """
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        tenant_id: int = payload.get("tenant_id")
        if user_id is None:
            return None

        # Set tenant context for multi-tenancy
        if tenant_id is not None:
            from app.core.tenant import set_tenant_context
            set_tenant_context(tenant_id)
    except (JWTError, ValueError):
        return None

    # Fetch user from database
    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user
