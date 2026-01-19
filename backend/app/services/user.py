"""User service for business logic."""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user import UserRepository
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.tenant import get_current_tenant


class UserService:
    """Service for User business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def authenticate_user(
        self, username: str, password: str
    ) -> Optional[User]:
        """
        Authenticate user with username and password.

        Args:
            username: Username
            password: Plain text password

        Returns:
            User if authentication successful, None otherwise
        """
        user = self.repo.get_by_username(username)
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        if not user.is_active:
            return None

        return user

    def create_access_token_for_user(self, user: User) -> str:
        """
        Create JWT access token for user.

        Args:
            user: User object

        Returns:
            JWT access token
        """
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
            "tenant_id": user.tenant_id,
        }
        return create_access_token(token_data)

    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        role: str = "stakeholder",
        department: Optional[str] = None,
        tenant_id: Optional[int] = None,
    ) -> User:
        """
        Create a new user.

        Args:
            username: Username
            email: Email address
            password: Plain text password (will be hashed)
            full_name: Full name
            role: User role
            department: Department
            tenant_id: Tenant ID (uses current tenant if not provided)

        Returns:
            Created user
        """
        # Get tenant_id from context if not provided
        if tenant_id is None:
            tenant_id = get_current_tenant()

        # Hash password
        hashed_password = get_password_hash(password)

        # Create user
        return self.repo.create(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            department=department,
            tenant_id=tenant_id,
        )

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.

        Args:
            username: Username

        Returns:
            User or None
        """
        return self.repo.get_by_username(username)
