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

// 从 email 提取用户名（@前面部分）
function extractUsernameFromEmail(email: string): string {
  return email.split('@')[0]
}

// 注册
export async function register(data: RegisterRequest): Promise<{ message: string }> {
  // 使用 Supabase Auth 注册（使用真实邮箱）
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
  
  // 注册成功，返回提示信息（不立即创建 users 记录）
  return {
    message: '注册成功！请查收邮箱确认链接，确认后即可登录。'
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
  
  const uid = authData.user.id
  const email = authData.user.email || ''
  
  // 检查 users 表是否有该用户的记录
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single()
  
  let user: User
  
  if (userError && userError.code === 'PGRST116') {
    // 没有找到记录，首次登录，自动创建 users 记录
    const username = extractUsernameFromEmail(email)
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: uid,
        username: username,
        display_name: username,
        password_hash: '', // Supabase Auth 管理密码，这里留空
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      throw new Error(insertError.message)
    }
    
    user = {
      id: newUser.id,
      username: newUser.username,
      display_name: newUser.display_name,
      created_at: newUser.created_at
    }
  } else if (userError) {
    throw new Error(userError.message)
  } else {
    // 找到记录
    user = {
      id: userData.id,
      username: userData.username,
      display_name: userData.display_name,
      created_at: userData.created_at
    }
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
