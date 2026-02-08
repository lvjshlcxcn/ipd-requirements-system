"""Authentication API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.user import UserService
from app.models.user import User
from app.api.deps import get_current_user_sync

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


@router.post("/login")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    User login endpoint.

    Validates username and password against database users.
    Returns JWT token on successful authentication.
    """
    user_service = UserService(db)

    # Authenticate user
    user = user_service.authenticate_user(
        credentials.username, credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = user_service.create_access_token_for_user(user)

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name,
            }
        }
    }


@router.get("/me")
async def get_current_user():
    """Get current user info."""
    return {
        "success": True,
        "data": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "role": "admin"
        }
    }


@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="搜索用户名或姓名"),
    db: Session = Depends(get_db)  # 移除认证要求，方便调试
):
    """获取用户列表（用于选择参会人员等场景）"""
    user_service = UserService(db)

    # 构建查询
    query = db.query(User).filter(User.is_active == True)

    # 搜索过滤
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )

    # 分页
    total = query.count()
    skip = (page - 1) * page_size
    users = query.offset(skip).limit(page_size).all()

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role
                }
                for user in users
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }
