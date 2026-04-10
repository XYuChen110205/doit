import { supabase } from '../lib/supabase'
import type { Task, CreateTaskRequest, UpdateTaskRequest, Tag } from '../types'

// 获取当前用户 ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('未登录')
  }
  return user.id
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const userId = await getCurrentUserId()
  
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: data.title,
      detail: data.detail || '',
      task_type: data.task_type || 'todo',
      priority: data.priority || 0,
      due_date: data.due_date || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      source: data.source || 'direct',
      status: 'pending',
      archived: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    ...task,
    id: task.id,
    tags: []
  } as Task
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  const userId = await getCurrentUserId()
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_tags(
        tag_id,
        tags(id, name, color)
      )
    `)
    .eq('user_id', userId)
    .eq('due_date', date)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (tasks || []).map(task => ({
    ...task,
    id: task.id,
    tags: task.task_tags?.map((tt: any) => tt.tags) || []
  })) as Task[]
}

export async function getTasksByRange(startDate: string, endDate: string): Promise<Task[]> {
  const userId = await getCurrentUserId()
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_tags(
        tag_id,
        tags(id, name, color)
      )
    `)
    .eq('user_id', userId)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (tasks || []).map(task => ({
    ...task,
    id: task.id,
    tags: task.task_tags?.map((tt: any) => tt.tags) || []
  })) as Task[]
}

export async function getAllTasks(filters?: { status?: string; archived?: boolean }): Promise<Task[]> {
  const userId = await getCurrentUserId()
  
  let query = supabase
    .from('tasks')
    .select(`
      *,
      task_tags(
        tag_id,
        tags(id, name, color)
      )
    `)
    .eq('user_id', userId)
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.archived !== undefined) {
    query = query.eq('archived', filters.archived)
  }
  
  const { data: tasks, error } = await query
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (tasks || []).map(task => ({
    ...task,
    id: task.id,
    tags: task.task_tags?.map((tt: any) => tt.tags) || []
  })) as Task[]
}

export async function updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
  const userId = await getCurrentUserId()
  
  const updateData: any = {
    ...data,
    updated_at: new Date().toISOString()
  }
  
  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    ...task,
    id: task.id,
    tags: []
  } as Task
}

export async function deleteTask(id: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function completeTask(id: string): Promise<Task> {
  return updateTask(id, {
    status: 'done',
    completed_at: new Date().toISOString()
  })
}

export async function archiveTask(id: string): Promise<Task> {
  return updateTask(id, {
    archived: true
  })
}

export async function unarchiveTask(id: string): Promise<Task> {
  return updateTask(id, {
    archived: false
  })
}
