# Vercel Serverless 入口文件
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入 FastAPI 和响应类
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# 创建一个最基本的 app（先不导入其他东西）
app = FastAPI(title="Todo System API")

# 定义一个简单的健康检查接口
@app.get("/")
async def root():
    return {"message": "API is running", "status": "ok"}

@app.get("/api/health")
async def health_check():
    return {"status": "running", "database": "not connected"}

# 尝试导入真正的路由
try:
    # 先打印日志，方便调试
    print("[Index] Trying to import main app...")
    
    # 导入 main.py 里的 app
    from app.main import app as real_app
    
    # 如果导入成功，用 real_app 替换当前的 app
    app = real_app
    print("[Index] Main app imported successfully!")
    
except Exception as e:
    # 如果导入失败，记录错误，但保持最基本的 app 运行
    print(f"[Index] ERROR: Failed to import main app: {e}")
    import traceback
    traceback.print_exc()
    
    # 添加一个错误提示接口
    @app.get("/error")
    async def error_info():
        return {
            "error": "Failed to load main application",
            "details": str(e)
        }

# Vercel 需要这个 handler
handler = app
