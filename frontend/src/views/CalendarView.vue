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
          <span class="arrow-left"></span>
        </button>
        <span class="current-period">{{ periodDisplay }}</span>
        <button class="nav-arrow" @click="navigateNext">
          <span class="arrow-right"></span>
        </button>
        <button class="today-btn" @click="goToToday">今天</button>
      </div>
    </div>

    <!-- 标签筛选 -->
    <div class="tag-filter">
      <span class="filter-label">筛选标签:</span>
      <div class="tag-list">
        <button
          class="tag-btn all"
          :class="{ active: selectedTagId === null }"
          @click="selectedTagId = null"
        >
          全部
        </button>
        <button
          v-for="tag in allTags"
          :key="tag.id"
          class="tag-btn"
          :class="{ active: selectedTagId === tag.id }"
          :style="{ backgroundColor: selectedTagId === tag.id ? tag.color : 'transparent', borderColor: tag.color, color: selectedTagId === tag.id ? '#fff' : tag.color }"
          @click="selectedTagId = tag.id"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="currentView === 'month'" class="month-view">
      <div class="weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="calendar-grid">
        <div
          v-for="date in calendarDays"
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
            <span v-if="date.lunarDay" class="lunar-day" :class="{ 'lunar-festival': date.isFestival }">{{ date.lunarDay }}</span>
          </div>
          <div class="day-info">
            <span v-if="date.solarTerm" class="solar-term">{{ date.solarTerm }}</span>
            <span v-if="getDayTaskCount(date.dateStr) > 0" class="task-count">
              {{ getDayTaskCount(date.dateStr) }} 任务
            </span>
          </div>
          <div class="day-tasks">
            <div
              v-for="task in getDayTasksPreview(date.dateStr)"
              :key="task.id"
              class="task-block"
              :style="{ backgroundColor: getTaskFirstTagColor(task) }"
            >
              {{ truncateTitle(task.title) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图 -->
    <div v-else-if="currentView === 'day'" class="day-view">
      <div class="day-header-info">
        <div class="day-date-info">
          <span class="day-gregorian">{{ currentDate.getMonth() + 1 }}月{{ currentDate.getDate() }}日</span>
          <span class="day-lunar">{{ currentLunarDate }}</span>
          <span v-if="currentSolarTerm" class="day-solar-term">{{ currentSolarTerm }}</span>
        </div>
      </div>
      <div class="day-timeline">
        <div
          v-for="hour in hours"
          :key="hour"
          class="hour-row"
          :class="{ 'current-hour': isCurrentHour(hour) }"
        >
          <span class="hour-label">{{ hour }}:00</span>
          <div class="hour-content">
            <div
              v-for="task in getHourTasks(hour)"
              :key="task.id"
              class="timeline-task"
              :style="{ backgroundColor: getTaskFirstTagColor(task) }"
            >
              <span class="task-tag-name">{{ getTaskFirstTagName(task) }}</span>
              <span class="task-title">{{ task.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-else-if="currentView === 'year'" class="year-view">
      <div class="year-grid">
        <div
          v-for="month in yearMonths"
          :key="month.value"
          class="month-card"
          :class="{ 'current-month': month.isCurrent }"
          @click="selectMonth(month.value)"
        >
          <h4 class="month-name">{{ month.name }}</h4>
          <div class="month-stats">
            <span class="task-stat">{{ month.taskCount }} 任务</span>
          </div>
          <div class="month-tags" v-if="month.tagColors.length">
            <span
              v-for="(color, idx) in month.tagColors.slice(0, 5)"
              :key="idx"
              class="tag-dot"
              :style="{ backgroundColor: color }"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期的任务详情 -->
    <div v-if="selectedDate && currentView !== 'year'" class="day-tasks-detail">
      <div class="detail-header">
        <div class="detail-title-group">
          <h3 class="day-tasks-title">{{ selectedDateDisplay }}</h3>
          <span v-if="selectedLunarDate" class="detail-lunar">{{ selectedLunarDate }}</span>
        </div>
        <button class="add-task-btn" @click="showAddTask = true">+ 添加任务</button>
      </div>
      <div class="task-list">
        <div
          v-for="task in selectedDateTasks"
          :key="task.id"
          class="task-item"
          :class="{ done: task.status === 'done' }"
        >
          <div class="task-tags">
            <span
              v-for="tag in task.tags"
              :key="tag.id"
              class="task-tag"
              :style="{ backgroundColor: tag.color }"
            >
              {{ tag.name }}
            </span>
          </div>
          <div class="task-main">
            <button
              class="checkbox"
              :class="{ checked: task.status === 'done' }"
              @click="toggleTaskStatus(task)"
            >
              <span class="check-icon"></span>
            </button>
            <span class="task-title">{{ task.title }}</span>
          </div>
        </div>
        <div v-if="selectedDateTasks.length === 0" class="no-tasks">
          该日暂无标签任务
        </div>
      </div>
    </div>

    <!-- 添加任务弹窗 -->
    <div v-if="showAddTask" class="modal-overlay" @click.self="closeAddTask">
      <div class="modal">
        <h3>添加标签任务</h3>
        <div class="form-group">
          <label>选择标签 (必须)</label>
          <div class="tag-selector">
            <button
              v-for="tag in allTags"
              :key="tag.id"
              class="tag-select-btn"
              :class="{ selected: newTaskTagId === tag.id }"
              :style="{ backgroundColor: newTaskTagId === tag.id ? tag.color : 'transparent', borderColor: tag.color }"
              @click="newTaskTagId = tag.id"
            >
              {{ tag.name }}
            </button>
          </div>
          <p v-if="allTags.length === 0" class="hint">
            还没有标签，请先<router-link to="/tags">创建标签</router-link>
          </p>
        </div>
        <div class="form-group">
          <label>任务内容</label>
          <input
            v-model="newTaskTitle"
            type="text"
            placeholder="输入任务内容..."
            @keyup.enter="createTask"
          />
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click="closeAddTask">取消</button>
          <button class="btn-primary" :disabled="!canCreateTask" @click="createTask">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Task, Tag } from '../types'
import { getTasksByRange, createTask as apiCreateTask, updateTask } from '../api/tasks'
import { listTags } from '../api/tags'
import { addTagToTask } from '../api/task_tags'

// 农历数据
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0
]

const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const solarTerm = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至']
const lunarMonth = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const lunarDay = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
const festivals: Record<string, string> = {
  '1-1': '春节', '1-15': '元宵', '5-5': '端午', '7-7': '七夕', '8-15': '中秋', '9-9': '重阳', '12-8': '腊八', '12-23': '小年', '12-30': '除夕'
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
const selectedTagId = ref<number | null>(null)
const monthTasks = ref<Task[]>([])
const allTags = ref<Tag[]>([])
const showAddTask = ref(false)
const newTaskTitle = ref('')
const newTaskTagId = ref<number | null>(null)

// 周日开始的星期
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// 计算属性
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const periodDisplay = computed(() => {
  if (currentView.value === 'year') {
    return `${currentYear.value}年`
  } else if (currentView.value === 'day') {
    const d = currentDate.value
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const selectedDateDisplay = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  const lunar = getLunarDate(date)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${lunar.month}月${lunar.day}`
})

const selectedLunarDate = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  const lunar = getLunarDate(date)
  return `${lunar.year}年${lunar.month}月${lunar.day}`
})

const currentLunarDate = computed(() => {
  const lunar = getLunarDate(currentDate.value)
  return `${lunar.month}月${lunar.day}`
})

const currentSolarTerm = computed(() => {
  return getSolarTerm(currentDate.value)
})

// 筛选后的任务
const filteredTasks = computed(() => {
  if (!selectedTagId.value) return monthTasks.value
  return monthTasks.value.filter(task =>
    task.tags?.some(tag => tag.id === selectedTagId.value)
  )
})

const selectedDateTasks = computed(() => {
  return filteredTasks.value.filter(task => task.due_date === selectedDate.value)
})

const hours = Array.from({ length: 24 }, (_, i) => i)

const canCreateTask = computed(() => newTaskTagId.value && newTaskTitle.value.trim())

// 农历计算函数
function getLunarDate(date: Date) {
  const baseDate = new Date(1900, 0, 31)
  let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)
  
  let year = 1900
  let daysInYear = 0
  
  for (year = 1900; year < 2050 && offset > 0; year++) {
    daysInYear = lYearDays(year)
    offset -= daysInYear
  }
  
  if (offset < 0) {
    offset += daysInYear
    year--
  }
  
  const lunarYear = year
  let month = 1
  let leap = leapMonth(year)
  let isLeap = false
  let daysInMonth = 0
  
  for (month = 1; month < 13 && offset > 0; month++) {
    if (leap > 0 && month === leap + 1 && !isLeap) {
      month--
      isLeap = true
      daysInMonth = leapDays(year)
    } else {
      daysInMonth = monthDays(year, month)
    }
    
    offset -= daysInMonth
    
    if (isLeap && month === leap + 1) {
      isLeap = false
    }
  }
  
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      month--
    }
  }
  
  if (offset < 0) {
    offset += daysInMonth
    month--
  }
  
  const lunarMonth = month
  const lunarDay = offset + 1
  
  return {
    year: lunarYear,
    month: isLeap ? '闰' + lunarMonth : lunarMonth,
    day: lunarDay,
    dayStr: lunarDay <= 30 ? lunarDay[lunarDay - 1] : ''
  }
}

function lYearDays(y: number) {
  let i, sum = 348
  for (i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[y - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(y)
}

function leapDays(y: number) {
  if (leapMonth(y)) {
    return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

function leapMonth(y: number) {
  return lunarInfo[y - 1900] & 0xf
}

function monthDays(y: number, m: number) {
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29
}

// 节气计算
function getSolarTerm(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  
  const termInfo = [
    6, 20, 4, 19, 6, 21, 5, 20, 6, 21, 6, 21, 7, 23, 8, 23, 8, 23, 9, 24, 8, 23, 7, 22
  ]
  
  const termIndex = m * 2
  if (d === termInfo[termIndex]) return solarTerm[termIndex]
  if (d === termInfo[termIndex + 1]) return solarTerm[termIndex + 1]
  
  // 检查节日
  const festivalKey = `${m + 1}-${d}`
  return festivals[festivalKey] || ''
}

// 生成日历天数 - 周日开始
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 周日开始：0=周日, 1=周一, ..., 6=周六
  let firstDayWeek = firstDay.getDay()
  
  const days = []
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  
  // 上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(year, month - 1, day)
    const dateStr = formatDate(date)
    const lunar = getLunarDate(date)
    const solarTerm = getSolarTerm(date)
    days.push({ 
      day, 
      dateStr, 
      isCurrentMonth: false, 
      isToday: dateStr === formatDate(new Date()),
      lunarDay: lunar.dayStr,
      solarTerm,
      isFestival: !!festivals[`${date.getMonth() + 1}-${date.getDate()}`]
    })
  }
  
  // 当前月的日期
  const today = formatDate(new Date())
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const dateStr = formatDate(date)
    const lunar = getLunarDate(date)
    const solarTerm = getSolarTerm(date)
    days.push({ 
      day: i, 
      dateStr, 
      isCurrentMonth: true, 
      isToday: dateStr === today,
      lunarDay: lunar.dayStr,
      solarTerm,
      isFestival: !!festivals[`${month + 1}-${i}`]
    })
  }
  
  // 下个月的日期
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    const dateStr = formatDate(date)
    const lunar = getLunarDate(date)
    const solarTerm = getSolarTerm(date)
    days.push({ 
      day: i, 
      dateStr, 
      isCurrentMonth: false, 
      isToday: dateStr === today,
      lunarDay: lunar.dayStr,
      solarTerm,
      isFestival: !!festivals[`${date.getMonth() + 1}-${date.getDate()}`]
    })
  }
  return days
})

// 年视图数据
const yearMonths = computed(() => {
  return monthNames.map((name, index) => {
    const monthTasks = filteredTasks.value.filter(task => {
      const taskDate = new Date(task.due_date)
      return taskDate.getMonth() === index && taskDate.getFullYear() === currentYear.value
    })
    const tagColors = [...new Set(monthTasks.flatMap(t => t.tags?.map(tag => tag.color) || []))]
    return {
      name,
      value: index,
      taskCount: monthTasks.length,
      tagColors,
      isCurrent: index === new Date().getMonth() && currentYear.value === new Date().getFullYear()
    }
  })
})

// 加载数据
onMounted(() => {
  loadTags()
  loadTasks()
  selectedDate.value = formatDate(new Date())
})

async function loadTags() {
  try {
    allTags.value = await listTags()
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

async function loadTasks() {
  try {
    let start, end
    if (currentView.value === 'year') {
      start = `${currentYear.value}-01-01`
      end = `${currentYear.value}-12-31`
    } else {
      const { start: s, end: e } = getMonthRange()
      start = s
      end = e
    }
    monthTasks.value = await getTasksByRange(start, end)
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getMonthRange() {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return {
    start: formatDate(new Date(year, month, 1)),
    end: formatDate(new Date(year, month + 1, 0))
  }
}

function switchView(view: string) {
  currentView.value = view
  loadTasks()
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
  loadTasks()
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
  loadTasks()
}

function goToToday() {
  currentDate.value = new Date()
  selectedDate.value = formatDate(new Date())
  loadTasks()
}

function selectDate(date: { dateStr: string }) {
  selectedDate.value = date.dateStr
  if (currentView.value === 'month') {
    currentDate.value = new Date(date.dateStr)
  }
}

function selectMonth(month: number) {
  currentDate.value = new Date(currentYear.value, month, 1)
  currentView.value = 'month'
  loadTasks()
}

function getDayTaskCount(dateStr: string): number {
  return filteredTasks.value.filter(task => task.due_date === dateStr).length
}

function getDayTasksPreview(dateStr: string): Task[] {
  return filteredTasks.value.filter(task => task.due_date === dateStr).slice(0, 3)
}

function getHourTasks(hour: number): Task[] {
  const dateStr = formatDate(currentDate.value)
  return filteredTasks.value.filter(task => {
    if (task.due_date !== dateStr) return false
    const taskHour = parseInt(task.due_time?.split(':')[0] || '0')
    return taskHour === hour
  })
}

function isCurrentHour(hour: number): boolean {
  const now = new Date()
  return formatDate(now) === formatDate(currentDate.value) && now.getHours() === hour
}

function getTaskFirstTagColor(task: Task): string {
  return task.tags?.[0]?.color || 'var(--accent-primary)'
}

function getTaskFirstTagName(task: Task): string {
  return task.tags?.[0]?.name || ''
}

function truncateTitle(title: string): string {
  return title.length <= 8 ? title : title.slice(0, 8) + '...'
}

async function toggleTaskStatus(task: Task) {
  try {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    await updateTask(task.id, { status: newStatus })
    await loadTasks()
  } catch (error) {
    console.error('更新任务失败:', error)
  }
}

function closeAddTask() {
  showAddTask.value = false
  newTaskTitle.value = ''
  newTaskTagId.value = null
}

async function createTask() {
  if (!canCreateTask.value) return
  try {
    const task = await apiCreateTask({
      title: newTaskTitle.value.trim(),
      due_date: selectedDate.value,
      source: 'calendar'
    })
    if (newTaskTagId.value) {
      await addTagToTask(task.id, newTaskTagId.value)
    }
    closeAddTask()
    await loadTasks()
  } catch (error) {
    console.error('创建任务失败:', error)
  }
}

watch([currentDate, selectedTagId], () => {
  loadTasks()
})
</script>

<style scoped>
.calendar-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* 头部 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
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
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-full);
  transition: var(--transition-normal);
}

.nav-arrow:hover {
  background-color: var(--bg-hover);
}

.arrow-left,
.arrow-right {
  display: block;
  width: 8px;
  height: 8px;
  border-style: solid;
  border-color: var(--text-secondary);
  border-width: 0 2px 2px 0;
  transition: var(--transition-normal);
}

.arrow-left {
  transform: rotate(135deg);
  margin-left: 2px;
}

.arrow-right {
  transform: rotate(-45deg);
  margin-right: 2px;
}

.current-period {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  min-width: 120px;
  text-align: center;
}

.today-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.today-btn:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 标签筛选 */
.tag-filter {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.filter-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.tag-list {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tag-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
  background: transparent;
}

.tag-btn.all.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 月视图 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.weekday {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  padding: var(--space-2);
}

.weekday:first-child {
  color: var(--accent-danger);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  min-height: 80px;
  position: relative;
}

.calendar-day:hover {
  background: var(--bg-hover);
}

.calendar-day.other-month {
  opacity: 0.4;
}

.calendar-day.today {
  background: var(--accent-primary);
  color: white;
}

.calendar-day.today .lunar-day,
.calendar-day.today .solar-term {
  color: rgba(255, 255, 255, 0.8);
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
}

.lunar-day {
  font-size: 10px;
  color: var(--text-muted);
}

.lunar-day.lunar-festival {
  color: var(--accent-danger);
  font-weight: var(--font-weight-medium);
}

.day-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 32px;
}

.solar-term {
  font-size: 10px;
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

.task-count {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
}

.calendar-day.today .task-count {
  color: white;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
}

.task-block {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  color: white;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* 日视图 */
.day-view {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
}

.day-header-info {
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.day-date-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.day-gregorian {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.day-lunar {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-3);
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.day-solar-term {
  font-size: var(--font-size-sm);
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
  padding: var(--space-1) var(--space-3);
  background: var(--accent-primary-light);
  border-radius: var(--radius-md);
}

.day-timeline {
  display: flex;
  flex-direction: column;
}

.hour-row {
  display: flex;
  min-height: 60px;
  border-bottom: 1px solid var(--border-light);
}

.hour-row:last-child {
  border-bottom: none;
}

.hour-row.current-hour {
  background: rgba(var(--accent-primary-rgb), 0.05);
}

.hour-label {
  width: 60px;
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: right;
  border-right: 1px solid var(--border-light);
}

.hour-content {
  flex: 1;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.timeline-task {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: white;
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.task-tag-name {
  font-size: var(--font-size-xs);
  opacity: 0.9;
  padding: 2px 6px;
  background: rgba(255,255,255,0.2);
  border-radius: var(--radius-sm);
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
  padding: var(--space-4);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.month-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.month-card.current-month {
  border-color: var(--accent-primary);
  background: rgba(var(--accent-primary-rgb), 0.05);
}

.month-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.month-stats {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.month-tags {
  display: flex;
  gap: var(--space-1);
}

.tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* 任务详情 */
.day-tasks-detail {
  margin-top: var(--space-6);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.detail-title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.day-tasks-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.detail-lunar {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.add-task-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.task-item.done {
  opacity: 0.6;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.task-tag {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: white;
}

.task-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox.checked {
  background: var(--accent-success);
  border-color: var(--accent-success);
}

.check-icon {
  display: block;
  width: 5px;
  height: 9px;
  border-style: solid;
  border-color: white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.task-title {
  flex: 1;
  color: var(--text-primary);
}

.no-tasks {
  text-align: center;
  padding: var(--space-6);
  color: var(--text-muted);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 400px;
}

.modal h3 {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-select-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
  transition: var(--transition-normal);
}

.tag-select-btn.selected {
  color: white;
}

.hint {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-primary {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .lunar-day,
  .solar-term {
    font-size: 9px;
  }
}
</style>