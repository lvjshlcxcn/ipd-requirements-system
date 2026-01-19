"""Initialize database tables."""
import asyncio
from app.db.base import async_engine, Base


async def init_db():
    """Create all database tables."""
    async with async_engine.begin() as conn:
        # Import all models so they're registered with Base
        from app.models import (  # noqa: F401
            User,
            Tenant,
            Requirement,
            Requirement10QAnswer,
            RequirementVersion,
            AppealsAnalysis,
            KanoClassification,
            StrategicPlan,
            BusinessPlan,
            Charter,
            PCRRequest,
            RTMTrace,
            VerificationRecord,
            VerificationChecklist,
            WorkflowHistory,
            Attachment,
            Notification,
            ImportJob,
            ExportJob,
            CIMReference,
            RequirementCIMLink,
        )

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
