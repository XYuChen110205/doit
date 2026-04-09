---
name: "cloudflare-deployment"
description: "Guides Vue.js + Vite project deployment to Cloudflare Pages. Invoke when user needs to deploy frontend, fix build errors, or configure path aliases."
---

# Cloudflare Pages 部署指南 (Vue.js + Vite)

## 概述

本文档记录了将 Vue.js + Vite 项目部署到 Cloudflare Pages 的完整流程，包括常见问题及解决方案。

---

## 一、项目结构要求

```
todo-system/
├── frontend/          # Vue.js 前端项目
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── backend/           # FastAPI 后端项目 (可选)
```

**关键配置**：
- 前端代码必须在 `frontend/` 目录下
- 构建输出目录为 `dist/`

---

## 二、Cloudflare Pages 构建设置

### 1. 基础设置

| 设置项 | 值 | 说明 |
|--------|-----|------|
| **Framework preset** | `None` 或 `Vue` | 根据项目选择 |
| **Root directory** | `frontend` | 指向前端项目根目录 |
| **Build command** | `npm install && npx vite build` | 安装依赖并构建 |
| **Build output directory** | `dist` | Vite 默认输出目录 |

### 2. 环境变量（可选）

```
VITE_API_URL = https://your-backend-url.com
```

---

## 三、Vite 路径别名配置

### 问题描述
构建报错：`Rollup failed to resolve import "@/services/api"`

### 解决方案

在 `vite.config.ts` 中添加路径别名：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'  // 必须导入

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // ...其他配置
})
```

### 配套 TypeScript 配置

在 `tsconfig.json` 中添加：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 四、常见构建错误及解决方案

### 错误 1：变量重复声明
**错误信息**：`Identifier 'projects' has already been declared`

**原因**：同一个文件中使用了相同的变量名

**解决**：
```typescript
// 错误 ❌
const projects = [...]           // 第1处
const projects = ref([...])      // 第2处 - 冲突！

// 正确 ✅
const builtInProjects = [...]    // 数据数组
const projects = ref(builtInProjects)  // 响应式引用
```

### 错误 2：路径别名无法解析
**错误信息**：`Rollup failed to resolve import "@/services/api"`

**原因**：Vite 未配置 `@/` 路径别名

**解决**：见上文「Vite 路径别名配置」

### 错误 3：找不到 frontend 目录
**错误信息**：`/bin/sh: 1: cd: can't cd to frontend`

**原因**：Cloudflare Pages 的 Root directory 设置错误

**解决**：
- 将 Root directory 设置为 `frontend`
- 或修改 Build command 为 `cd frontend && npm install && npx vite build`

---

## 五、部署前检查清单

### 1. 本地构建测试
```bash
cd frontend
npm install
npm run build
```

### 2. 检查路径别名
```bash
# 搜索所有使用 @/ 的导入
grep -r "from ['\"]@/" src/
```

### 3. 检查变量命名
```bash
# 检查是否有重复声明
grep -n "const projects" src/views/**/*.vue
```

### 4. 提交到 GitHub
```bash
git add -A
git commit -m "your message"
git push origin main
```

**重要**：Cloudflare Pages 从 GitHub 拉取代码，本地修改必须提交！

---

## 六、部署流程

1. **提交代码** → GitHub
2. **Cloudflare Pages 自动触发构建**（或手动点击 Deploy）
3. **查看构建日志** → 检查是否有错误
4. **构建成功** → 访问分配的域名

---

## 七、前后端分离部署说明

### 前端 (Cloudflare Pages)
- 自动部署：每次推送到 GitHub 自动触发
- 域名：`.pages.dev`

### 后端 (Render/Railway/其他)
- 需要单独部署
- 前端通过环境变量 `VITE_API_URL` 连接后端

**注意**：前端推送不会自动更新后端，后端需要单独部署流程。

---

## 八、最佳实践

1. **本地先构建成功** 再推送
2. **路径别名统一配置** vite + tsconfig
3. **变量命名规范** 避免重复声明
4. **及时提交代码** 避免本地和云端不一致
5. **查看构建日志** 定位问题

---

## 九、相关文件

- `vite.config.ts` - Vite 配置
- `tsconfig.json` - TypeScript 配置
- `package.json` - 依赖管理
- `.env` - 环境变量（不提交到 Git）

---

## 十、参考链接

- [Vite 路径别名配置](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
