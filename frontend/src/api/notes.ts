import { supabase } from '../lib/supabase'
import type { Note, UpsertNoteRequest } from '../types'

// 获取当前用户 ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('未登录')
  }
  return user.id
}

export async function getNoteByDate(date: string): Promise<Note | null> {
  const userId = await getCurrentUserId()
  
  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('note_date', date)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // 没有找到记录
      return null
    }
    throw new Error(error.message)
  }
  
  return note as Note
}

export async function getNotesList(limit: number = 30): Promise<Note[]> {
  const userId = await getCurrentUserId()
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('note_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (notes || []) as Note[]
}

export async function saveNote(noteDate: string, content: string): Promise<Note> {
  const userId = await getCurrentUserId()
  
  // 先检查是否存在
  const { data: existingNote } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)
    .eq('note_date', noteDate)
    .single()
  
  if (existingNote) {
    // 更新
    const { data: note, error } = await supabase
      .from('notes')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingNote.id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return note as Note
  } else {
    // 新建
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        note_date: noteDate,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return note as Note
  }
}

export async function createNote(data: UpsertNoteRequest): Promise<Note> {
  return saveNote(data.note_date, data.content)
}

export async function updateNote(id: string, data: Partial<Note>): Promise<Note> {
  const userId = await getCurrentUserId()
  
  const { data: note, error } = await supabase
    .from('notes')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return note as Note
}

export async function deleteNote(noteDate: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', userId)
    .eq('note_date', noteDate)
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteNoteById(id: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
}
