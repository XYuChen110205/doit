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

export async function listTags(): Promise<Tag[]> {
  const userId = await getCurrentUserId()
  
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (tags || []).map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color
  })) as Tag[]
}

export async function getTags(): Promise<Tag[]> {
  return listTags()
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const userId = await getCurrentUserId()
  
  const { data: tag, error } = await supabase
    .from('tags')
    .insert({
      user_id: userId,
      name,
      color: color || '#2C7A92',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color
  } as Tag
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
  const userId = await getCurrentUserId()
  
  const { data: tag, error } = await supabase
    .from('tags')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color
  } as Tag
}

export async function deleteTag(id: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
}
