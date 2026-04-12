<template>
  <div class="calendar-view">
    <!-- 视图切换和导航 -->
    <div class="calendar-header">
      <div class="view-switcher">
        <button
          v-for="view in views"
          :key="view.value"
          class="view-btn"
          :class="{ active: currentView === view.value }"
          @click="switchView(view.value)"
        >
          {{ view.label }}
        </button>
      </div>
      <div class="nav-section">
        <button class="nav-arrow" @click="navigatePrev">
          <SvgIcon name="ChevronLeft" :size="20" />
        </button>
        <span class="current-period">{{ periodDisplay }}</span>
        <button class="nav-arrow" @click="navigateNext">
          <SvgIcon name="ChevronRight" :size="20" />
        </button>
        <button class="today-btn" @click="goToToday">今天</button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="currentView === 'month'" class="month-view">
      <table class="calendar-table">
        <thead>
          <tr>
            <th v-for="day in weekdays" :key="day" class="weekday">{{ day }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in calendarWeeks" :key="week[0]?.dateStr">
            <td
              v-for="date in week"
              :key="date.dateStr"
              class="calendar-day"
              :class="{
                'other-month': !date.isCurrentMonth,
                'today': date.isToday,
                'selected': selectedDate === date.dateStr
              }"
              @click="selectDate(date)"
            >
              <div class="day-header">
                <span class="day-number">{{ date.day }}</span>
                <span v-if="date.lunar" class="lunar-day">{{ date.lunar }}</span>
              </div>
              <div class="day-tasks">
                <div
                  v-for="task in getDayTasks(date.dateStr).slice(0, 3)"
                  :key="task.id"
                  class="task-dot"
                  :class="{ done: task.status === 'done' }"
                ></div>
              </div>
              <div v-if="getDayTasks(date.dateStr).length > 3" class="more-tasks">
                +{{ getDayTasks(date.dateStr).length - 3 }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 日视图 -->
    <div v-else-if="currentView === 'day'" class="day-view">
      <div class="day-header-info">
        <span class="day-gregorian">{{ currentDate.getMonth() + 1 }}月{{ currentDate.getDate() }}日</span>
        <span v-if="currentLunar" class="day-lunar">{{ currentLunar }}</span>
      </div>
      <div class="day-content">
        <div class="task-input-area">
          <input
            v-model="newTaskTitle"
            type="text"
            placeholder="添加新任务..."
            @keyup.enter="addTask"
          />
          <button @click="addTask" :disabled="!newTaskTitle.trim()">
            <SvgIcon name="Plus" :size="16" />
          </button>
        </div>
        <div class="day-task-list">
          <div
            v-for="task in currentDayTasks"
            :key="task.id"
            class="day-task-item"
            :class="{ done: task.status === 'done' }"
          >
            <button class="checkbox" @click="toggleTask(task)">
              <SvgIcon v-if="task.status === 'done'" name="Check" :size="12" />
            </button>
            <span class="task-title">{{ task.title }}</span>
            <button class="delete-btn" @click="deleteTask(task.id)">
              <SvgIcon name="Trash" :size="14" />
            </button>
          </div>
          <div v-if="currentDayTasks.length === 0" class="no-tasks">
            今天还没有任务
          </div>
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-else-if="currentView === 'year'" class="year-view">
      <div class="year-grid">
        <div
          v-for="month in 12"
          :key="month"
          class="month-card"
          :class="{ 'current-month': isCurrentMonth(month) }"
          @click="selectMonth(month - 1)"
        >
          <span class="month-name">{{ month }}月</span>
          <span class="month-task-count">{{ getMonthTaskCount(month - 1) }} 任务</span>
        </div>
      </div>
    </div>

    <!-- 选中日期的任务弹窗 -->
    <BaseModal
      v-if="showTaskModal && selectedDate"
      :is-open="showTaskModal"
      title="任务详情"
      @close="showTaskModal = false"
    >
      <div class="modal-task-list">
        <div class="task-input-area">
          <input
            v-model="newTaskTitle"
            type="text"
            placeholder="添加新任务..."
            @keyup.enter="addTaskForDate"
          />
          <button @click="addTaskForDate" :disabled="!newTaskTitle.trim()">
            <SvgIcon name="Plus" :size="16" />
          </button>
        </div>
        <div class="tasks-container">
          <div
            v-for="task in selectedDateTasks"
            :key="task.id"
            class="modal-task-item"
            :class="{ done: task.status === 'done' }"
          >
            <button class="checkbox" @click="toggleTask(task)">
              <SvgIcon v-if="task.status === 'done'" name="Check" :size="12" />
            </button>
            <span class="task-title">{{ task.title }}</span>
            <button class="delete-btn" @click="deleteTask(task.id)">
              <SvgIcon name="Trash" :size="14" />
            </button>
          </div>
          <div v-if="selectedDateTasks.length === 0" class="no-tasks-modal">
            该日暂无任务
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../components/icons/SvgIcon.vue'
import BaseModal from '../components/base/BaseModal.vue'

// 类型定义
interface Task {
  id: string
  title: string
  status: 'pending' | 'done'
  due_date: string
  createdAt: string
}

// 视图类型
const views = [
  { label: '月', value: 'month' },
  { label: '日', value: 'day' },
  { label: '年', value: 'year' }
]

const currentView = ref('month')
const currentDate = ref(new Date())
const selectedDate = ref('')
const showTaskModal = ref(false)
const newTaskTitle = ref('')
const tasks = ref<Task[]>([])

// 周日开始的星期
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 简单的农历数据（简化版）
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

// 计算属性
const periodDisplay = computed(() => {
  if (currentView.value === 'year') {
    return `${currentDate.value.getFullYear()}年`
  } else if (currentView.value === 'day') {
    const d = currentDate.value
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
})

const currentLunar = computed(() => {
  return getSimpleLunar(currentDate.value)
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const firstDayWeek = firstDay.getDay()
  const days = []

  // 上个月的日期
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(year, month - 1, day)
    days.push(createDayObj(date, false))
  }

  // 当前月的日期
  const today = formatDate(new Date())
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push(createDayObj(date, true, today))
  }

  // 下个月的日期 - 只填充到完整的周
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push(createDayObj(date, false))
  }

  return days
})

// 将日期按周分组
const calendarWeeks = computed(() => {
  const weeks = []
  const days = calendarDays.value
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  
  return weeks
})

const currentDayTasks = computed(() => {
  const dateStr = formatDate(currentDate.value)
  return tasks.value.filter(task => task.due_date === dateStr)
})

const selectedDateTasks = computed(() => {
  return tasks.value.filter(task => task.due_date === selectedDate.value)
})

// 辅助函数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function createDayObj(date: Date, isCurrentMonth: boolean, today?: string) {
  const dateStr = formatDate(date)
  return {
    day: date.getDate(),
    dateStr,
    isCurrentMonth,
    isToday: dateStr === (today || formatDate(new Date())),
    lunar: getSimpleLunar(date)
  }
}

// 简化的农历计算（仅显示日期）
function getSimpleLunar(date: Date): string {
  // 使用一个简化的偏移计算来模拟农历
  const baseDate = new Date(2024, 0, 10) // 2024年1月10日是农历初一
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)
  const lunarDayIndex = ((diffDays % 30) + 30) % 30
  return lunarDays[lunarDayIndex]
}

function getDayTasks(dateStr: string): Task[] {
  return tasks.value.filter(task => task.due_date === dateStr)
}

function getMonthTaskCount(month: number): number {
  const year = currentDate.value.getFullYear()
  return tasks.value.filter(task => {
    const taskDate = new Date(task.due_date)
    return taskDate.getMonth() === month && taskDate.getFullYear() === year
  }).length
}

function isCurrentMonth(month: number): boolean {
  const now = new Date()
  return month === now.getMonth() && currentDate.value.getFullYear() === now.getFullYear()
}

// 方法
function loadTasks() {
  const saved = localStorage.getItem('tasks')
  if (saved) {
    tasks.value = JSON.parse(saved)
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks.value))
}

function switchView(view: string) {
  currentView.value = view
}

function navigatePrev() {
  const newDate = new Date(currentDate.value)
  if (currentView.value === 'month') {
    newDate.setMonth(newDate.getMonth() - 1)
  } else if (currentView.value === 'day') {
    newDate.setDate(newDate.getDate() - 1)
  } else {
    newDate.setFullYear(newDate.getFullYear() - 1)
  }
  currentDate.value = newDate
}

function navigateNext() {
  const newDate = new Date(currentDate.value)
  if (currentView.value === 'month') {
    newDate.setMonth(newDate.getMonth() + 1)
  } else if (currentView.value === 'day') {
    newDate.setDate(newDate.getDate() + 1)
  } else {
    newDate.setFullYear(newDate.getFullYear() + 1)
  }
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
  selectedDate.value = formatDate(new Date())
}

function selectDate(date: { dateStr: string }) {
  selectedDate.value = date.dateStr
  showTaskModal.value = true
  newTaskTitle.value = ''
}

function selectMonth(month: number) {
  currentDate.value = new Date(currentDate.value.getFullYear(), month, 1)
  currentView.value = 'month'
}

function addTask() {
  if (!newTaskTitle.value.trim()) return
  
  const newTask: Task = {
    id: generateId(),
    title: newTaskTitle.value.trim(),
    status: 'pending',
    due_date: formatDate(currentDate.value),
    createdAt: new Date().toISOString()
  }
  
  tasks.value.push(newTask)
  saveTasks()
  newTaskTitle.value = ''
}

function addTaskForDate() {
  if (!newTaskTitle.value.trim() || !selectedDate.value) return
  
  const newTask: Task = {
    id: generateId(),
    title: newTaskTitle.value.trim(),
    status: 'pending',
    due_date: selectedDate.value,
    createdAt: new Date().toISOString()
  }
  
  tasks.value.push(newTask)
  saveTasks()
  newTaskTitle.value = ''
}

function toggleTask(task: Task) {
  task.status = task.status === 'done' ? 'pending' : 'done'
  saveTasks()
}

function deleteTask(id: string) {
  tasks.value = tasks.value.filter(t => t.id !== id)
  saveTasks()
}

onMounted(() => {
  loadTasks()
  selectedDate.value = formatDate(new Date())
})
</script>

<style scoped>
.calendar-view {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* 头部 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.view-switcher {
  display: flex;
  gap: var(--space-1);
  background: var(--bg-secondary);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.view-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  font-size: var(--font-size-sm);
}

.view-btn.active {
  background: var(--accent-primary);
  color: white;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--bg-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: var(--transition-normal);
}

.nav-arrow:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.current-period {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  min-width: 120px;
  text-align: center;
}

.today-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-normal);
}

.today-btn:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 月视图 - 表格形式 */
.calendar-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 2px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
}

.calendar-table thead {
  background: var(--bg-secondary);
}

.calendar-table th.weekday {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.calendar-table th.weekday:first-child {
  color: var(--accent-danger);
}

.calendar-table td.calendar-day {
  aspect-ratio: 1;
  vertical-align: top;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  min-height: 80px;
  border: 2px solid transparent;
  background: var(--bg-primary);
}

.calendar-day:hover {
  background: var(--bg-hover);
}

.calendar-day.other-month {
  opacity: 0.4;
}

.calendar-day.today {
  background: var(--accent-primary-light);
  border-color: var(--accent-primary);
}

.calendar-day.selected {
  box-shadow: 0 0 0 2px var(--accent-primary);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.day-number {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.lunar-day {
  font-size: 10px;
  color: var(--text-muted);
}

.day-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: auto;
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
}

.task-dot.done {
  background: var(--accent-success);
}

.more-tasks {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 日视图 */
.day-view {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.day-header-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.day-gregorian {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.day-lunar {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.task-input-area {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.task-input-area input {
  flex: 1;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.task-input-area input:focus {
  border-color: var(--accent-primary);
}

.task-input-area button {
  padding: var(--space-3);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.task-input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.day-task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.day-task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.day-task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition-normal);
}

.checkbox:hover {
  border-color: var(--accent-primary);
}

.day-task-item.done .checkbox {
  background: var(--accent-success);
  border-color: var(--accent-success);
}

.task-title {
  flex: 1;
  color: var(--text-primary);
}

.delete-btn {
  padding: var(--space-1);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.day-task-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--accent-danger);
}

.no-tasks {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
}

/* 年视图 */
.year-view {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.month-card {
  padding: var(--space-6);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.month-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.month-card.current-month {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.month-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.month-task-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 弹窗 */
.modal-task-list {
  min-width: 400px;
}

.tasks-container {
  max-height: 400px;
  overflow-y: auto;
  margin-top: var(--space-4);
}

.modal-task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  transition: var(--transition-normal);
}

.modal-task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.no-tasks-modal {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
}

/* 响应式 */
@media (max-width: 768px) {
  .calendar-view {
    padding: var(--space-3);
  }

  .calendar-header {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-section {
    justify-content: center;
  }

  .year-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .calendar-grid {
    gap: var(--space-1);
    padding: var(--space-2);
  }

  .calendar-day {
    min-height: 60px;
    padding: var(--space-1);
  }

  .lunar-day {
    font-size: 9px;
  }

  .modal-task-list {
    min-width: auto;
  }
}
</style>
