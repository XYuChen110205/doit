import { get, post, patch, del } from './client'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types'

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  return post<Task>('/api/tasks', data)
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  return get<Task[]>('/api/tasks', { date })
}

export async function getTasksByRange(startDate: string, endDate: string): Promise<Task[]> {
  return get<Task[]>('/api/tasks', { start_date: startDate, end_date: endDate })
}

export async function updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
  return patch<Task>(`/api/tasks/${id}`, data)
}

export async function deleteTask(id: number): Promise<void> {
  return del<void>(`/api/tasks/${id}`)
}
