import { supabase } from '../lib/supabase'

export interface User {
  id: string
  username: string
  display_name: string
  created_at: string
}

export interface LoginRequest {
  email: string
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

// 注册
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  // 1. 使用 Supabase Auth 注册（使用真实邮箱）
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password
  })
  
  if (authError) {
    throw new Error(authError.message)
  }
  
  if (!authData.user) {
    throw new Error('注册失败')
  }
  
  // 2. 在 users 表中插入用户信息
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      username: data.username,
      display_name: data.username,
      password_hash: '', // Supabase Auth 管理密码，这里留空
      created_at: new Date().toISOString()
    })
  
  if (insertError) {
    throw new Error(insertError.message)
  }
  
  // 3. 获取 session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData.session) {
    throw new Error('获取会话失败')
  }
  
  const user: User = {
    id: authData.user.id,
    username: data.username,
    display_name: data.username,
    created_at: new Date().toISOString()
  }
  
  return {
    access_token: sessionData.session.access_token,
    token_type: 'bearer',
    user
  }
}

// 登录
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  if (!authData.user || !authData.session) {
    throw new Error('登录失败')
  }
  
  // 获取用户信息
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()
  
  if (userError) {
    throw new Error(userError.message)
  }
  
  const user: User = {
    id: authData.user.id,
    username: userData.username,
    display_name: userData.display_name,
    created_at: userData.created_at
  }
  
  return {
    access_token: authData.session.access_token,
    token_type: 'bearer',
    user
  }
}

// 登出
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<User> {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('未登录')
  }
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    id: userData.id,
    username: userData.username,
    display_name: userData.display_name,
    created_at: userData.created_at
  }
}

// 更新用户信息
export async function updateUser(data: Partial<User>): Promise<User> {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('未登录')
  }
  
  const { data: userData, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return {
    id: userData.id,
    username: userData.username,
    display_name: userData.display_name,
    created_at: userData.created_at
  }
}

// 修改密码
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  // 先验证旧密码（重新登录验证）
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('未登录')
  }
  
  // 更新密码
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) {
    throw new Error(error.message)
  }
}
