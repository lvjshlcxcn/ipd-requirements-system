"""User repository for data access."""
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User


class UserRepository:
    """Repository for User model."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User or None
        """
        stmt = select(User).where(User.id == user_id)
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def get_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.

        Args:
            username: Username

        Returns:
            User or None
        """
        stmt = select(User).where(User.username == username)
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email.

        Args:
            email: Email address

        Returns:
            User or None
        """
        stmt = select(User).where(User.email == email)
        result = self.db.execute(stmt).scalar_one_or_none()
        return result

    def create(
        self,
        username: str,
        email: str,
        hashed_password: str,
        full_name: Optional[str] = None,
        role: str = "stakeholder",
        department: Optional[str] = None,
        is_active: bool = True,
        tenant_id: Optional[int] = None,
    ) -> User:
        """
        Create a new user.

        Args:
            username: Username
            email: Email address
            hashed_password: Hashed password
            full_name: Full name
            role: User role
            department: Department
            is_active: Is user active
            tenant_id: Tenant ID (required)

        Returns:
            Created user
        """
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            department=department,
            is_active=is_active,
            tenant_id=tenant_id,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user
