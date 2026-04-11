import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'
import InboxView from '../views/InboxView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import WechatNoteView from '../views/WechatNoteView.vue'

// 角色专属页面
import MakeupDashboard from '../views/roles/MakeupDashboard.vue'
import StudentDashboard from '../views/roles/StudentDashboard.vue'
import StudyFocus from '../views/roles/StudyFocus.vue'
import ManagerDashboard from '../views/roles/ManagerDashboard.vue'
import CSStudentDashboard from '../views/roles/CSStudentDashboard.vue'
import CustomDashboard from '../views/roles/CustomDashboard.vue'

const routes = [
  // 默认模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'Today',
    component: TodayView,
    meta: {
      title: '今日',
      icon: 'Home',
      roles: ['default']
    }
  },
  {
    path: '/inbox',
    name: 'Inbox',
    component: InboxView,
    meta: {
      title: '收集箱',
      icon: 'Inbox',
      roles: ['default']
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarView,
    meta: {
      title: '日历',
      icon: 'Calendar',
      roles: ['default']
    }
  },
  {
    path: '/notes',
    name: 'WechatNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['default']
    }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView,
    meta: {
      title: '统计',
      icon: 'Chart',
      roles: ['default']
    }
  },

  // 化妆师模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'MakeupDashboard',
    component: MakeupDashboard,
    meta: {
      title: '工作台',
      icon: 'Home',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/appointments',
    name: 'MakeupAppointments',
    component: () => import('../views/roles/makeup/Appointments.vue'),
    meta: {
      title: '预约',
      icon: 'Calendar',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/clients',
    name: 'MakeupClients',
    component: () => import('../views/roles/makeup/Clients.vue'),
    meta: {
      title: '客户',
      icon: 'User',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/notes',
    name: 'MakeupNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['makeup']
    }
  },

  // 学生模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: {
      title: '首页',
      icon: 'Home',
      roles: ['student']
    }
  },
  {
    path: '/student/schedule',
    name: 'StudentSchedule',
    component: () => import('../views/roles/student/Schedule.vue'),
    meta: {
      title: '课程表',
      icon: 'Calendar',
      roles: ['student']
    }
  },
  {
    path: '/student/homework',
    name: 'StudentHomework',
    component: () => import('../views/roles/student/Homework.vue'),
    meta: {
      title: '作业',
      icon: 'Task',
      roles: ['student']
    }
  },
  {
    path: '/student/notes',
    name: 'StudentNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['student']
    }
  },

  // 自习模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'StudyFocus',
    component: StudyFocus,
    meta: {
      title: '专注',
      icon: 'Clock',
      roles: ['study']
    }
  },
  {
    path: '/study/stats',
    name: 'StudyStats',
    component: () => import('../views/roles/study/Stats.vue'),
    meta: {
      title: '统计',
      icon: 'Chart',
      roles: ['study']
    }
  },
  {
    path: '/study/notes',
    name: 'StudyNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['study']
    }
  },

  // 店长模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'ManagerDashboard',
    component: ManagerDashboard,
    meta: {
      title: '概览',
      icon: 'Home',
      roles: ['manager']
    }
  },
  {
    path: '/manager/staff',
    name: 'ManagerStaff',
    component: () => import('../views/roles/manager/Staff.vue'),
    meta: {
      title: '员工',
      icon: 'User',
      roles: ['manager']
    }
  },
  {
    path: '/manager/tasks',
    name: 'ManagerTasks',
    component: () => import('../views/roles/manager/Tasks.vue'),
    meta: {
      title: '任务',
      icon: 'Task',
      roles: ['manager']
    }
  },
  {
    path: '/manager/notes',
    name: 'ManagerNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['manager']
    }
  },

  // 计算机学生模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'CSStudentDashboard',
    component: CSStudentDashboard,
    meta: {
      title: '项目',
      icon: 'Code',
      roles: ['cs_student']
    }
  },
  {
    path: '/cs/learning',
    name: 'CSLearning',
    component: () => import('../views/roles/cs_student/Learning.vue'),
    meta: {
      title: '学习',
      icon: 'Book',
      roles: ['cs_student']
    }
  },
  {
    path: '/cs/notes',
    name: 'CSNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['cs_student']
    }
  },

  // 个人专属模式路由 - 简化为核心功能
  {
    path: '/',
    name: 'CustomDashboard',
    component: CustomDashboard,
    meta: {
      title: '首页',
      icon: 'Home',
      roles: ['custom']
    }
  },
  {
    path: '/custom/notes',
    name: 'CustomNotes',
    component: WechatNoteView,
    meta: {
      title: '笔记',
      icon: 'Note',
      roles: ['custom']
    }
  },

  // 公共路由
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: '设置',
      icon: 'Settings',
      roles: ['default', 'makeup', 'student', 'study', 'manager', 'cs_student', 'custom']
    }
  },

  // 登录路由
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
