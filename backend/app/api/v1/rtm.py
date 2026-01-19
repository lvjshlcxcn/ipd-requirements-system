"""RTM API routes."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_sync
from app.schemas.rtm import (
    TraceabilityLinkCreate,
    TraceabilityLinkUpdate,
    TraceabilityLinkResponse,
    TraceabilityMatrixResponse,
)
from app.services.rtm import rtm_service


router = APIRouter(prefix="/rtm", tags=["需求追溯矩阵"])


def get_tenant_id(current_user: Optional[User]) -> int:
    """获取租户 ID，如果用户未认证则使用默认值."""
    if current_user is None:
        # 未认证用户使用默认租户
        return 1
    return current_user.tenant_id


@router.get("/matrix")
def get_traceability_matrix(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """获取需求追溯矩阵."""
    tenant_id = get_tenant_id(current_user)
    matrix = rtm_service.get_traceability_matrix(
        db=db,
        tenant_id=tenant_id,
    )

    return {"data": matrix}


@router.get("/requirements/{requirement_id}")
def get_requirement_traceability(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """获取单个需求的追溯信息."""
    tenant_id = get_tenant_id(current_user)
    traceability = rtm_service.get_requirement_traceability(
        db=db,
        requirement_id=requirement_id,
        tenant_id=tenant_id,
    )

    return {"data": traceability}


@router.post("/links", status_code=status.HTTP_201_CREATED)
def create_link(
    link_data: TraceabilityLinkCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """创建追溯关联."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="需要登录")

    try:
        link = rtm_service.create_link(
            db=db,
            link_data=link_data,
            tenant_id=current_user.tenant_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return TraceabilityLinkResponse.model_validate(link)


@router.put("/links/{link_id}")
def update_link(
    link_id: int,
    link_data: TraceabilityLinkUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """更新追溯关联."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="需要登录")

    link = rtm_service.update_link(
        db=db,
        link_id=link_id,
        link_data=link_data,
        tenant_id=current_user.tenant_id,
    )

    if not link:
        raise HTTPException(status_code=404, detail="关联不存在")

    return TraceabilityLinkResponse.model_validate(link)


@router.delete("/links/{link_id}")
def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """删除追溯关联."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="需要登录")
    
    result = rtm_service.delete_link(
        db=db,
        link_id=link_id,
        tenant_id=current_user.tenant_id,
    )

    if not result:
        raise HTTPException(status_code=404, detail="关联不存在")

    return {"message": "删除成功"}


@router.get("/export")
def export_matrix(
    format: str = Query("excel", regex="^(excel|pdf)$", description="导出格式"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """导出需求追溯矩阵."""
    tenant_id = get_tenant_id(current_user)

    if format == "excel":
        # 导出为 Excel
        excel_data = rtm_service.export_to_excel(db, tenant_id)

        return Response(
            content=excel_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": 'attachment; filename="traceability_matrix.xlsx"'
            }
        )
    else:
        # PDF 导出暂未实现
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="PDF 导出功能尚未实现"
        )


@router.get("/statistics")
def get_rtm_statistics(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_sync),
):
    """获取需求追溯矩阵统计数据."""
    tenant_id = get_tenant_id(current_user)
    stats = rtm_service.get_statistics(db, tenant_id)
    return {"data": stats}
