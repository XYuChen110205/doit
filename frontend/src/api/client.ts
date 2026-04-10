import axios from 'axios'
import type { ApiResponse } from '../types'

// 根据环境选择 API 地址
const API_BASE_URL = 'https://doit-api-omega.vercel.app'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理 401 错误
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除登录状态
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 可以在这里触发跳转登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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
