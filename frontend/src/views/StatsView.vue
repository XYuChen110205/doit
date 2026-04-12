<template>
  <div class="stats-view">
    <div class="stats-container">
      <!-- 标题 -->
      <h1 class="stats-title">本周统计</h1>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_tasks }}</div>
          <div class="stat-label">本周新增任务</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.completed_tasks }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.completion_rate }}%</div>
          <div class="stat-label">完成率</div>
        </div>
      </div>

      <!-- 每日柱状图 -->
      <div class="chart-card">
        <h2 class="chart-title">每日完成数量</h2>
        <div class="chart-container">
          <div
            v-for="(day, index) in dailyStats"
            :key="day.date"
            class="chart-bar-wrapper"
          >
            <div class="chart-bar-container">
              <div
                class="chart-bar"
                :style="{ height: getBarHeight(day.completed) }"
              ></div>
            </div>
            <div class="chart-label">{{ weekdays[index] }}</div>
            <div class="chart-value">{{ day.completed }}</div>
          </div>
        </div>
      </div>

      <!-- 本周期间 -->
      <div class="period-info">
        本周期间：{{ periodDisplay }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 类型定义
interface Task {
  id: string
  title: string
  status: 'pending' | 'done'
  due_date: string
  createdAt: string
}

interface DailyStat {
  date: string
  completed: number
}

interface StatsData {
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  daily_stats: DailyStat[]
}

// 统计数据
const tasks = ref<Task[]>([])
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 计算属性
const stats = computed<StatsData>(() => {
  const weekRange = getWeekRange()
  const weekTasks = tasks.value.filter(task => {
    const taskDate = new Date(task.due_date)
    return taskDate >= weekRange.start && taskDate <= weekRange.end
  })

  const total = weekTasks.length
  const completed = weekTasks.filter(t => t.status === 'done').length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total_tasks: total,
    completed_tasks: completed,
    completion_rate: rate,
    daily_stats: getDailyStats(weekRange)
  }
})

const dailyStats = computed(() => {
  return stats.value.daily_stats
})

const periodDisplay = computed(() => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1) // 本周一
  const end = new Date(start)
  end.setDate(start.getDate() + 6) // 本周日

  const format = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  return `${format(start)} - ${format(end)}`
})

// 获取本周日期范围
function getWeekRange() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1) // 本周一
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6) // 本周日
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// 获取每日统计
function getDailyStats(weekRange: { start: Date; end: Date }): DailyStat[] {
  const stats: DailyStat[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekRange.start)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const completed = tasks.value.filter(task => {
      return task.due_date === dateStr && task.status === 'done'
    }).length

    stats.push({
      date: dateStr,
      completed
    })
  }

  return stats
}

// 获取柱状图高度
function getBarHeight(value: number): string {
  const max = Math.max(...dailyStats.value.map(d => d.completed), 1)
  const percentage = (value / max) * 100
  return `${Math.max(percentage, 5)}%`
}

// 加载任务数据
function loadTasks() {
  const saved = localStorage.getItem('tasks')
  if (saved) {
    tasks.value = JSON.parse(saved)
  }
}

// 初始化
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.stats-view {
  min-height: calc(100vh - 64px - var(--space-8) * 2);
  padding: var(--space-8);
}

.stats-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* 标题 */
.stats-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-wide);
  text-align: center;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-align: center;
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.stat-card:hover {
  box-shadow: var(--shadow-hover);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  letter-spacing: var(--letter-spacing-wide);
}

/* 图表卡片 */
.chart-card {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  letter-spacing: var(--letter-spacing-wide);
}

.chart-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: var(--space-4) 0;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.chart-bar-container {
  width: 40px;
  height: 150px;
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.chart-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--accent-primary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  letter-spacing: var(--letter-spacing-wide);
}

.chart-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* 本周期间 */
.period-info {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  letter-spacing: var(--letter-spacing-wide);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .stats-view {
    padding: var(--space-5);
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 160px;
  }

  .chart-bar-container {
    width: 30px;
    height: 120px;
  }
}
</style>
