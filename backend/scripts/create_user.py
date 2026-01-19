"""Create a test user in database."""
import sys
from pathlib import Path
import hashlib

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.base import SessionLocal
from app.models.user import User


def create_test_user():
    """Create a test user with simple hash."""
    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("Admin user already exists")
            print(f"Username: {existing_admin.username}")
            return

        # Create simple hash (for demo purposes - use bcrypt in production)
        password = "admin123"
        # Using SHA256 for simplicity in this demo
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Create admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hashed_password,
            full_name="系统管理员",
            role="admin",
            department="IT",
            is_active=True,
            tenant_id=1,
        )
        db.add(admin)
        db.commit()

        print("Created admin user:")
        print("  Username: admin")
        print("  Password: admin123")
    finally:
        db.close()


if __name__ == "__main__":
    create_test_user()
