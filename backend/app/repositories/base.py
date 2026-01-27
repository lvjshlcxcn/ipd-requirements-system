"""Base repository with common CRUD operations."""
from typing import Generic, TypeVar, Type, Optional, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.core.tenant import get_current_tenant

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations.

    Automatically filters by tenant_id for models with TenantMixin.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """Initialize repository.

        Args:
            model: SQLAlchemy model class
            session: Database session
        """
        self.model = model
        self.session = session

    def _get_query(self):
        """Get base query with tenant filtering if applicable."""
        query = select(self.model)
        # Check if model has tenant_id attribute
        if hasattr(self.model, "tenant_id"):
            tenant_id = get_current_tenant()
            if tenant_id is not None:
                query = query.where(self.model.tenant_id == tenant_id)
        return query

    async def get_by_id(self, id: int) -> Optional[ModelType]:
        """Get a single record by ID.

        Args:
            id: Record ID

        Returns:
            Model instance or None
        """
        query = self._get_query()
        query = query.where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ModelType]:
        """Get all records with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of model instances
        """
        query = self._get_query()
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self) -> int:
        """Count total records.

        Returns:
            Total count
        """
        query = self._get_query()
        query = select(func.count()).select_from(self.model)
        result = await self.session.execute(query)
        return result.scalar()

    async def create(self, **kwargs) -> ModelType:
        """Create a new record.

        Args:
            **kwargs: Model field values

        Returns:
            Created model instance
        """
        db_obj = self.model(**kwargs)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(self, id: int, **kwargs) -> Optional[ModelType]:
        """Update an existing record.

        Args:
            id: Record ID
            **kwargs: Fields to update

        Returns:
            Updated model instance or None
        """
        from datetime import datetime, timezone

        db_obj = await self.get_by_id(id)
        if db_obj is None:
            return None

        for field, value in kwargs.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        # Manually update updated_at if the model has this field
        if hasattr(db_obj, "updated_at"):
            setattr(db_obj, "updated_at", datetime.now(timezone.utc))

        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: int) -> bool:
        """Delete a record.

        Args:
            id: Record ID

        Returns:
            True if deleted, False if not found
        """
        db_obj = await self.get_by_id(id)
        if db_obj is None:
            return False

        await self.session.delete(db_obj)
        await self.session.flush()
        return True

    async def exists(self, id: int) -> bool:
        """Check if a record exists.

        Args:
            id: Record ID

        Returns:
            True if exists, False otherwise
        """
        return await self.get_by_id(id) is not None
