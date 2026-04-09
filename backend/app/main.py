"""FastAPI 应用入口"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import database, create_tables
from app.response import success
from app.routers.tasks import router as tasks_router
from app.routers.notes import router as notes_router
from app.routers.inbox import router as inbox_router
from app.routers.stats import router as stats_router
from app.routers.tags import router as tags_router
from app.routers.settings import router as settings_router
from app.routers.task_tags import router as task_tags_router
from app.routers.courses import router as courses_router
from app.routers.auth import router as auth_router

# 检测是否在 Vercel 环境
is_vercel = os.environ.get('VERCEL') == '1'

print(f"[Main] VERCEL env: {os.environ.get('VERCEL')}")
print(f"[Main] is_vercel: {is_vercel}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    await database.connect()
    yield
    await database.disconnect()


# 创建 FastAPI 应用
if is_vercel:
    # Vercel 环境：不使用 lifespan，手动处理数据库连接
    app = FastAPI(title="Todo System API")
else:
    # 本地环境：正常使用 lifespan
    app = FastAPI(title="Todo System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel 环境：使用中间件管理数据库连接
if is_vercel:
    @app.middleware("http")
    async def db_connection_middleware(request: Request, call_next):
        # 确保数据库已连接
        if not database.is_connected:
            await database.connect()
        response = await call_next(request)
        return response

app.include_router(tasks_router)
app.include_router(notes_router)
app.include_router(inbox_router)
app.include_router(stats_router)
app.include_router(tags_router)
app.include_router(settings_router)
app.include_router(task_tags_router)
app.include_router(courses_router)
app.include_router(auth_router)

print(f"[Main] Routers loaded: auth, tasks, notes, inbox, stats, tags, settings, courses")

@app.get("/api/health")
async def health_check():
    return success(data={"status": "running"})

@app.get("/")
async def root():
    return success(data={"message": "Todo API is running", "docs": "/docs"})
