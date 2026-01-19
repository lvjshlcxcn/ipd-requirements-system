"""Create default tenant for testing."""
import asyncio
from sqlalchemy.orm import Session
from app.db.base import sync_engine, SessionLocal
from app.models.tenant import Tenant


def create_default_tenant():
    """Create a default tenant."""
    session = SessionLocal()
    try:
        # Check if default tenant already exists
        existing = session.query(Tenant).filter(Tenant.name == "Default").first()
        if existing:
            print(f"Default tenant already exists with ID: {existing.id}")
            return existing.id

        # Create default tenant
        tenant = Tenant(
            name="Default",
            code="default",
        )
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
        print(f"Created default tenant with ID: {tenant.id}")
        return tenant.id
    except Exception as e:
        print(f"Error creating tenant: {e}")
        session.rollback()
        return None
    finally:
        session.close()


if __name__ == "__main__":
    create_default_tenant()
