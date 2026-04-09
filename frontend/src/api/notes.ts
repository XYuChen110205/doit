import { get, put, del } from './client'
import type { Note, UpsertNoteRequest } from '../types'

export async function getNoteByDate(date: string): Promise<Note | null> {
  try {
    return await get<Note>('/api/notes', { date })
  } catch {
    return null
  }
}

export async function getNotesList(limit: number = 30): Promise<Note[]> {
  try {
    return await get<Note[]>('/api/notes/list', { limit })
  } catch {
    return []
  }
}

export async function saveNote(noteDate: string, content: string): Promise<Note> {
  const data: UpsertNoteRequest = { note_date: noteDate, content }
  return put<Note>('/api/notes', data)
}

export async function deleteNote(noteDate: string): Promise<void> {
  await del(`/api/notes?date=${noteDate}`)
}
