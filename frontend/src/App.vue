<template>
  <div class="app">
    <!-- 顶部导航栏 - 精致毛玻璃效果 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <SvgIcon :name="currentRoleInfo.iconName" :size="20" class="brand-icon" />
          <span class="brand-text">{{ currentRoleInfo.name }}</span>
        </div>
        <div class="nav-right">
          <div class="nav-links">
            <router-link
              v-for="route in currentRoutes"
              :key="route.path"
              :to="route.path"
              class="nav-link"
              :class="{ active: $route.path === route.path }"
            >
              <SvgIcon v-if="route.meta?.icon" :name="route.meta.icon" :size="16" />
              {{ route.meta?.title }}
            </router-link>
          </div>
          <!-- 主题切换按钮 -->
          <ThemeSwitcher />
          <!-- 角色切换 -->
          <div class="role-switcher">
            <button class="role-btn" @click="showRoleMenu = !showRoleMenu">
              <SvgIcon :name="currentRoleInfo.iconName" :size="16" />
            </button>
            <div v-if="showRoleMenu" class="role-menu">
              <button
                v-for="(info, key) in roleInfo"
                :key="key"
                class="role-option"
                :class="{ active: currentRole === key }"
                @click="switchRole(key)"
              >
                <SvgIcon :name="info.iconName" :size="16" />
                <span>{{ info.name }}</span>
              </button>
            </div>
          </div>
          <!-- 用户信息 -->
          <div v-if="userStore.isLoggedIn" class="user-menu">
            <SvgIcon name="User" :size="16" />
            <span class="username">{{ userStore.username }}</span>
            <button class="logout-btn" @click="handleLogout">
              <SvgIcon name="Logout" :size="14" />
            </button>
          </div>
          <router-link v-else to="/login" class="login-link">
            <SvgIcon name="User" :size="16" />
            登录
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>

    <!-- 移动端底部导航栏 -->
    <nav class="navbar-mobile">
      <router-link
        v-for="route in currentRoutes.slice(0, 5)"
        :key="route.path"
        :to="route.path"
        class="nav-link-mobile"
        :class="{ active: $route.path === route.path }"
      >
        <SvgIcon v-if="route.meta?.icon" :name="route.meta.icon" :size="20" />
        <span>{{ route.meta?.title }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import router from './router'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import SvgIcon from './components/icons/SvgIcon.vue'
import { initTheme } from './styles/themes'
import { useUserStore } from './stores/user'

const $route = useRoute()
const $router = useRouter()
const userStore = useUserStore()

// 当前角色
const currentRole = ref('default')
const showRoleMenu = ref(false)

// 角色信息 - 使用 SVG 图标替代 emoji
const roleInfo: Record<string, { name: string; iconName: string }> = {
  default: { name: 'Do It', iconName: 'Sparkle' },
  makeup: { name: '化妆师助手', iconName: 'Makeup' },
  student: { name: '学习助手', iconName: 'Student' },
  study: { name: '专注自习', iconName: 'Study' },
  manager: { name: '店长助手', iconName: 'Manager' },
  cs_student: { name: '编程助手', iconName: 'Code' },
  custom: { name: '个人专属', iconName: 'Custom' }
}

// 当前角色信息
const currentRoleInfo = computed(() => {
  return roleInfo[currentRole.value] || roleInfo.default
})

// 根据角色获取路由
const currentRoutes = computed(() => {
  const allRoutes = router.getRoutes()
  // 根据角色过滤路由
  const roleRoutes = allRoutes.filter(route => {
    if (!route.meta?.title) return false
    // 默认角色显示所有默认路由
    if (currentRole.value === 'default') {
      return ['今日', '收集箱', '日历', '统计', '设置', '诗意写作', '今日手账'].includes(route.meta.title as string)
    }
    // 其他角色显示专属路由 + 设置
    return route.meta.roles?.includes(currentRole.value)
  })
  return roleRoutes
})

// 加载角色
function loadRole() {
  const savedRole = localStorage.getItem('userRole')
  if (savedRole && roleInfo[savedRole]) {
    currentRole.value = savedRole
  }
}

// 切换角色
function switchRole(role: string) {
  currentRole.value = role
  localStorage.setItem('userRole', role)
  showRoleMenu.value = false
  // 切换到对应角色的首页
  $router.push('/')
}

// 点击外部关闭角色菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.role-switcher')) {
    showRoleMenu.value = false
  }
}

// 初始化
onMounted(() => {
  loadRole()
  initTheme()
  userStore.init()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 退出登录
function handleLogout() {
  userStore.logout()
  $router.push('/login')
}
</script>

<style>
@import './styles/tokens.css';
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

/* ========== 顶部导航栏 - 精致毛玻璃效果 ========== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background: var(--bg-nav);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-nav);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-8);
  height: 72px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-tight);
}

.brand-icon {
  color: var(--accent-primary);
}

.brand-text {
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.nav-links {
  display: flex;
  gap: var(--space-2);
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-link.active {
  color: var(--accent-primary);
  background: var(--accent-primary-light);
}

/* 角色切换器 */
.role-switcher {
  position: relative;
}

.role-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.role-btn:hover {
  background: var(--bg-hover);
  color: var(--accent-primary);
}

.role-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  padding: var(--space-2);
  min-width: 160px;
  z-index: var(--z-dropdown);
}

.role-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
  text-align: left;
}

.role-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.role-option.active {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
}

/* 用户菜单 */
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-left: var(--space-4);
  border-left: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.username {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.logout-btn:hover {
  background: var(--accent-danger);
  color: white;
}

.login-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-normal);
}

.login-link:hover {
  background: var(--accent-primary-hover);
}

/* ========== 主内容区 ========== */
.main-content {
  flex: 1;
  margin-top: 72px;
  padding: var(--space-8);
  overflow: auto;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* ========== 移动端底部导航栏 ========== */
.navbar-mobile {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background: var(--bg-nav);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -2px 12px rgba(26, 43, 60, 0.08);
  padding: var(--space-2) 0 calc(var(--space-2) + env(safe-area-inset-bottom));
}

.nav-link-mobile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-normal);
  position: relative;
}

.nav-link-mobile::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 32px;
  height: 3px;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
  transition: var(--transition-normal);
}

.nav-link-mobile.active {
  color: var(--accent-primary);
}

.nav-link-mobile.active::before {
  transform: translateX(-50%) scaleX(1);
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .navbar {
    display: none;
  }

  .navbar-mobile {
    display: flex;
    justify-content: space-around;
  }

  .main-content {
    margin-top: 0;
    margin-bottom: 64px;
    padding: var(--space-5);
  }

  .content-wrapper {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: var(--space-4);
  }
}
</style>
