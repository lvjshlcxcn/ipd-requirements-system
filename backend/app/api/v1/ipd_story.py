"""
IPD 需求十问 → 用户故事 → INVEST 分析 API 路由
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.ipd_story import (
    GenerateStoryRequest,
    AnalyzeINVESTRequest,
    IPDStoryFlowCreate,
    IPDStoryFlowResponse,
)
from app.services.ipd_story_service import IPDStoryService
from app.core.exceptions import AppException

router = APIRouter(prefix="/ipd-story", tags=["ipd-story"])


async def get_tenant_id(x_tenant_id: Optional[str] = Header(None)) -> int:
    """从请求头获取 tenant_id"""
    if x_tenant_id:
        try:
            return int(x_tenant_id)
        except ValueError:
            pass
    # 默认返回 tenant_id = 1
    return 1


async def get_optional_user(db: AsyncSession = Depends(get_db)) -> Optional[User]:
    """可选的用户认证，如果没有认证则返回 None"""
    try:
        from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
        from app.core.security import decode_token
        from sqlalchemy import select

        authorization = HTTPBearer(auto_error=False)
        credentials: HTTPAuthorizationCredentials = await authorization()

        if credentials:
            token = credentials.credentials
            payload = decode_token(token)
            user_id = payload.get('sub')

            if user_id:
                result = await db.execute(select(User).where(User.id == int(user_id)))
                return result.scalar_one_or_none()
    except:
        pass

    return None


@router.post("/generate", response_model=dict)
async def generate_user_story(
    request: GenerateStoryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    基于 IPD 十问生成用户故事

    提交 IPD 需求十问表单数据，系统将：
    1. 保存 IPD 十问记录
    2. 使用规则引擎提取角色、行动、价值
    3. 自动生成验收标准
    4. 返回完整的用户故事
    """
    try:
        service = IPDStoryService(db)

        # 转换请求为 IPD 十问创建模型
        from app.schemas.ipd_story import IPDTenQuestionsCreate
        ipd_data = IPDTenQuestionsCreate(**request.model_dump())

        # 生成用户故事
        story = await service.generate_user_story(
            data=ipd_data,
            tenant_id=current_user.tenant_id,
            created_by=current_user.id,
        )

        return {
            "success": True,
            "data": story.model_dump(by_alias=True),
            "message": "用户故事生成成功",
        }
    except AppException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": f"生成失败: {str(e)}"},
        )


@router.post("/invest-analyze", response_model=dict)
async def analyze_invest(
    request: AnalyzeINVESTRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """
    执行 INVEST 分析

    对用户故事进行 INVEST 六个维度的评估：
    - Independent（独立的）
    - Negotiable（可协商的）
    - Valuable（有价值的）
    - Estimable（可估算的）
    - Small（小的）
    - Testable（可测试的）

    系统将计算总分、平均分，并自动生成改进建议
    """
    try:
        service = IPDStoryService(db)

        # 执行 INVEST 分析
        analysis = await service.analyze_invest(
            story_id=request.story_id,
            scores=request.scores,
            tenant_id=tenant_id,
            created_by=current_user.id if current_user else 1,
        )

        return {
            "success": True,
            "data": analysis.model_dump(by_alias=True),
            "message": "INVEST 分析完成",
        }
    except AppException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": f"分析失败: {str(e)}"},
        )


@router.post("/workflow", response_model=dict)
async def create_workflow(
    data: IPDStoryFlowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """
    保存完整工作流

    保存完整的 IPD → 用户故事 → INVEST 分析流程数据
    返回工作流 ID 用于后续查询和导出
    """
    try:
        service = IPDStoryService(db)

        # 使用认证用户ID或默认值
        created_by = current_user.id if current_user else 1

        workflow = await service.create_workflow(
            data=data,
            tenant_id=tenant_id,
            created_by=created_by,
        )

        return {
            "success": True,
            "data": workflow.model_dump(by_alias=True),
            "message": "工作流保存成功",
        }
    except AppException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": f"保存失败: {str(e)}"},
        )


@router.get("/workflow/{workflow_id}", response_model=dict)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """
    获取工作流数据

    根据 workflow_id 获取完整的流程数据
    """
    try:
        service = IPDStoryService(db)
        workflow = await service.get_workflow(workflow_id, tenant_id)

        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "工作流不存在"},
            )

        return {
            "success": True,
            "data": workflow.model_dump(by_alias=True),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": f"获取失败: {str(e)}"},
        )


@router.get("/workflows", response_model=dict)
async def list_workflows(
    skip: int = 0,
    limit: int = 10,
    priority: str = None,
    search: str = None,
    order_by_invest: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """
    获取工作流列表

    支持分页、按优先级筛选、模糊搜索和按INVEST分数排序
    - search: 搜索关键词（匹配用户故事标题、角色）
    - order_by_invest: 是否按INVEST分数从高到低排序（默认按创建时间）
    """
    try:
        service = IPDStoryService(db)

        workflows = await service.list_workflows(
            tenant_id=tenant_id,
            skip=skip,
            limit=limit,
            search=search,
            order_by_invest=order_by_invest,
        )

        return {
            "success": True,
            "data": {
                "data": [w.model_dump(by_alias=True) for w in workflows],
                "total": len(workflows),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": f"获取列表失败: {str(e)}"},
        )


@router.delete("/workflow/{workflow_id}", response_model=dict)
async def delete_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """
    删除工作流

    根据 workflow_id（实际是 user_story.id）删除整个工作流
    包括 IPD 十问、用户故事和 INVEST 分析
    """
    try:
        service = IPDStoryService(db)

        success = await service.delete_workflow(
            workflow_id=workflow_id,
            tenant_id=tenant_id,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "工作流不存在"},
            )

        return {
            "success": True,
            "message": "工作流删除成功",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": f"删除失败: {str(e)}"},
        )


@router.get("/workflow/{workflow_id}/export")
async def export_workflow(
    workflow_id: str,
    format: str = "json",
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    tenant_id: int = Depends(get_tenant_id),
):
    """
    导出工作流结果

    支持导出为 JSON、PDF 或 DOCX 格式
    """
    from fastapi.responses import Response, FileResponse
    import json
    from datetime import datetime

    try:
        service = IPDStoryService(db)
        workflow = await service.get_workflow(workflow_id, tenant_id)

        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="工作流不存在",
            )

        if format == "json":
            # 导出为 JSON
            json_data = json.dumps(
                workflow.model_dump(by_alias=True),
                ensure_ascii=False,
                indent=2,
            )
            return Response(
                content=json_data,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=ipd-story-invest-{workflow_id}.json"
                },
            )
        elif format == "pdf":
            # TODO: 实现 PDF 导出
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="PDF 导出功能待实现",
            )
        elif format == "docx":
            # TODO: 实现 DOCX 导出
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="DOCX 导出功能待实现",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的导出格式: {format}",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导出失败: {str(e)}",
        )
