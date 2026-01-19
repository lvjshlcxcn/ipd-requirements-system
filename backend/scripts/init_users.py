"""Initialize default users in database."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.base import SessionLocal, Base
from app.models.user import User
from app.core.security import get_password_hash
from app.core.tenant import set_tenant_context


def create_default_users():
    """Create default users for testing."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=SessionLocal.kw["bind"])

    db = SessionLocal()
    try:
        # Set tenant context (using default tenant ID 1)
        set_tenant_context(1)

        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("Admin user already exists")
            return

        # Create admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="系统管理员",
            role="admin",
            department="IT",
            is_active=True,
            tenant_id=1,
        )
        db.add(admin)

        # Create product manager
        pm = User(
            username="pm",
            email="pm@example.com",
            hashed_password=get_password_hash("pm123"),
            full_name="产品经理",
            role="product_manager",
            department="产品",
            is_active=True,
            tenant_id=1,
        )
        db.add(pm)

        # Create engineer
        engineer = User(
            username="engineer",
            email="engineer@example.com",
            hashed_password=get_password_hash("eng123"),
            full_name="工程师",
            role="engineer",
            department="研发",
            is_active=True,
            tenant_id=1,
        )
        db.add(engineer)

        db.commit()
        print("Created default users:")
        print("  - admin / admin123 (管理员)")
        print("  - pm / pm123 (产品经理)")
        print("  - engineer / eng123 (工程师)")
    finally:
        db.close()


if __name__ == "__main__":
    create_default_users()
