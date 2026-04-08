思路很好，但有个关键问题需要先想清楚：Trae 的 SOLO Coder 不认识我，它不会自动读我们之前的对话。所以我们需要给它一份**完整的项目规范文档**，作为它执行任务的"说明书"。

&#x20;

流程是这样的：

**我** → 写规范文档 + 拆分任务指令\
**你** → 把指令喂给 Trae，审核它的输出\
**Trae** → 执行代码编写

我现在先写一份项目规范文档，你把它保存为 `docs/PROJECT_SPEC.md` 放在项目里。之后每次给 Trae 下任务时，先让它读这个文件，再给具体指令。

**`docs/PROJECT_SPEC.md`**

```
# Todo System 项目规范

## 一、项目概述
个人每日任务管理与生活记录工具。单用户，桌面优先，移动端适配。

## 二、技术栈
- 后端：FastAPI (Python 3.13) + SQLite + databases + aiosqlite
- 前端：Vue 3 + TypeScript + Vite + Axios + Vue Router 4
- 运行端口：后端 8000，前端 5174
- 包管理：pip (backend/venv)，npm (frontend)

## 三、项目结构

```

todo-system/\
├── backend/\
│ ├── app/\
│ │ ├── **init**.py\
│ │ ├── [main.py](http://main.py/) # FastAPI 入口\
│ │ ├── [database.py](http://database.py/) # 数据库连接与表定义\
│ │ ├── [response.py](http://response.py/) # 统一返回格式\
│ │ ├── routers/ # 路由层（接收请求，调用 service，返回响应）\
│ │ │ ├── [tasks.py](http://tasks.py/) ✅ 已完成\
│ │ │ ├── [notes.py](http://notes.py/)\
│ │ │ ├── [inbox.py](http://inbox.py/)\
│ │ │ ├── [stats.py](http://stats.py/)\
│ │ │ └── [tags.py](http://tags.py/)\
│ │ └── services/ # 业务逻辑层（数据库操作）\
│ │ ├── task\_service.py ✅ 已完成\
│ │ ├── note\_service.py\
│ │ ├── inbox\_service.py\
│ │ ├── stats\_service.py\
│ │ └── tag\_service.py\
│ ├── tests/\
│ ├── uploads/ # 笔记附件存储\
│ ├── todo.db # SQLite 数据库文件\
│ ├── requirements.txt\
│ └── venv/\
├── frontend/\
│ └── src/\
│ ├── api/\
│ │ └── client.ts ✅ 已完成（baseURL: [http://localhost:8000](http://localhost:8000/)）\
│ ├── views/\
│ ├── components/\
│ ├── styles/\
│ ├── types/\
│ └── router/\
└── docs/

````

## 四、统一返回格式
所有接口返回：
```json
{ "code": 200, "message": "ok", "data": <object|array|null> }

````

错误时 code 为 400/404/500，data 为 null。\
使用 `app/response.py` 中的 `success()` 和 `error()` 函数。

## 五、数据库（SQLite，6 张表）

已在 `database.py` 中定义，使用 SQLAlchemy 的 Table 对象 + databases 异步库。\
时间字段用 TEXT 存储（格式 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS）。

### tasks 表

列

类型

说明

id

INTEGER PK

自增

title

VARCHAR(500)

必填

detail

TEXT

默认空

task\_type

VARCHAR(20)

默认 ‘todo’

status

VARCHAR(20)

‘pending’ / ‘done’ / ‘cancelled’

priority

INTEGER

0=普通, 1=紧急

due\_date

VARCHAR(10)

YYYY-MM-DD

start\_time

VARCHAR(19)

YYYY-MM-DD HH:MM:SS

end\_time

VARCHAR(19)

YYYY-MM-DD HH:MM:SS

source

VARCHAR(20)

‘direct’ / ‘inbox’

created\_at

VARCHAR(19)

自动填充

completed\_at

VARCHAR(19)

标记 done 时自动填充

archived

BOOLEAN

默认 false

### notes 表

列

类型

说明

id

INTEGER PK

自增

content

TEXT

Markdown 内容

note\_date

VARCHAR(10)

所属日期，唯一

created\_at

VARCHAR(19)

<br />

updated\_at

VARCHAR(19)

<br />

### inbox 表

列

类型

说明

id

INTEGER PK

自增

content

TEXT

必填

created\_at

VARCHAR(19)

<br />

### tags 表

列

类型

说明

id

INTEGER PK

自增

name

VARCHAR(50)

唯一

color

VARCHAR(7)

默认 #2C7A92

### task\_tags 表

列

类型

task\_id

FK → [tasks.id](http://tasks.id/), CASCADE

tag\_id

FK → [tags.id](http://tags.id/), CASCADE

### attachments 表

列

类型

说明

id

INTEGER PK

自增

note\_id

FK → [notes.id](http://notes.id/), CASCADE

<br />

file\_path

VARCHAR(500)

服务器路径

file\_name

VARCHAR(200)

原始文件名

created\_at

VARCHAR(19)

<br />

## 六、API 接口清单

### Tasks（✅ 已完成）

- T1: POST /api/tasks — 创建任务
- T2: GET /api/tasks?date=YYYY-MM-DD — 按日期查询
- T3: PATCH /api/tasks/{id} — 更新任务
- T4: DELETE /api/tasks/{id} — 删除任务
- T5: GET /api/tasks?start\_date=\&end\_date= — 按范围查询（Phase 2）

### Notes（待实现）

- N1: GET /api/notes?date=YYYY-MM-DD — 获取某日笔记
- N2: PUT /api/notes — 创建或更新笔记（upsert，body: {note\_date, content}）
- N3: POST /api/notes/{note\_id}/attachments — 上传图片（multipart）
- N4: DELETE /api/notes/{note\_id}/attachments/{attachment\_id} — 删除图片

### Inbox（待实现）

- I1: POST /api/inbox — 快速添加
- I2: GET /api/inbox — 列出全部
- I3: POST /api/inbox/{id}/convert — 转为任务（事务性：创建任务+删除收集箱条目）
- I4: DELETE /api/inbox/{id} — 删除

### Stats（Phase 2）

- S1: GET /api/stats?type=week|month\&date=YYYY-MM-DD

### Tags（Phase 3）

- G1: GET /api/tags
- G2: POST /api/tags
- G3: DELETE /api/tags/{id}

## 七、代码规范

1. **路由层**只做：参数校验 → 调用 service → 返回 success/error。不写业务逻辑。
2. **服务层**只做：数据库 CRUD + 业务规则。不感知 HTTP。
3. 每个新接口必须在路由文件创建后，到 `main.py` 用 `app.include_router()` 注册。
4. 前端 API 调用统一走 `src/api/client.ts`，每个模块单独文件（tasks.ts, notes.ts 等）。
5. 前端类型定义放 `src/types/index.ts`。

## 八、设计规范（Design Tokens）

- 背景：#F7FAFB（主）、#FFFFFF（卡片）、#EDF2F4（hover）
- 文字：#1B2A3D（主）、#6B7D8E（次）、#A0B0BE（辅助）
- 强调色：#2C7A92（主操作）、#C4553A（紧急/逾期）、#3A8A6E（已完成）
- 圆角：卡片 12px、按钮 8px、标签 4px
- 间距：8px 网格，页面 24px，卡片内 16px
- 字体：16px 标题(600)、14px 正文(400)、12px 辅助(400)
- 删除操作用 Undo Toast（3秒），不用确认弹窗
- 已完成任务：删除线 + 灰色文字

## 九、页面结构

1. **Today**（P0）— 左栏任务列表 + 右栏笔记编辑器
2. **Inbox**（P0）— 快速输入 + 列表 + 转任务/删除
3. **Calendar**（P1）— 周/月视图
4. **Stats**（P2）— 完成数、完成率、每日柱状图、标签分布
5. **Settings**（P3）— 标签管理、深色模式

