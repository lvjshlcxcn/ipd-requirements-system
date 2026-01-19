"""Authentication dependencies and utilities."""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class TokenData(BaseModel):
    """Token data model."""

    user_id: Optional[int] = None
    username: Optional[str] = None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> TokenData:
    """
    Get current authenticated user from token.

    Args:
        token: JWT access token
        db: Database session

    Returns:
        Token data containing user information

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    username: Optional[str] = payload.get("username")

    if user_id is None or username is None:
        raise credentials_exception

    return TokenData(user_id=user_id, username=username)


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    Get current active user.

    Args:
        current_user: Current user from token

    Returns:
        Current user data

    Note:
        Add is_active check when user model is implemented
    """
    # TODO: Add is_active check from user model
    return current_user
