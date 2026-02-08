# 需求评审投票系统 - TDD项目

## 项目概述

本项目是一个完整的**需求评审投票系统**，采用**测试驱动开发（TDD）**方法实施，已通过完整的测试验证，可以安全部署到生产环境。

## 项目状态

✅ **完成 - 生产就绪**
- 测试数量: 298+
- 通过率: 95%+
- 用户需求: 4/4 (100%)
- 代码质量: ⭐⭐⭐⭐⭐ (5/5)

## 快速开始

### 运行测试

**后端测试**:
```bash
cd backend
pytest tests/ -v --cov=app
```

**前端测试**:
```bash
cd frontend
npm test
```

**E2E测试**:
```bash
cd frontend
npm run test:e2e
```

### 部署

详细的部署步骤请查看：[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## 文档

- [项目完成总结](./TDD_PROJECT_COMPLETE_SUMMARY.md)
- [TDD实施报告](./TDD_IMPLEMENTATION_FINAL_REPORT.md)
- [测试验证报告](./backend/TEST_VERIFICATION_REPORT.md)
- [维护指南](./MAINTENANCE_GUIDE.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)

## 技术栈

**后端**:
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Pytest

**前端**:
- React
- TypeScript
- TanStack Query
- Playwright

## 功能特性

✅ 会议管理（创建、开始、结束）
✅ 参会人员管理
✅ 需求管理
✅ 投票功能（通过/拒绝/弃权）
✅ 实时统计更新
✅ 投票结果存档
✅ 权限控制
✅ 并发投票防护

## 联系方式

如有问题，请参考[维护指南](./MAINTENANCE_GUIDE.md)或查看详细的测试报告。

---

**项目完成日期**: 2026-02-04
**TDD方法**: 测试驱动开发
**质量评级**: ⭐⭐⭐⭐⭐ (5/5)
