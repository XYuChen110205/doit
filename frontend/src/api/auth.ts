import client from './client'

export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// 登录
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await client.post('/api/auth/login', data)
  return response.data
}

// 注册
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await client.post('/api/auth/register', data)
  return response.data
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<User> {
  const response = await client.get('/api/auth/me')
  return response.data
}

// 更新用户信息
export async function updateUser(data: Partial<User>): Promise<User> {
  const response = await client.put('/api/auth/me', data)
  return response.data
}

// 修改密码
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await client.post('/api/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword
  })
}
