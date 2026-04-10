import { supabase } from '../lib/supabase'
import type { Tag } from '../types'

// 获取当前用户 ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('未登录')
  }
  return user.id
}

export async function getTaskTags(taskId: string): Promise<Tag[]> {
  const { data: taskTags, error } = await supabase
    .from('task_tags')
    .select(`
      tags(id, name, color)
    `)
    .eq('task_id', taskId)
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (taskTags || []).map((tt: any) => ({
    id: tt.tags.id,
    name: tt.tags.name,
    color: tt.tags.color
  })) as Tag[]
}

export async function addTagToTask(taskId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('task_tags')
    .insert({
      task_id: taskId,
      tag_id: tagId
    })
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function removeTagFromTask(taskId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('task_tags')
    .delete()
    .eq('task_id', taskId)
    .eq('tag_id', tagId)
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function setTaskTags(taskId: string, tagIds: string[]): Promise<void> {
  // 1. 删除该任务的所有标签关联
  const { error: deleteError } = await supabase
    .from('task_tags')
    .delete()
    .eq('task_id', taskId)
  
  if (deleteError) {
    throw new Error(deleteError.message)
  }
  
  // 2. 如果没有新标签，直接返回
  if (tagIds.length === 0) {
    return
  }
  
  // 3. 批量插入新的标签关联
  const inserts = tagIds.map(tagId => ({
    task_id: taskId,
    tag_id: tagId
  }))
  
  const { error: insertError } = await supabase
    .from('task_tags')
    .insert(inserts)
  
  if (insertError) {
    throw new Error(insertError.message)
  }
}
