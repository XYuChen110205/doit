# Vercel Serverless 入口文件
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"VERCEL env: {os.environ.get('VERCEL')}")
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL', 'not set')}")

from app.main import app

# Vercel 需要这个 handler
handler = app
