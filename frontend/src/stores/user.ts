import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, RegisterRequest } from '../api/auth'
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const username = computed(() => user.value?.username || '')

  // Actions
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiLogin(credentials)
      token.value = response.access_token
      user.value = response.user
      
      // 保存 token 到 localStorage
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || '登录失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiRegister(data)
      token.value = response.access_token
      user.value = response.user
      
      // 保存 token 到 localStorage
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || '注册失败'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return
    
    try {
      const userData = await getCurrentUser()
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (err) {
      // Token 可能过期了，清除登录状态
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function init() {
    // 从 localStorage 恢复登录状态
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      // 验证 token 是否有效
      fetchUserInfo()
    }
  }

  return {
    user,
    token,
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
