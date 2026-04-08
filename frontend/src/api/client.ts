import axios from 'axios'
import type { ApiResponse } from '../types'

const client = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await client.get<ApiResponse<T>>(url, { params })
  if (response.data.code !== 200) {
    throw new Error(response.data.message)
  }
  return response.data.data
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await client.post<ApiResponse<T>>(url, data)
  if (response.data.code !== 200) {
    throw new Error(response.data.message)
  }
  return response.data.data
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await client.put<ApiResponse<T>>(url, data)
  if (response.data.code !== 200) {
    throw new Error(response.data.message)
  }
  return response.data.data
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const response = await client.patch<ApiResponse<T>>(url, data)
  if (response.data.code !== 200) {
    throw new Error(response.data.message)
  }
  return response.data.data
}

export async function del<T>(url: string): Promise<T> {
  const response = await client.delete<ApiResponse<T>>(url)
  if (response.data.code !== 200) {
    throw new Error(response.data.message)
  }
  return response.data.data
}

export default client
