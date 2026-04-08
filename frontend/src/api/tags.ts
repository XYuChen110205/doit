import { get, post, del } from './client'
import type { Tag } from '../types'

export async function listTags(): Promise<Tag[]> {
  return get<Tag[]>('/api/tags')
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  return post<Tag>('/api/tags', { name, color })
}

export async function deleteTag(id: number): Promise<void> {
  return del<void>(`/api/tags/${id}`)
}
