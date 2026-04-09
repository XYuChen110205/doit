<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <span class="logo">✦</span>
        <h1>Do It</h1>
        <p>个人任务管理系统</p>
      </div>

      <div class="login-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: isLogin }"
          @click="isLogin = true"
        >
          登录
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: !isLogin }"
          @click="isLogin = false"
        >
          注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="isLogin" class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="loginForm.username" 
            type="text" 
            placeholder="请输入用户名"
            required
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            required
          />
        </div>
        <div v-if="userStore.error" class="error-message">
          {{ userStore.error }}
        </div>
        <button 
          type="submit" 
          class="submit-btn"
          :disabled="userStore.isLoading"
        >
          {{ userStore.isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-else class="login-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="registerForm.username" 
            type="text" 
            placeholder="请输入用户名"
            required
          />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input 
            v-model="registerForm.email" 
            type="email" 
            placeholder="请输入邮箱"
            required
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请输入密码（至少6位）"
            required
            minlength="6"
          />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            required
          />
        </div>
        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>
        <div v-else-if="userStore.error" class="error-message">
          {{ userStore.error }}
        </div>
        <button 
          type="submit" 
          class="submit-btn"
          :disabled="userStore.isLoading"
        >
          {{ userStore.isLoading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="login-footer">
        <p>登录后即可在多设备同步数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const passwordError = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function handleLogin() {
  const success = await userStore.login({
    username: loginForm.username,
    password: loginForm.password
  })
  
  if (success) {
    router.push('/')
  }
}

async function handleRegister() {
  passwordError.value = ''
  
  if (registerForm.password !== registerForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  if (registerForm.password.length < 6) {
    passwordError.value = '密码长度至少6位'
    return
  }
  
  const success = await userStore.register({
    username: registerForm.username,
    email: registerForm.email,
    password: registerForm.password
  })
  
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  padding: var(--space-4);
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-float);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.logo {
  font-size: 48px;
  display: block;
  margin-bottom: var(--space-3);
}

.login-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.login-header p {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.login-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  background: var(--bg-secondary);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.tab-btn {
  flex: 1;
  padding: var(--space-3);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: white;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.form-group input {
  padding: var(--space-3);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition-normal);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.error-message {
  padding: var(--space-3);
  background: rgba(229, 115, 115, 0.1);
  border-radius: var(--radius-md);
  color: var(--accent-danger);
  font-size: var(--font-size-sm);
}

.submit-btn {
  padding: var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
  margin-top: var(--space-2);
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: var(--space-6);
  text-align: center;
}

.login-footer p {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
