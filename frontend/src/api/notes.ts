import { get, put } from './client'
import type { Note, UpsertNoteRequest } from '../types'

export async function getNoteByDate(date: string): Promise<Note | null> {
  try {
    return await get<Note>('/api/notes', { date })
  } catch {
    return null
  }
}

export async function saveNote(noteDate: string, content: string): Promise<Note> {
  const data: UpsertNoteRequest = { note_date: noteDate, content }
  return put<Note>('/api/notes', data)
}
