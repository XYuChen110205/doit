import { get, post, del } from './client'
import type { InboxItem } from '../types'

export async function createInbox(content: string): Promise<InboxItem> {
  return post<InboxItem>('/api/inbox', { content })
}

export async function listInbox(): Promise<InboxItem[]> {
  return get<InboxItem[]>('/api/inbox')
}

export async function convertInbox(id: number): Promise<void> {
  return post<void>(`/api/inbox/${id}/convert`)
}

export async function deleteInbox(id: number): Promise<void> {
  return del<void>(`/api/inbox/${id}`)
}
