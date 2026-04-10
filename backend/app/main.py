"""FastAPI 应用入口"""
import os
import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import database, create_tables
from app.response import success

print("[Main] Starting to load routers...")

try:
    from app.routers.tasks import router as tasks_router
    print("[Main] tasks_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading tasks_router: {e}")
    tasks_router = None

try:
    from app.routers.notes import router as notes_router
    print("[Main] notes_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading notes_router: {e}")
    notes_router = None

try:
    from app.routers.inbox import router as inbox_router
    print("[Main] inbox_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading inbox_router: {e}")
    inbox_router = None

try:
    from app.routers.stats import router as stats_router
    print("[Main] stats_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading stats_router: {e}")
    stats_router = None

try:
    from app.routers.tags import router as tags_router
    print("[Main] tags_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading tags_router: {e}")
    tags_router = None

try:
    from app.routers.settings import router as settings_router
    print("[Main] settings_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading settings_router: {e}")
    settings_router = None

try:
    from app.routers.task_tags import router as task_tags_router
    print("[Main] task_tags_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading task_tags_router: {e}")
    task_tags_router = None

try:
    from app.routers.courses import router as courses_router
    print("[Main] courses_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading courses_router: {e}")
    courses_router = None

try:
    from app.routers.auth import router as auth_router
    print("[Main] auth_router loaded")
except Exception as e:
    print(f"[Main] ERROR loading auth_router: {e}")
    import traceback
    traceback.print_exc()
    auth_router = None

# 检测是否在 Vercel 环境
is_vercel = os.environ.get('VERCEL') == '1'

print(f"[Main] VERCEL env: {os.environ.get('VERCEL')}")
print(f"[Main] is_vercel: {is_vercel}")


async def connect_database_with_retry(max_retries=3, delay=1):
    """带重试的数据库连接"""
    for attempt in range(max_retries):
        try:
            if not database.is_connected:
                await database.connect()
                print(f"[Main] Database connected successfully on attempt {attempt + 1}")
                return True
            return True
        except Exception as e:
            print(f"[Main] Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
            else:
                print(f"[Main] All database connection attempts failed")
                return False
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    await connect_database_with_retry()
    yield
    if database.is_connected:
        await database.disconnect()


# 创建 FastAPI 应用
if is_vercel:
    # Vercel 环境：不使用 lifespan，手动处理数据库连接
    app = FastAPI(title="Todo System API")
else:
    # 本地环境：正常使用 lifespan
    app = FastAPI(title="Todo System API", lifespan=lifespan)

# 配置 CORS - 必须放在其他中间件之前
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://doit-bi9.pages.dev",
        "http://localhost:5173",
        "http://localhost:3000",
        "*"  # 临时允许所有来源用于调试
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # 预检请求缓存24小时
)


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """处理所有未捕获的异常，确保返回 JSON 格式"""
    print(f"[Main] Global exception: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": "Internal server error", "data": None}
    )


# Vercel 环境：在启动时尝试创建表
if is_vercel:
    try:
        create_tables()
        print("[Main] Tables created successfully on startup")
    except Exception as e:
        print(f"[Main] WARNING: Could not create tables on startup: {e}")


# Vercel 环境：使用中间件管理数据库连接
if is_vercel:
    @app.middleware("http")
    async def db_connection_middleware(request: Request, call_next):
        # 确保数据库已连接
        if not database.is_connected:
            connected = await connect_database_with_retry()
            if not connected:
                # 数据库连接失败，返回 503 服务不可用
                return JSONResponse(
                    status_code=503,
                    content={"code": 503, "message": "Database connection failed", "data": None},
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Credentials": "true",
                    }
                )
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            print(f"[Main] Request processing error: {e}")
            import traceback
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"code": 500, "message": "Internal server error", "data": None}
            )

# 只加载成功导入的路由
routers_loaded = []
if tasks_router:
    app.include_router(tasks_router)
    routers_loaded.append("tasks")
if notes_router:
    app.include_router(notes_router)
    routers_loaded.append("notes")
if inbox_router:
    app.include_router(inbox_router)
    routers_loaded.append("inbox")
if stats_router:
    app.include_router(stats_router)
    routers_loaded.append("stats")
if tags_router:
    app.include_router(tags_router)
    routers_loaded.append("tags")
if settings_router:
    app.include_router(settings_router)
    routers_loaded.append("settings")
if task_tags_router:
    app.include_router(task_tags_router)
    routers_loaded.append("task_tags")
if courses_router:
    app.include_router(courses_router)
    routers_loaded.append("courses")
if auth_router:
    app.include_router(auth_router)
    routers_loaded.append("auth")

print(f"[Main] Routers loaded: {', '.join(routers_loaded)}")


@app.get("/api/health")
async def health_check():
    db_status = "connected" if database.is_connected else "disconnected"
    return success(data={"status": "running", "database": db_status})


@app.get("/")
async def root():
    return success(data={"message": "Todo API is running", "docs": "/docs"})


# OPTIONS 请求处理 - 确保预检请求能正确响应
@app.options("/{path:path}")
async def options_handler(path: str):
    """处理所有 OPTIONS 预检请求"""
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )
