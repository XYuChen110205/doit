// API 服务 - 课程表相关接口
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 课程接口
export interface Course {
  id: number
  name: string
  code: string
  hours: number
  day: string
  period: number
  weeks: string
  room: string
  teacher: string
  target: string
  color: string
  term: string
  created_at?: string
  updated_at?: string
}

// 课程表设置接口
export interface ScheduleSettings {
  background: string
  background_opacity: number
  table_opacity: number
  bg_position_x: number
  bg_position_y: number
  bg_scale: number
  notification_enabled: boolean
}

// 统一请求封装
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(error.message || '请求失败')
  }

  const data = await response.json()
  return data.data || data
}

// 课程 API
export const courseApi = {
  // 获取课程列表
  getCourses(term?: string): Promise<Course[]> {
    const query = term ? `?term=${term}` : ''
    return request(`/api/courses${query}`)
  },

  // 创建课程
  createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    return request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    })
  },

  // 更新课程
  updateCourse(id: number, course: Partial<Course>): Promise<Course> {
    return request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(course),
    })
  },

  // 删除课程
  deleteCourse(id: number): Promise<void> {
    return request(`/api/courses/${id}`, {
      method: 'DELETE',
    })
  },
}

// 课程表设置 API
export const scheduleSettingsApi = {
  // 获取设置
  getSettings(): Promise<ScheduleSettings> {
    return request('/api/courses/settings/default')
  },

  // 更新设置
  updateSettings(settings: ScheduleSettings): Promise<ScheduleSettings> {
    return request('/api/courses/settings/default', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },
}
