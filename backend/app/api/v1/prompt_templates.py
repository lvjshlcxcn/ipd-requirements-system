"""Prompt template API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.prompt_template import (
    PromptTemplateCreate,
    PromptTemplateUpdate,
    PromptTemplateResponse,
    PromptTemplateListResponse,
)
from app.services.prompt_template import PromptTemplateService
from app.utils.json_helpers import parse_json_variables

router = APIRouter(prefix="/prompt-templates", tags=["Prompt Templates"])


def get_prompt_service(db: AsyncSession = Depends(get_db)) -> PromptTemplateService:
    """Get prompt template service instance."""
    return PromptTemplateService(db)


@router.get("/", response_model=PromptTemplateListResponse)
async def list_prompt_templates(
    template_key: Optional[str] = Query(None, description="Filter by template key"),
    current_user: Optional[User] = Depends(get_current_user),
    service: PromptTemplateService = Depends(get_prompt_service),
):
    """
    List all prompt templates for current tenant.

    - **template_key**: Optional filter by key (ipd_ten_questions, quick_insight)
    """
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    templates = await service.list_templates(template_key, current_user.tenant_id)

    # Parse variables from JSON string to list
    items_data = []
    for t in templates:
        items_data.append(PromptTemplateResponse(
            id=t.id,
            template_key=t.template_key,
            version=t.version,
            is_active=t.is_active,
            name=t.name,
            description=t.description,
            content=t.content,
            variables=parse_json_variables(t.variables),
            created_at=t.created_at,
            updated_at=t.updated_at,
        ))

    return PromptTemplateListResponse(
        success=True,
        data=items_data,
        total=len(items_data)
    )


@router.get("/{template_id}", response_model=PromptTemplateResponse)
async def get_prompt_template(
    template_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    service: PromptTemplateService = Depends(get_prompt_service),
):
    """Get prompt template by ID."""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    template = await service.get_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Build response manually to avoid validation issues
    return PromptTemplateResponse(
        id=template.id,
        template_key=template.template_key,
        version=template.version,
        is_active=template.is_active,
        name=template.name,
        description=template.description,
        content=template.content,
        variables=parse_json_variables(template.variables),
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.post("/", response_model=PromptTemplateResponse)
async def create_prompt_template(
    data: PromptTemplateCreate,
    current_user: Optional[User] = Depends(get_current_user),
    service: PromptTemplateService = Depends(get_prompt_service),
):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    """
    Create a new prompt template (admin only).

    - **template_key**: Template identifier (ipd_ten_questions, quick_insight)
    - **name**: Display name
    - **content**: Prompt content with {variable} placeholders
    - **description**: Optional description
    - **variables**: Optional list of variable names

    Note: If an active template with the same template_key already exists,
    it will be deactivated before creating the new one.
    """
    try:
        # 检查是否已存在激活的同 key 模板，禁用所有
        from sqlalchemy import select, and_
        from app.models.prompt_template import PromptTemplate

        result = await service.session.execute(
            select(PromptTemplate)
            .where(
                and_(
                    PromptTemplate.template_key == data.template_key,
                    PromptTemplate.tenant_id == current_user.tenant_id,
                    PromptTemplate.is_active == True
                )
            )
        )
        existing_templates = result.scalars().all()

        # 禁用所有激活的同 key 模板
        if existing_templates:
            print(f"[CreateTemplate] 发现 {len(existing_templates)} 个激活的同 key 模板，将全部禁用")
            for template in existing_templates:
                print(f"[CreateTemplate] 禁用模板 ID: {template.id}")
                await service.deactivate_template(template.id)

        template = await service.create_template(
            template_key=data.template_key,
            name=data.name,
            content=data.content,
            user_id=current_user.id,
            description=data.description,
            variables=data.variables,
        )

        # 提交事务
        await service.session.commit()

        # Build response dict manually to avoid validation issues with JSON string
        return PromptTemplateResponse(
            id=template.id,
            template_key=template.template_key,
            version=template.version,
            is_active=template.is_active,
            name=template.name,
            description=template.description,
            content=template.content,
            variables=parse_json_variables(template.variables),
            created_at=template.created_at,
            updated_at=template.updated_at,
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put("/{template_id}", response_model=PromptTemplateResponse)
async def update_prompt_template(
    template_id: int,
    data: PromptTemplateUpdate,
    current_user: Optional[User] = Depends(get_current_user),
    service: PromptTemplateService = Depends(get_prompt_service),
):
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    """
    Update a prompt template (creates new version, admin only).

    - **content**: New prompt content
    - **name**: Optional new name
    - **description**: Optional new description
    - **variables**: Optional new variable list
    """
    try:
        template = await service.update_template(
            template_id=template_id,
            content=data.content,
            user_id=current_user.id,
            name=data.name,
            description=data.description,
            variables=data.variables,
        )

        # 提交事务
        await service.session.commit()

        # Build response dict manually to avoid validation issues with JSON string
        return PromptTemplateResponse(
            id=template.id,
            template_key=template.template_key,
            version=template.version,
            is_active=template.is_active,
            name=template.name,
            description=template.description,
            content=template.content,
            variables=parse_json_variables(template.variables),
            created_at=template.created_at,
            updated_at=template.updated_at,
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt_template(
    template_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    service: PromptTemplateService = Depends(get_prompt_service),
):
    """Delete a prompt template (admin only)."""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    try:
        success = await service.delete_template(template_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        # 提交事务
        await service.session.commit()
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
