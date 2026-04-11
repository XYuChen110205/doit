import { supabase } from '../lib/supabase'
import type { InboxItem } from '../types'
import { createTask } from './tasks'

// 获取当前用户 ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('未登录')
  }
  return user.id
}

export async function createInbox(content: string): Promise<InboxItem> {
  const userId = await getCurrentUserId()
  
  const { data: item, error } = await supabase
    .from('inbox')
    .insert({
      user_id: userId,
      content,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    id: item.id,
    content: item.content,
    created_at: item.created_at
  } as InboxItem
}

export async function listInbox(): Promise<InboxItem[]> {
  const userId = await getCurrentUserId()
  
  const { data: items, error } = await supabase
    .from('inbox')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (items || []).map(item => ({
    id: item.id,
    content: item.content,
    created_at: item.created_at
  })) as InboxItem[]
}

export async function convertInbox(id: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  // 1. 获取 inbox 内容
  const { data: inboxItem, error: fetchError } = await supabase
    .from('inbox')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  
  if (fetchError) {
    throw new Error(fetchError.message)
  }
  
  if (!inboxItem) {
    throw new Error('收集箱条目不存在')
  }
  
  // 2. 创建任务
  await createTask({
    title: inboxItem.content,
    detail: '',
    source: 'inbox',
    task_type: 'todo',
    priority: 0
  })
  
  // 3. 删除 inbox 条目
  const { error: deleteError } = await supabase
    .from('inbox')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  
  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

export async function deleteInbox(id: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('inbox')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function createInboxItem(content: string): Promise<InboxItem> {
  return createInbox(content)
}

export async function getInboxItems(): Promise<InboxItem[]> {
  return listInbox()
}

export async function deleteInboxItem(id: string): Promise<void> {
  return deleteInbox(id)
}

// 别名导出，兼容旧代码
export { listInbox as listInboxItems }

export async function convertToTask(inboxId: string, taskData?: { title?: string; detail?: string; priority?: number }): Promise<void> {
  const userId = await getCurrentUserId()
  
  // 1. 获取 inbox 内容
  const { data: inboxItem, error: fetchError } = await supabase
    .from('inbox')
    .select('*')
    .eq('id', inboxId)
    .eq('user_id', userId)
    .single()
  
  if (fetchError) {
    throw new Error(fetchError.message)
  }
  
  if (!inboxItem) {
    throw new Error('收集箱条目不存在')
  }
  
  // 2. 创建任务（使用传入的数据或默认值）
  await createTask({
    title: taskData?.title || inboxItem.content,
    detail: taskData?.detail || '',
    source: 'inbox',
    task_type: 'todo',
    priority: taskData?.priority || 0
  })
  
  // 3. 删除 inbox 条目
  const { error: deleteError } = await supabase
    .from('inbox')
    .delete()
    .eq('id', inboxId)
    .eq('user_id', userId)
  
  if (deleteError) {
    throw new Error(deleteError.message)
  }
}
