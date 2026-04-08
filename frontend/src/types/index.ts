// Task 任务类型
export interface Task {
  id: number
  title: string
  detail: string
  task_type: 'todo' | 'habit' | 'deadline'
  status: 'pending' | 'done' | 'cancelled'
  priority: 0 | 1
  due_date: string | null
  start_time: string | null
  end_time: string | null
  source: 'direct' | 'inbox'
  created_at: string
  completed_at: string | null
  archived: boolean
  tags?: Tag[]
}

// Note 笔记类型
export interface Note {
  id: number
  content: string
  note_date: string
  created_at: string
  updated_at: string
}

// InboxItem 收集箱条目类型
export interface InboxItem {
  id: number
  content: string
  created_at: string
}

// Tag 标签类型
export interface Tag {
  id: number
  name: string
  color: string
}

// Attachment 附件类型
export interface Attachment {
  id: number
  note_id: number
  file_path: string
  file_name: string
  created_at: string
}

// API 统一返回格式
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 创建任务请求体
export interface CreateTaskRequest {
  title: string
  detail?: string
  task_type?: 'todo' | 'habit' | 'deadline'
  priority?: 0 | 1
  due_date?: string
  start_time?: string
  end_time?: string
  source?: 'direct' | 'inbox'
}

// 更新任务请求体
export interface UpdateTaskRequest {
  title?: string
  detail?: string
  task_type?: 'todo' | 'habit' | 'deadline'
  status?: 'pending' | 'done' | 'cancelled'
  priority?: 0 | 1
  due_date?: string | null
  start_time?: string | null
  end_time?: string | null
}

// 创建/更新笔记请求体
export interface UpsertNoteRequest {
  note_date: string
  content: string
}

// 创建收集箱条目请求体
export interface CreateInboxItemRequest {
  content: string
}

// 统计数据类型
export interface StatsData {
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  daily_stats: {
    date: string
    completed: number
    total: number
  }[]
  tag_distribution: {
    tag_id: number
    tag_name: string
    count: number
  }[]
}
