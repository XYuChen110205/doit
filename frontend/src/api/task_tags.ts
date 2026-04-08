import { get, post, del } from './client'
import type { Tag } from '../types'

export async function getTaskTags(taskId: number): Promise<Tag[]> {
  return get<Tag[]>(`/api/tasks/${taskId}/tags`)
}

export async function addTagToTask(taskId: number, tagId: number): Promise<void> {
  return post<void>(`/api/tasks/${taskId}/tags`, { tag_id: tagId })
}

export async function removeTagFromTask(taskId: number, tagId: number): Promise<void> {
  return del<void>(`/api/tasks/${taskId}/tags/${tagId}`)
}
