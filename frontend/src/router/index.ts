import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 核心功能页面
import TodayView from '../views/TodayView.vue'
import InboxView from '../views/InboxView.vue'
import CalendarView from '../views/CalendarView.vue'
import WechatNoteView from '../views/WechatNoteView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'

// 定义路由配置
const routes: RouteRecordRaw[] = [
  // ========== 核心功能路由 ==========
  {
    path: '/',
    name: 'Today',
    component: TodayView,
    meta: {
      title: '今日',
      icon: 'Home',
      group: 'main',
      order: 1
    }
  },
  {
    path: '/inbox',
    name: 'Inbox',
    component: InboxView,
    meta: {
      title: '收集箱',
      icon: 'Inbox',
      group: 'main',
      order: 2
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarView,
    meta: {
      title: '日历',
      icon: 'Calendar',
      group: 'main',
      order: 3
    }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      group: 'main',
      order: 4
    }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView,
    meta: {
      title: '统计',
      icon: 'Chart',
      group: 'main',
      order: 5
    }
  },

  // ========== 系统路由 ==========
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: '设置',
      icon: 'Settings',
      group: 'system',
      order: 99
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: '登录',
      icon: 'User',
      public: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  const isLoggedIn = !!(token || user)

  // 如果访问登录页且已登录，跳转到首页
  if (to.path === '/login' && isLoggedIn) {
    next('/')
    return
  }

  // 如果需要登录但未登录，跳转到登录页
  if (!to.meta.public && !isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
