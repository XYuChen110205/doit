// ⚠️ 此文件已废弃
// 课程表功能已改为本地存储模式，不再调用外部 API
// 保留文件是为了兼容现有 import，但所有 HTTP 请求都已禁用

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

// 从 localStorage 读取课程数据
function getCoursesFromStorage(): Course[] {
  const data = localStorage.getItem('student_courses_v3')
  return data ? JSON.parse(data) : []
}

// 保存课程数据到 localStorage
function saveCoursesToStorage(courses: Course[]) {
  localStorage.setItem('student_courses_v3', JSON.stringify(courses))
}

// 从 localStorage 读取设置
function getSettingsFromStorage(): ScheduleSettings {
  const data = localStorage.getItem('schedule_settings_v2')
  return data ? JSON.parse(data) : {
    background: '',
    background_opacity: 0.15,
    table_opacity: 0.95,
    bg_position_x: 50,
    bg_position_y: 50,
    bg_scale: 100,
    notification_enabled: false
  }
}

// 保存设置到 localStorage
function saveSettingsToStorage(settings: ScheduleSettings) {
  localStorage.setItem('schedule_settings_v2', JSON.stringify(settings))
}

// 生成唯一 ID
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000)
}

// 课程 API - 本地存储版本
export const courseApi = {
  // 获取课程列表
  getCourses(term?: string): Promise<Course[]> {
    const courses = getCoursesFromStorage()
    if (term) {
      return Promise.resolve(courses.filter(c => c.term === term))
    }
    return Promise.resolve(courses)
  },

  // 创建课程
  createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const courses = getCoursesFromStorage()
    const newCourse: Course = {
      ...course,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    courses.push(newCourse)
    saveCoursesToStorage(courses)
    return Promise.resolve(newCourse)
  },

  // 更新课程
  updateCourse(id: number, course: Partial<Course>): Promise<Course> {
    const courses = getCoursesFromStorage()
    const index = courses.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error('课程不存在')
    }
    courses[index] = {
      ...courses[index],
      ...course,
      updated_at: new Date().toISOString()
    }
    saveCoursesToStorage(courses)
    return Promise.resolve(courses[index])
  },

  // 删除课程
  deleteCourse(id: number): Promise<void> {
    const courses = getCoursesFromStorage()
    const filtered = courses.filter(c => c.id !== id)
    saveCoursesToStorage(filtered)
    return Promise.resolve()
  },
}

// 课程表设置 API - 本地存储版本
export const scheduleSettingsApi = {
  // 获取设置
  getSettings(): Promise<ScheduleSettings> {
    return Promise.resolve(getSettingsFromStorage())
  },

  // 更新设置
  updateSettings(settings: ScheduleSettings): Promise<ScheduleSettings> {
    saveSettingsToStorage(settings)
    return Promise.resolve(settings)
  },
}
