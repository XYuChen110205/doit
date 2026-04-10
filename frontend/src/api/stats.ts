import { supabase } from '../lib/supabase'
import type { StatsData } from '../types'

// 获取当前用户 ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('未登录')
  }
  return user.id
}

export async function getStats(type: 'week' | 'month', date: string): Promise<StatsData> {
  const userId = await getCurrentUserId()
  
  // 获取所有任务
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
  
  const allTasks = tasks || []
  
  // 计算统计数据
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((t: any) => t.status === 'done').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  // 计算日期范围
  const targetDate = new Date(date)
  const startDate = new Date(targetDate)
  const endDate = new Date(targetDate)
  
  if (type === 'week') {
    // 获取本周的开始（周日）和结束（周六）
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek))
  } else {
    // 获取本月的开始和结束
    startDate.setDate(1)
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(0)
  }
  
  // 生成每日统计
  const dailyStats: { date: string; completed: number; total: number }[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayTasks = allTasks.filter((t: any) => t.due_date === dateStr)
    const dayCompleted = dayTasks.filter((t: any) => t.status === 'done').length
    
    dailyStats.push({
      date: dateStr,
      completed: dayCompleted,
      total: dayTasks.length
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // 获取标签分布
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
  
  if (tagsError) {
    throw new Error(tagsError.message)
  }
  
  // 获取任务-标签关联
  const { data: taskTags, error: taskTagsError } = await supabase
    .from('task_tags')
    .select('task_id, tag_id')
    .in('task_id', allTasks.map((t: any) => t.id))
  
  if (taskTagsError) {
    throw new Error(taskTagsError.message)
  }
  
  // 计算标签分布
  const tagCount: Record<string, number> = {}
  taskTags?.forEach((tt: any) => {
    tagCount[tt.tag_id] = (tagCount[tt.tag_id] || 0) + 1
  })
  
  const tagDistribution = (tags || []).map((tag: any) => ({
    tag_id: tag.id,
    tag_name: tag.name,
    count: tagCount[tag.id] || 0
  })).filter((t: any) => t.count > 0)
  
  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    completion_rate: completionRate,
    daily_stats: dailyStats,
    tag_distribution: tagDistribution
  }
}

// 获取简单的统计数字
export async function getSimpleStats(): Promise<{
  total: number
  completed: number
  pending: number
  todayCompleted: number
}> {
  const userId = await getCurrentUserId()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
  
  const allTasks = tasks || []
  const completed = allTasks.filter((t: any) => t.status === 'done').length
  const todayCompleted = allTasks.filter((t: any) => 
    t.status === 'done' && t.completed_at?.startsWith(today)
  ).length
  
  return {
    total: allTasks.length,
    completed,
    pending: allTasks.length - completed,
    todayCompleted
  }
}
