<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <!-- Logo -->
        <div class="nav-brand" @click="goHome">
          <SvgIcon name="Sparkle" :size="24" />
          <span class="brand-text">Do It</span>
        </div>

        <!-- 主导航 - 核心功能 -->
        <div class="nav-main">
          <router-link
            v-for="route in mainRoutes"
            :key="route.path"
            :to="route.path"
            class="nav-link"
            :class="{ active: $route.path === route.path }"
          >
            <SvgIcon v-if="route.meta?.icon" :name="route.meta.icon" :size="18" />
            <span>{{ route.meta?.title }}</span>
          </router-link>

          <!-- 工作模式入口（仅在启用时显示） -->
          <router-link
            v-if="currentMode !== 'standard'"
            :to="modeRoute?.path || '/'"
            class="nav-link mode-link"
            :class="{ active: $route.path.startsWith('/' + currentMode) }"
          >
            <SvgIcon :name="modeConfig?.icon || 'Settings'" :size="18" />
            <span>{{ modeConfig?.title }}</span>
          </router-link>
        </div>

        <!-- 右侧工具栏 -->
        <div class="nav-tools">
          <ThemeSwitcher />

          <!-- 用户菜单 -->
          <div class="user-menu">
            <button class="user-btn" @click="showUserMenu = !showUserMenu">
              <SvgIcon name="User" :size="18" />
            </button>
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="user-info">
                <span class="user-name">{{ userStore.username || '用户' }}</span>
              </div>
              <router-link to="/settings" class="dropdown-item" @click="showUserMenu = false">
                <SvgIcon name="Settings" :size="14" />
                设置
              </router-link>
              <button class="dropdown-item logout" @click="logout">
                <SvgIcon name="Logout" :size="14" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 工作模式子导航 -->
      <div v-if="currentMode !== 'standard' && modeRoutes.length > 0 && $route.path.startsWith('/' + currentMode)" class="sub-nav">
        <div class="sub-nav-container">
          <router-link
            v-for="route in modeRoutes"
            :key="route.path"
            :to="route.path"
            class="sub-nav-link"
            :class="{ active: $route.path === route.path }"
          >
            <SvgIcon v-if="route.meta?.icon" :name="route.meta.icon" :size="14" />
            <span>{{ route.meta?.title }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 移动端底部导航 -->
    <nav class="mobile-nav">
      <router-link
        v-for="route in mobileRoutes"
        :key="route.path"
        :to="route.path"
        class="mobile-nav-item"
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
import { useUserStore } from './stores/user'

const $route = useRoute()
const $router = useRouter()
const userStore = useUserStore()

const showUserMenu = ref(false)

// 工作模式配置
const modeConfigs: Record<string, { title: string; icon: string }> = {
  student: { title: '学生中心', icon: 'Student' },
  focus: { title: '专注中心', icon: 'Clock' },
  standard: { title: '标准模式', icon: 'Home' }
}

// 当前工作模式
const currentMode = computed(() => {
  return localStorage.getItem('workMode') || 'standard'
})

// 当前模式配置
const modeConfig = computed(() => {
  return modeConfigs[currentMode.value]
})

// 主功能路由（今日、收集箱、日历、笔记、统计）
const mainRoutes = computed(() => {
  return router.getRoutes()
    .filter(route => route.meta?.group === 'main')
    .sort((a, b) => (a.meta?.order as number) - (b.meta?.order as number))
})

// 当前工作模式的首页路由
const modeRoute = computed(() => {
  return router.getRoutes().find(r => r.meta?.group === 'mode' && r.meta?.mode === currentMode.value && r.meta?.order === 1)
})

// 当前工作模式的子路由
const modeRoutes = computed(() => {
  return router.getRoutes()
    .filter(route => route.meta?.group === 'mode' && route.meta?.mode === currentMode.value)
    .sort((a, b) => (a.meta?.order as number) - (b.meta?.order as number))
})

// 移动端导航
const mobileRoutes = computed(() => {
  const routes = mainRoutes.value.slice(0, 4)
  // 如果启用了工作模式，添加模式入口
  if (currentMode.value !== 'standard' && modeRoute.value) {
    routes.push(modeRoute.value)
  }
  return routes
})

// 返回首页
function goHome() {
  $router.push('/')
}

// 退出登录
function logout() {
  userStore.logout()
  showUserMenu.value = false
  $router.push('/login')
}

// 点击外部关闭用户菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  userStore.init()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
@import './styles/tokens.css';
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* ========== 顶部导航栏 ========== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background: var(--bg-nav);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-nav);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  height: 64px;
}

/* Logo */
.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.nav-brand:hover {
  color: var(--accent-primary);
}

.brand-text {
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 主导航 */
.nav-main {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
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

.nav-link.mode-link {
  position: relative;
  margin-left: var(--space-2);
  padding-left: var(--space-4);
}

.nav-link.mode-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 20px;
  background: var(--border);
}

/* 右侧工具栏 */
.nav-tools {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* 用户菜单 */
.user-menu {
  position: relative;
}

.user-btn {
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

.user-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  min-width: 160px;
  z-index: var(--z-dropdown);
  padding: var(--space-2);
}

.user-info {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--space-2);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item.logout:hover {
  background: rgba(229, 115, 115, 0.1);
  color: var(--accent-danger);
}

/* 子导航 */
.sub-nav {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
}

.sub-nav-container {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-2) var(--space-6);
  height: 44px;
}

.sub-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.sub-nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.sub-nav-link.active {
  color: var(--accent-primary);
  background: var(--accent-primary-light);
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-top: 64px;
  padding: var(--space-6);
  overflow: auto;
}

/* 移动端底部导航 */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background: var(--bg-nav);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -2px 12px rgba(26, 43, 60, 0.08);
  padding: var(--space-2) 0 calc(var(--space-2) + env(safe-area-inset-bottom));
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-normal);
  position: relative;
}

.mobile-nav-item::before {
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

.mobile-nav-item.active {
  color: var(--accent-primary);
}

.mobile-nav-item.active::before {
  transform: translateX(-50%) scaleX(1);
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .nav-main {
    display: none;
  }

  .main-content {
    margin-top: 64px;
    margin-bottom: 64px;
  }

  .mobile-nav {
    display: flex;
    justify-content: space-around;
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 var(--space-4);
  }

  .main-content {
    padding: var(--space-4);
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: var(--space-3);
  }
}
</style>
