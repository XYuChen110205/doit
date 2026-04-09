"""认证服务"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.database import database
from app.models.user import UserCreate, UserLogin, UserInDB, User

# JWT 配置
SECRET_KEY = "your-secret-key-here-change-in-production"  # 生产环境需要更换
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# 密码哈希
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """验证令牌，返回用户名"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None


async def get_user_by_username(username: str) -> Optional[UserInDB]:
    """根据用户名获取用户"""
    query = "SELECT * FROM users WHERE username = :username"
    result = await database.fetch_one(query, {"username": username})
    if result:
        return UserInDB(**result)
    return None


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """根据邮箱获取用户"""
    query = "SELECT * FROM users WHERE email = :email"
    result = await database.fetch_one(query, {"email": email})
    if result:
        return UserInDB(**result)
    return None


async def get_user_by_id(user_id: int) -> Optional[UserInDB]:
    """根据ID获取用户"""
    query = "SELECT * FROM users WHERE id = :id"
    result = await database.fetch_one(query, {"id": user_id})
    if result:
        return UserInDB(**result)
    return None


async def create_user(user_data: UserCreate) -> User:
    """创建用户"""
    # 检查用户名是否已存在
    existing_user = await get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    existing_email = await get_user_by_email(user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 创建用户
    hashed_password = get_password_hash(user_data.password)
    query = """
        INSERT INTO users (username, email, hashed_password, created_at)
        VALUES (:username, :email, :hashed_password, :created_at)
        RETURNING id, username, email, avatar, created_at
    """
    values = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = await database.fetch_one(query, values)
    return User(**result)


async def authenticate_user(login_data: UserLogin) -> Optional[UserInDB]:
    """认证用户"""
    user = await get_user_by_username(login_data.username)
    if not user:
        return None
    if not verify_password(login_data.password, user.hashed_password):
        return None
    return user


async def update_user(user_id: int, update_data: dict) -> User:
    """更新用户信息"""
    # 构建更新字段
    fields = []
    values = {"id": user_id, "updated_at": datetime.utcnow()}
    
    if "username" in update_data and update_data["username"]:
        # 检查新用户名是否已存在
        existing = await get_user_by_username(update_data["username"])
        if existing and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        fields.append("username = :username")
        values["username"] = update_data["username"]
    
    if "email" in update_data and update_data["email"]:
        # 检查新邮箱是否已存在
        existing = await get_user_by_email(update_data["email"])
        if existing and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        fields.append("email = :email")
        values["email"] = update_data["email"]
    
    if "avatar" in update_data:
        fields.append("avatar = :avatar")
        values["avatar"] = update_data["avatar"]
    
    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有要更新的字段"
        )
    
    fields.append("updated_at = :updated_at")
    
    query = f"""
        UPDATE users 
        SET {', '.join(fields)}
        WHERE id = :id
        RETURNING id, username, email, avatar, created_at
    """
    
    result = await database.fetch_one(query, values)
    return User(**result)
