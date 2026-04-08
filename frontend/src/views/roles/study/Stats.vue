<template>
  <div class="study-stats">
    <!-- 概览卡片 -->
    <div class="overview-section">
      <div class="stat-card primary">
        <div class="stat-header">
          <span class="stat-title">今日专注</span>
          <span class="stat-trend" :class="trendDirection">{{ trendText }}</span>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ todayMinutes }}</div>
          <div class="stat-unit">分钟</div>
        </div>
        <div class="stat-footer">
          <span>{{ todaySessions }} 次专注</span>
          <span>{{ todayTasks }} 个任务</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">本周专注</span>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ weekMinutes }}</div>
          <div class="stat-unit">分钟</div>
        </div>
        <div class="stat-footer">
          <span>日均 {{ avgDailyMinutes }} 分钟</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">本月专注</span>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ monthMinutes }}</div>
          <div class="stat-unit">分钟</div>
        </div>
        <div class="stat-footer">
          <span>总计 {{ monthSessions }} 次</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">连续专注</span>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ streakDays }}</div>
          <div class="stat-unit">天</div>
        </div>
        <div class="stat-footer">
          <span>最高纪录 {{ maxStreak }} 天</span>
        </div>
      </div>
    </div>

    <!-- 周统计图表 -->
    <div class="chart-section">
      <div class="section-header">
        <h3>本周专注趋势</h3>
        <div class="time-range">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            class="range-btn"
            :class="{ active: currentRange === range.value }"
            @click="currentRange = range.value"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-bars">
          <div
            v-for="(day, index) in weekData"
            :key="index"
            class="chart-bar-wrapper"
          >
            <div class="chart-bar-bg">
              <div
                class="chart-bar"
                :style="{ height: (day.minutes / maxMinutes * 100) + '%' }"
                :class="{ today: day.isToday }"
              ></div>
            </div>
            <div class="chart-label">{{ day.label }}</div>
            <div class="chart-value">{{ day.minutes }}分</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务分布和时段分析 -->
    <div class="analysis-section">
      <div class="analysis-card">
        <h3>任务分布</h3>
        <div class="task-distribution">
          <div
            v-for="task in taskDistribution"
            :key="task.name"
            class="task-item"
          >
            <div class="task-info">
              <div class="task-color" :style="{ background: task.color }"></div>
              <span class="task-name">{{ task.name }}</span>
            </div>
            <div class="task-stats">
              <span class="task-count">{{ task.count }}次</span>
              <span class="task-time">{{ task.minutes }}分钟</span>
            </div>
            <div class="task-bar">
              <div
                class="task-progress"
                :style="{ width: task.percentage + '%', background: task.color }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-card">
        <h3>时段分析</h3>
        <div class="time-analysis">
          <div
            v-for="period in timeAnalysis"
            :key="period.name"
            class="period-item"
          >
            <div class="period-name">{{ period.name }}</div>
            <div class="period-bar-wrapper">
              <div
                class="period-bar"
                :style="{ width: period.percentage + '%' }"
              ></div>
            </div>
            <div class="period-value">{{ period.minutes }}分钟</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <div class="section-header">
        <h3>专注历史</h3>
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            class="filter-tab"
            :class="{ active: currentFilter === tab.value }"
            @click="currentFilter = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="history-list">
        <div
          v-for="record in filteredHistory"
          :key="record.id"
          class="history-item"
        >
          <div class="history-date">
            <div class="date-day">{{ record.day }}</div>
            <div class="date-month">{{ record.month }}</div>
          </div>
          <div class="history-content">
            <div class="history-task">{{ record.task }}</div>
            <div class="history-meta">
              <span class="history-time">{{ record.time }}</span>
              <span class="history-duration">{{ record.duration }}分钟</span>
            </div>
          </div>
          <div
            class="history-status"
            :class="record.completed ? 'completed' : 'abandoned'"
          >
            {{ record.completed ? '已完成' : '已放弃' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 统计数据
const todayMinutes = ref(125)
const todaySessions = ref(5)
const todayTasks = ref(4)
const weekMinutes = ref(680)
const monthMinutes = ref(2850)
const monthSessions = ref(95)
const streakDays = ref(7)
const maxStreak = ref(21)
const yesterdayMinutes = ref(90)

const trendDirection = computed(() => {
  return todayMinutes.value >= yesterdayMinutes.value ? 'up' : 'down'
})

const trendText = computed(() => {
  const diff = todayMinutes.value - yesterdayMinutes.value
  const percent = Math.round((diff / yesterdayMinutes.value) * 100)
  return diff >= 0 ? `+${percent}%` : `${percent}%`
})

const avgDailyMinutes = computed(() => {
  return Math.round(weekMinutes.value / 7)
})

// 时间范围
const timeRanges = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
]
const currentRange = ref('week')

// 周数据
const weekData = ref([
  { label: '周一', minutes: 90, isToday: false },
  { label: '周二', minutes: 120, isToday: false },
  { label: '周三', minutes: 75, isToday: false },
  { label: '周四', minutes: 150, isToday: false },
  { label: '周五', minutes: 100, isToday: false },
  { label: '周六', minutes: 180, isToday: false },
  { label: '周日', minutes: 125, isToday: true }
])

const maxMinutes = computed(() => {
  return Math.max(...weekData.value.map(d => d.minutes))
})

// 任务分布
const taskDistribution = ref([
  { name: '阅读', count: 25, minutes: 625, percentage: 35, color: '#667eea' },
  { name: '编程', count: 18, minutes: 450, percentage: 25, color: '#f093fb' },
  { name: '学习', count: 15, minutes: 375, percentage: 21, color: '#4facfe' },
  { name: '写作', count: 10, minutes: 200, percentage: 11, color: '#43e97b' },
  { name: '其他', count: 8, minutes: 150, percentage: 8, color: '#fa709a' }
])

// 时段分析
const timeAnalysis = ref([
  { name: '早晨 (6:00-12:00)', minutes: 420, percentage: 35 },
  { name: '下午 (12:00-18:00)', minutes: 360, percentage: 30 },
  { name: '晚上 (18:00-24:00)', minutes: 300, percentage: 25 },
  { name: '深夜 (0:00-6:00)', minutes: 120, percentage: 10 }
])

// 筛选标签
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '已完成', value: 'completed' },
  { label: '已放弃', value: 'abandoned' }
]
const currentFilter = ref('all')

// 历史记录
const historyRecords = ref([
  { id: 1, day: '07', month: '4月', task: '阅读技术文档', time: '14:30', duration: 25, completed: true },
  { id: 2, day: '07', month: '4月', task: '编程练习', time: '15:00', duration: 50, completed: true },
  { id: 3, day: '07', month: '4月', task: '写作', time: '16:00', duration: 25, completed: true },
  { id: 4, day: '07', month: '4月', task: '学习新框架', time: '19:30', duration: 25, completed: true },
  { id: 5, day: '06', month: '4月', task: '阅读', time: '20:00', duration: 30, completed: false },
  { id: 6, day: '06', month: '4月', task: '编程项目', time: '14:00', duration: 50, completed: true },
  { id: 7, day: '06', month: '4月', task: '复习笔记', time: '09:00', duration: 25, completed: true },
  { id: 8, day: '05', month: '4月', task: '深度工作', time: '15:30', duration: 90, completed: true }
])

const filteredHistory = computed(() => {
  if (currentFilter.value === 'all') {
    return historyRecords.value
  }
  return historyRecords.value.filter(r =>
    currentFilter.value === 'completed' ? r.completed : !r.completed
  )
})

function loadData() {
  const saved = localStorage.getItem('studyFocusData')
  if (saved) {
    const data = JSON.parse(saved)
    if (data.date === new Date().toDateString()) {
      todaySessions.value = data.todaySessions || 0
      todayMinutes.value = data.todayMinutes || 0
      todayTasks.value = data.todayTasks || 0
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.study-stats {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* 概览卡片 */
.overview-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.stat-card.primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-inverse);
}

.stat-card.primary .stat-title,
.stat-card.primary .stat-unit,
.stat-card.primary .stat-footer span {
  color: rgba(255, 255, 255, 0.8);
}

.stat-card.primary .stat-number {
  color: var(--text-inverse);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.stat-title {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.stat-trend {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.stat-trend.up {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.stat-trend.down {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}

.stat-card.primary .stat-trend.up {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-inverse);
}

.stat-body {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.stat-number {
  font-size: 36px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-unit {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.stat-footer {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 图表区域 */
.chart-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.section-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.time-range {
  display: flex;
  gap: var(--space-1);
}

.range-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.range-btn:hover {
  color: var(--text-primary);
}

.range-btn.active {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.chart-container {
  padding: var(--space-4) 0;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  gap: var(--space-4);
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.chart-bar-bg {
  width: 100%;
  height: 160px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.chart-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--radius-md);
  transition: height 0.5s ease;
}

.chart-bar.today {
  background: linear-gradient(180deg, #f093fb, #f5576c);
}

.chart-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.chart-value {
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

/* 分析区域 */
.analysis-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.analysis-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.analysis-card h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.task-distribution {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.task-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.task-color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
}

.task-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  flex: 1;
}

.task-stats {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.task-bar {
  height: 6px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.task-progress {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.time-analysis {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.period-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.period-name {
  width: 140px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.period-bar-wrapper {
  flex: 1;
  height: 8px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.period-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.period-value {
  width: 70px;
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

/* 历史记录 */
.history-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.filter-tabs {
  display: flex;
  gap: var(--space-1);
}

.filter-tab {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.filter-tab:hover {
  color: var(--text-primary);
}

.filter-tab.active {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.history-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.history-item:hover {
  background: var(--bg-hover);
}

.history-date {
  text-align: center;
  min-width: 50px;
}

.date-day {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.date-month {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.history-content {
  flex: 1;
}

.history-task {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.history-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.history-status {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.history-status.completed {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.history-status.abandoned {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

@media (max-width: 1024px) {
  .overview-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .analysis-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .overview-section {
    grid-template-columns: 1fr;
  }

  .chart-bars {
    gap: var(--space-2);
  }

  .period-name {
    width: 100px;
    font-size: var(--font-size-xs);
  }
}
</style>
