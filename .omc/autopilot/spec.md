# Hello World 函数 - 技术规范

## 需求概述

创建一个简单的 hello world 函数作为演示/测试用途。

## 功能需求

1. **核心功能**
   - 创建一个返回 "Hello, World!" 的函数
   - 支持自定义名称参数
   - 包含基本的类型提示

2. **API 端点（可选）**
   - 创建一个 GET 端点 `/api/v1/hello`
   - 支持查询参数 `?name=World`
   - 返回 JSON 格式响应

## 技术栈

- **语言**: Python 3.11+
- **框架**: FastAPI
- **位置**: `backend/app/services/hello.py`（服务层函数）
- **路由**: `backend/app/api/v1/hello.py`（API 端点）

## 实现规范

### 1. 服务层函数 (`hello.py`)

```python
def say_hello(name: str = "World") -> dict:
    """
    返回问候语

    Args:
        name: 要问候的名字，默认为 "World"

    Returns:
        包含问候消息的字典
    """
    return {
        "message": f"Hello, {name}!",
        "timestamp": datetime.utcnow().isoformat()
    }
```

### 2. API 端点（可选）

```python
@router.get("/hello")
async def hello_endpoint(name: str = "World"):
    """Hello World API 端点"""
    return say_hello(name)
```

## 验收标准

- [ ] 函数创建在正确的位置
- [ ] 包含类型提示和文档字符串
- [ ] 支持自定义名称参数
- [ ] 返回正确的 JSON 格式
- [ ] API 端点可访问（如果实现）

## 非功能需求

- 代码简洁明了
- 遵循项目代码规范
- 包含基本文档
