<template>
  <div class="app">
    <!-- 顶部导航栏 - 精致毛玻璃效果 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <span class="brand-icon">✦</span>
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
              {{ route.meta?.title }}
            </router-link>
          </div>
          <!-- 主题切换按钮 -->
          <ThemeSwitcher />
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
        v-for="route in currentRoutes"
        :key="route.path"
        :to="route.path"
        class="nav-link-mobile"
        :class="{ active: $route.path === route.path }"
      >
        {{ route.meta?.title }}
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import router from './router'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import { initTheme } from './styles/themes'

const $route = useRoute()

// 当前角色
const currentRole = ref('default')

// 角色信息
const roleInfo: Record<string, { name: string; icon: string }> = {
  default: { name: 'Do It', icon: '✦' },
  makeup: { name: '化妆师助手', icon: '💄' },
  student: { name: '学习助手', icon: '📚' },
  study: { name: '专注自习', icon: '🧘' },
  manager: { name: '店长助手', icon: '🏪' },
  cs_student: { name: '编程助手', icon: '💻' },
  custom: { name: '个人专属', icon: '⭐' }
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
      return ['今日', '收集箱', '日历', '统计', '设置'].includes(route.meta.title as string)
    }
    // 其他角色显示专属路由 + 设置
    return route.meta.roles?.includes(currentRole.value)
  })
  return roleRoutes
})

// 加载角色
function loadRole() {
  const savedRole = localStorage.getItem('userRole')
  if (savedRole) {
    currentRole.value = savedRole
  }
}

// 初始化
onMounted(() => {
  loadRole()
  initTheme() // 初始化主题
})
</script>

<style>
/* 全局样式引入 */
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
  font-size: var(--font-size-lg);
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
  padding: var(--space-3) var(--space-5);
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
