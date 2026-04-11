import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, LoginRequest, RegisterRequest } from '../api/auth'
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const username = computed(() => user.value?.username || '')

  // Actions
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiLogin(credentials)
      user.value = response.user
      
      // 保存用户信息到 localStorage
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return true
    } catch (err: any) {
      error.value = err.message || '登录失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await apiRegister(data)
      // 注册成功不自动登录，返回提示信息
      return result
    } catch (err: any) {
      error.value = err.message || '注册失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserInfo() {
    try {
      const userData = await getCurrentUser()
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (err: any) {
      // 获取用户信息失败，清除登录状态
      error.value = err.message || '获取用户信息失败'
      logout()
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch (err) {
      // 即使登出 API 失败，也清除本地状态
      console.error('Logout error:', err)
    }
    
    user.value = null
    localStorage.removeItem('user')
  }

  function init() {
    // 从 localStorage 恢复登录状态
    const savedUser = localStorage.getItem('user')
    const isLocalTestUser = localStorage.getItem('isLocalTestUser')
    
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      
      // 如果是本地测试用户，跳过 Supabase 验证
      if (isLocalTestUser === 'true') {
        console.log('本地测试用户，跳过 Supabase 验证')
        return
      }
      
      // 验证 session 是否有效（仅对 Supabase 用户）
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Session 有效，刷新用户信息
          fetchUserInfo()
        } else {
          // Session 已过期，清除登录状态
          logout()
        }
      })
    }
    
    // 监听认证状态变化（仅对 Supabase 用户）
    if (!isLocalTestUser) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          user.value = null
          localStorage.removeItem('user')
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // 登录或 token 刷新时，刷新用户信息
          fetchUserInfo()
        }
      })
    }
  }

  return {
    user,
    isLoading,
    error,
    isLoggedIn,
    username,
    login,
    register,
    fetchUserInfo,
    logout,
    init
  }
})
