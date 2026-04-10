"""数据库连接与建表"""
import databases
import sqlalchemy
import os
from pathlib import Path

# 检测是否在 Vercel 环境
is_vercel = os.environ.get('VERCEL') == '1'

# 优先使用环境变量中的数据库 URL
DATABASE_URL = os.getenv("DATABASE_URL", "") or os.getenv("DATABASE_URL_Doit", "")

print(f"[Database] Initial DATABASE_URL exists: {bool(DATABASE_URL)}")

# 如果是 Supabase 连接字符串，优化配置
if DATABASE_URL.startswith("postgresql://"):
    # 确保使用 SSL
    if "?" in DATABASE_URL:
        if "sslmode=" not in DATABASE_URL:
            DATABASE_URL += "&sslmode=require"
    else:
        DATABASE_URL += "?sslmode=require"
    
    # 使用 Supabase PgBouncer 连接池（端口 6543）替代直接连接（端口 5432）
    if ":5432/" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace(":5432/", ":6543/")
        print("[Database] Switched to PgBouncer port 6543")
    
    # 添加 PgBouncer 配置
    if "pgbouncer=true" not in DATABASE_URL:
        DATABASE_URL += "&pgbouncer=true"
    
    print(f"[Database] PostgreSQL URL configured with SSL and PgBouncer")

if not DATABASE_URL:
    print("[Database] WARNING: No DATABASE_URL found, using SQLite")
    if is_vercel:
        # Vercel 环境但没有数据库配置，使用内存数据库（数据不持久化）
        DATABASE_URL = "sqlite:///:memory:"
    else:
        # 本地环境使用文件数据库
        DB_DIR = Path(__file__).resolve().parent.parent
        DB_PATH = DB_DIR / "todo.db"
        DATABASE_URL = f"sqlite:///{DB_PATH}"

print(f"[Database] Final database type: {'PostgreSQL' if DATABASE_URL.startswith('postgresql') else 'SQLite'}")

# 配置数据库连接选项
database_options = {}
if DATABASE_URL.startswith("postgresql://"):
    # PostgreSQL 特定配置
    database_options = {
        "min_size": 1,
        "max_size": 10,
        "command_timeout": 60,
    }

database = databases.Database(DATABASE_URL, **database_options)
metadata = sqlalchemy.MetaData()

# ---- 任务表 ----
tasks = sqlalchemy.Table(
    "tasks", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sqlalchemy.Column("title", sqlalchemy.String(500), nullable=False),
    sqlalchemy.Column("detail", sqlalchemy.Text, default=""),
    sqlalchemy.Column("task_type", sqlalchemy.String(20), default="todo"),
    sqlalchemy.Column("status", sqlalchemy.String(20), default="pending"),
    sqlalchemy.Column("priority", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("due_date", sqlalchemy.String(10), default=None),
    sqlalchemy.Column("start_time", sqlalchemy.String(19), default=None),
    sqlalchemy.Column("end_time", sqlalchemy.String(19), default=None),
    sqlalchemy.Column("source", sqlalchemy.String(20), default="direct"),
    sqlalchemy.Column("created_at", sqlalchemy.String(19)),
    sqlalchemy.Column("completed_at", sqlalchemy.String(19), default=None),
    sqlalchemy.Column("archived", sqlalchemy.Boolean, default=False),
)

# ---- 笔记表 ----
notes = sqlalchemy.Table(
    "notes", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sqlalchemy.Column("content", sqlalchemy.Text, default=""),
    sqlalchemy.Column("note_date", sqlalchemy.String(10), nullable=False),
    sqlalchemy.Column("created_at", sqlalchemy.String(19)),
    sqlalchemy.Column("updated_at", sqlalchemy.String(19)),
)

# ---- 收集箱 ----
inbox = sqlalchemy.Table(
    "inbox", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sqlalchemy.Column("content", sqlalchemy.Text, nullable=False),
    sqlalchemy.Column("created_at", sqlalchemy.String(19)),
)

# ---- 标签表 ----
tags = sqlalchemy.Table(
    "tags", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sqlalchemy.Column("name", sqlalchemy.String(50), nullable=False),
    sqlalchemy.Column("color", sqlalchemy.String(7), default="#2C7A92"),
)

# ---- 任务-标签关联 ----
task_tags = sqlalchemy.Table(
    "task_tags", metadata,
    sqlalchemy.Column("task_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    sqlalchemy.Column("tag_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

# ---- 附件表 ----
attachments = sqlalchemy.Table(
    "attachments", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("note_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("notes.id", ondelete="CASCADE")),
    sqlalchemy.Column("file_path", sqlalchemy.String(500), nullable=False),
    sqlalchemy.Column("file_name", sqlalchemy.String(200)),
    sqlalchemy.Column("created_at", sqlalchemy.String(19)),
)

# ---- 课程表 ----
courses = sqlalchemy.Table(
    "courses", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sqlalchemy.Column("name", sqlalchemy.String(200), nullable=False),
    sqlalchemy.Column("code", sqlalchemy.String(50), default=""),
    sqlalchemy.Column("hours", sqlalchemy.Integer, default=48),
    sqlalchemy.Column("day", sqlalchemy.String(10), nullable=False),  # mon, tue, wed, thu, fri
    sqlalchemy.Column("period", sqlalchemy.Integer, nullable=False),  # 1-12
    sqlalchemy.Column("weeks", sqlalchemy.String(50), default="1-17周"),
    sqlalchemy.Column("room", sqlalchemy.String(200), default=""),
    sqlalchemy.Column("teacher", sqlalchemy.String(100), default=""),
    sqlalchemy.Column("target", sqlalchemy.String(100), default=""),
    sqlalchemy.Column("color", sqlalchemy.String(7), default="#E3F2FD"),
    sqlalchemy.Column("term", sqlalchemy.String(20), default="2024-2025-1"),
    sqlalchemy.Column("created_at", sqlalchemy.String(19)),
    sqlalchemy.Column("updated_at", sqlalchemy.String(19)),
)

# ---- 课程表设置 ----
schedule_settings = sqlalchemy.Table(
    "schedule_settings", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sqlalchemy.Column("background", sqlalchemy.Text, default=""),
    sqlalchemy.Column("background_opacity", sqlalchemy.Float, default=0.15),
    sqlalchemy.Column("table_opacity", sqlalchemy.Float, default=0.95),
    sqlalchemy.Column("bg_position_x", sqlalchemy.Float, default=50),
    sqlalchemy.Column("bg_position_y", sqlalchemy.Float, default=50),
    sqlalchemy.Column("bg_scale", sqlalchemy.Integer, default=100),
    sqlalchemy.Column("notification_enabled", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("updated_at", sqlalchemy.String(19)),
)

# ---- 用户表 ----
users = sqlalchemy.Table(
    "users", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("username", sqlalchemy.String(50), unique=True, nullable=False),
    sqlalchemy.Column("email", sqlalchemy.String(100), unique=True, nullable=False),
    sqlalchemy.Column("hashed_password", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("avatar", sqlalchemy.String(500), default=None),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=sqlalchemy.func.now()),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime, default=None),
)


def create_tables():
    try:
        engine = sqlalchemy.create_engine(DATABASE_URL)
        metadata.create_all(engine)
        engine.dispose()
        print("[Database] Tables created successfully")
    except Exception as e:
        print(f"[Database] ERROR creating tables: {e}")
        import traceback
        traceback.print_exc()
        raise
