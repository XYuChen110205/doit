<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <SvgIcon name="Sparkle" :size="48" class="logo" />
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
          <label>邮箱</label>
          <input 
            v-model="loginForm.email" 
            type="email" 
            placeholder="请输入邮箱"
            required
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <div class="password-input">
            <input 
              v-model="loginForm.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="请输入密码"
              required
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <SvgIcon :name="showPassword ? 'EyeOff' : 'Eye'" :size="18" />
            </button>
          </div>
        </div>
        <div v-if="userStore.error" class="error-message">
          <SvgIcon name="Alert" :size="16" />
          {{ userStore.error }}
        </div>
        <button 
          type="submit" 
          class="submit-btn"
          :disabled="userStore.isLoading"
        >
          <SvgIcon v-if="userStore.isLoading" name="Loading" :size="16" />
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
          <div class="password-input">
            <input 
              v-model="registerForm.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="请输入密码（至少6位）"
              required
              minlength="6"
              @input="validatePassword"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <SvgIcon :name="showPassword ? 'EyeOff' : 'Eye'" :size="18" />
            </button>
          </div>
          <div class="password-strength" v-if="registerForm.password">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :class="passwordStrength"
                :style="{ width: passwordStrengthWidth }"
              ></div>
            </div>
            <span class="strength-text">{{ passwordStrengthText }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <div class="password-input">
            <input 
              v-model="registerForm.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              placeholder="请再次输入密码"
              required
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <SvgIcon :name="showConfirmPassword ? 'EyeOff' : 'Eye'" :size="18" />
            </button>
          </div>
          <div v-if="passwordMatchError" class="field-error">
            <SvgIcon name="Alert" :size="14" />
            {{ passwordMatchError }}
          </div>
        </div>
        <div v-if="passwordError" class="error-message">
          <SvgIcon name="Alert" :size="16" />
          {{ passwordError }}
        </div>
        <div v-else-if="userStore.error" class="error-message">
          <SvgIcon name="Alert" :size="16" />
          {{ userStore.error }}
        </div>
        <button 
          type="submit" 
          class="submit-btn"
          :disabled="userStore.isLoading || !isFormValid"
        >
          <SvgIcon v-if="userStore.isLoading" name="Loading" :size="16" />
          {{ userStore.isLoading ? '注册中...' : '注册' }}
        </button>
      </form>

      <!-- 测试登录按钮 -->
      <div class="test-login-section">
        <button 
          type="button" 
          class="test-btn"
          @click="handleTestLogin"
          :disabled="userStore.isLoading"
        >
          <SvgIcon name="User" :size="16" />
          测试登录（免注册）
        </button>
        <p class="test-hint">
          使用测试账号直接登录，数据仅保存在当前设备
        </p>
      </div>

      <div class="login-footer">
        <p>登录后即可在多设备同步数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import SvgIcon from '../components/icons/SvgIcon.vue'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const passwordError = ref('')
const passwordMatchError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = registerForm.password
  if (!pwd) return ''
  if (pwd.length < 6) return 'weak'
  if (pwd.length < 10 || !/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) return 'medium'
  return 'strong'
})

const passwordStrengthWidth = computed(() => {
  const strength = passwordStrength.value
  if (strength === 'weak') return '33%'
  if (strength === 'medium') return '66%'
  if (strength === 'strong') return '100%'
  return '0%'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength === 'weak') return '密码强度：弱'
  if (strength === 'medium') return '密码强度：中'
  if (strength === 'strong') return '密码强度：强'
  return ''
})

// 表单验证
const isFormValid = computed(() => {
  if (!registerForm.username || !registerForm.email || !registerForm.password) return false
  if (registerForm.password !== registerForm.confirmPassword) return false
  if (registerForm.password.length < 6) return false
  return true
})

function validatePassword() {
  passwordMatchError.value = ''
  if (registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword) {
    passwordMatchError.value = '两次输入的密码不一致'
  }
}

async function handleLogin() {
  const success = await userStore.login({
    email: loginForm.email,
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
  
  try {
    const result = await userStore.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })
    
    // 显示成功提示，不自动跳转
    alert(result.message)
    // 切换到登录页
    isLogin.value = true
  } catch (error: any) {
    alert(error.message || '注册失败')
  }
}

// 测试登录（免注册）- 纯本地模式，绕过 Supabase
async function handleTestLogin() {
  try {
    // 创建本地测试用户（不走 Supabase）
    const testUser = {
      id: 'local-test-user-' + Date.now(),
      username: '测试用户',
      display_name: '测试用户',
      created_at: new Date().toISOString()
    }
    
    // 保存到 localStorage
    localStorage.setItem('user', JSON.stringify(testUser))
    localStorage.setItem('isLocalTestUser', 'true')
    localStorage.setItem('token', 'local-test-token-' + Date.now()) // 设置 token 用于路由守卫
    
    // 更新 store
    userStore.user = testUser
    
    // 跳转到首页
    router.push('/')
  } catch (error: any) {
    alert('测试登录失败：' + error.message)
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
  color: var(--accent-primary);
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

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  width: 100%;
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: var(--space-3);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-normal);
}

.toggle-password:hover {
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

.password-strength {
  margin-top: var(--space-2);
}

.strength-bar {
  height: 4px;
  background: var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: var(--radius-full);
}

.strength-fill.weak {
  background: var(--accent-danger);
}

.strength-fill.medium {
  background: var(--accent-warning);
}

.strength-fill.strong {
  background: var(--accent-success);
}

.strength-text {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
  display: block;
}

.field-error {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--accent-danger);
  margin-top: var(--space-1);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: rgba(229, 115, 115, 0.1);
  border-radius: var(--radius-md);
  color: var(--accent-danger);
  font-size: var(--font-size-sm);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
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

.test-login-section {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
}

.test-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.test-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: var(--space-2);
  text-align: center;
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
