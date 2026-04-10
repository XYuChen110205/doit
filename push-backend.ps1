# 推送 backend 到 doit-api 仓库
Set-Location -Path "E:\AISystem\o404do\todo-system\backend"

# 初始化 git 仓库
if (-Not (Test-Path -Path ".git")) {
    git init
    git remote add origin https://github.com/XYuChen110205/doit-api.git
}

# 添加所有文件
git add .

# 提交
git commit -m "Update backend code"

# 推送到 main 分支
git push -u origin main --force

Write-Host "Backend pushed to doit-api repository!"
