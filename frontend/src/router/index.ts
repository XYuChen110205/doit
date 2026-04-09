import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'
import InboxView from '../views/InboxView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'
import LinksView from '../views/LinksView.vue'

// 角色专属页面
import MakeupDashboard from '../views/roles/MakeupDashboard.vue'
import StudentDashboard from '../views/roles/StudentDashboard.vue'
import StudyFocus from '../views/roles/StudyFocus.vue'
import ManagerDashboard from '../views/roles/ManagerDashboard.vue'
import CSStudentDashboard from '../views/roles/CSStudentDashboard.vue'
import CustomDashboard from '../views/roles/CustomDashboard.vue'

const routes = [
  // 默认模式路由
  {
    path: '/',
    name: 'Today',
    component: TodayView,
    meta: {
      title: '今日',
      roles: ['default']
    }
  },
  {
    path: '/inbox',
    name: 'Inbox',
    component: InboxView,
    meta: {
      title: '收集箱',
      roles: ['default']
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarView,
    meta: {
      title: '日历',
      roles: ['default']
    }
  },
  {
    path: '/links',
    name: 'Links',
    component: LinksView,
    meta: {
      title: '链接库',
      roles: ['default']
    }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView,
    meta: {
      title: '统计',
      roles: ['default']
    }
  },

  // 化妆师模式路由
  {
    path: '/',
    name: 'MakeupDashboard',
    component: MakeupDashboard,
    meta: {
      title: '工作台',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/appointments',
    name: 'MakeupAppointments',
    component: () => import('../views/roles/makeup/Appointments.vue'),
    meta: {
      title: '预约',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/clients',
    name: 'MakeupClients',
    component: () => import('../views/roles/makeup/Clients.vue'),
    meta: {
      title: '客户',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/schedule',
    name: 'MakeupSchedule',
    component: () => import('../views/roles/makeup/Schedule.vue'),
    meta: {
      title: '排班',
      roles: ['makeup']
    }
  },
  {
    path: '/makeup/income',
    name: 'MakeupIncome',
    component: () => import('../views/roles/makeup/Income.vue'),
    meta: {
      title: '收入',
      roles: ['makeup']
    }
  },

  // 学生模式路由
  {
    path: '/',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: {
      title: '首页',
      roles: ['student']
    }
  },
  {
    path: '/student/schedule',
    name: 'StudentSchedule',
    component: () => import('../views/roles/student/Schedule.vue'),
    meta: {
      title: '课程表',
      roles: ['student']
    }
  },
  {
    path: '/student/homework',
    name: 'StudentHomework',
    component: () => import('../views/roles/student/Homework.vue'),
    meta: {
      title: '作业',
      roles: ['student']
    }
  },
  {
    path: '/student/exams',
    name: 'StudentExams',
    component: () => import('../views/roles/student/Exams.vue'),
    meta: {
      title: '考试',
      roles: ['student']
    }
  },
  {
    path: '/student/grades',
    name: 'StudentGrades',
    component: () => import('../views/roles/student/Grades.vue'),
    meta: {
      title: '成绩',
      roles: ['student']
    }
  },

  // 自习模式路由
  {
    path: '/',
    name: 'StudyFocus',
    component: StudyFocus,
    meta: {
      title: '专注',
      roles: ['study']
    }
  },
  {
    path: '/study/stats',
    name: 'StudyStats',
    component: () => import('../views/roles/study/Stats.vue'),
    meta: {
      title: '统计',
      roles: ['study']
    }
  },
  {
    path: '/study/room',
    name: 'StudyRoom',
    component: () => import('../views/roles/study/Room.vue'),
    meta: {
      title: '自习室',
      roles: ['study']
    }
  },

  // 店长模式路由
  {
    path: '/',
    name: 'ManagerDashboard',
    component: ManagerDashboard,
    meta: {
      title: '概览',
      roles: ['manager']
    }
  },
  {
    path: '/manager/staff',
    name: 'ManagerStaff',
    component: () => import('../views/roles/manager/Staff.vue'),
    meta: {
      title: '员工',
      roles: ['manager']
    }
  },
  {
    path: '/manager/inventory',
    name: 'ManagerInventory',
    component: () => import('../views/roles/manager/Inventory.vue'),
    meta: {
      title: '库存',
      roles: ['manager']
    }
  },
  {
    path: '/manager/sales',
    name: 'ManagerSales',
    component: () => import('../views/roles/manager/Sales.vue'),
    meta: {
      title: '销售',
      roles: ['manager']
    }
  },
  {
    path: '/manager/tasks',
    name: 'ManagerTasks',
    component: () => import('../views/roles/manager/Tasks.vue'),
    meta: {
      title: '任务',
      roles: ['manager']
    }
  },

  // 计算机学生模式路由
  {
    path: '/',
    name: 'CSStudentDashboard',
    component: CSStudentDashboard,
    meta: {
      title: '项目',
      roles: ['cs_student']
    }
  },
  {
    path: '/cs/learning',
    name: 'CSLearning',
    component: () => import('../views/roles/cs_student/Learning.vue'),
    meta: {
      title: '学习',
      roles: ['cs_student']
    }
  },
  {
    path: '/cs/github',
    name: 'CSGithub',
    component: () => import('../views/roles/cs_student/Github.vue'),
    meta: {
      title: 'GitHub',
      roles: ['cs_student']
    }
  },
  {
    path: '/cs/leetcode',
    name: 'CSLeetCode',
    component: () => import('../views/roles/cs_student/LeetCode.vue'),
    meta: {
      title: '刷题',
      roles: ['cs_student']
    }
  },
  {
    path: '/cs/notes',
    name: 'CSNotes',
    component: () => import('../views/roles/cs_student/Notes.vue'),
    meta: {
      title: '笔记',
      roles: ['cs_student']
    }
  },

  // 个人专属模式路由
  {
    path: '/',
    name: 'CustomDashboard',
    component: CustomDashboard,
    meta: {
      title: '首页',
      roles: ['custom']
    }
  },
  {
    path: '/custom/widgets',
    name: 'CustomWidgets',
    component: () => import('../views/roles/custom/Widgets.vue'),
    meta: {
      title: '组件',
      roles: ['custom']
    }
  },
  {
    path: '/custom/layout',
    name: 'CustomLayout',
    component: () => import('../views/roles/custom/Layout.vue'),
    meta: {
      title: '布局',
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
      roles: ['default', 'makeup', 'student', 'study', 'manager', 'cs_student', 'custom']
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
