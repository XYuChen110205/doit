<template>
  <div class="app">
    <!-- 顶部导航栏 - 毛玻璃效果 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">{{ currentRoleInfo.name }}</div>
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
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>

    <!-- 移动端底部导航栏 - 毛玻璃效果 -->
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

const $route = useRoute()

// 当前角色
const currentRole = ref('default')

// 角色信息
const roleInfo: Record<string, { name: string; icon: string }> = {
  default: { name: 'Todo', icon: '📋' },
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
  background-color: var(--bg-primary);
}

/* ========== 顶部导航栏 - 毛玻璃效果 ========== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background-color: var(--bg-nav);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-nav);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-8);
  height: 64px;
}

.nav-brand {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-wide);
}

.nav-links {
  display: flex;
  gap: var(--space-8);
}

.nav-link {
  position: relative;
  padding: var(--space-2) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-normal);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--accent-primary);
  transform: scaleX(0);
  transition: var(--transition-normal);
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

.nav-link.active::after {
  transform: scaleX(1);
}

/* ========== 主内容区 ========== */
.main-content {
  flex: 1;
  margin-top: 64px;
  padding: var(--space-8);
  overflow: auto;
}

.content-wrapper {
  max-width: 1200px;
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
  background-color: var(--bg-nav);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -1px 8px rgba(123, 175, 204, 0.1);
  padding: var(--space-2) 0 calc(var(--space-2) + env(safe-area-inset-bottom));
}

.nav-link-mobile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-1);
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--letter-spacing-wide);
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
  width: 24px;
  height: 2px;
  background-color: var(--accent-primary);
  transition: var(--transition-normal);
}

.nav-link-mobile.active {
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
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
    margin-bottom: 56px;
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
