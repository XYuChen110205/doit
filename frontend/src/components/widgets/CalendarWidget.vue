<template>
  <div class="calendar-widget">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="calendar-preview" @click="openDetail">
      <div class="preview-header">
        <SvgIcon name="Calendar" :size="20" />
        <span>{{ currentMonth }}</span>
      </div>
      <div class="mini-calendar">
        <div class="weekdays">
          <span v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="weekday">{{ day }}</span>
        </div>
        <div class="days">
          <span
            v-for="date in miniCalendarDays"
            :key="date.date"
            class="day"
            :class="{ 
              'other-month': !date.isCurrentMonth, 
              'today': date.isToday,
              'has-event': date.hasEvent 
            }"
          >
            {{ date.day }}
          </span>
        </div>
      </div>
      <div class="preview-footer">
        <span class="event-count">{{ monthEventCount }} 个事件</span>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="calendar-detail">
      <div class="detail-header">
        <button class="back-btn" @click="closeDetail">
          <SvgIcon name="ChevronLeft" :size="20" />
          返回
        </button>
        <div class="month-nav">
          <button class="nav-btn" @click="prevMonth">
            <SvgIcon name="ChevronLeft" :size="18" />
          </button>
          <h2>{{ currentYearMonth }}</h2>
          <button class="nav-btn" @click="nextMonth">
            <SvgIcon name="ChevronRight" :size="18" />
          </button>
        </div>
        <button class="today-btn" @click="goToToday">今天</button>
      </div>

      <div class="calendar-body">
        <div class="calendar-grid">
          <div class="weekday-header" v-for="day in ['周日', '周一', '周二', '周三', '周四', '周五', '周六']" :key="day">
            {{ day }}
          </div>
          <div
            v-for="date in calendarDays"
            :key="date.date"
            class="calendar-day"
            :class="{ 
              'other-month': !date.isCurrentMonth, 
              'today': date.isToday,
              'selected': selectedDate === date.date
            }"
            @click="selectDate(date)"
          >
            <span class="day-number">{{ date.day }}</span>
            <div class="day-events">
              <span
                v-for="(event, idx) in getDayEvents(date.date).slice(0, 3)"
                :key="idx"
                class="event-dot"
                :style="{ backgroundColor: event.color }"
              ></span>
            </div>
          </div>
        </div>

        <div class="selected-date-panel" v-if="selectedDate">
          <div class="panel-header">
            <h3>{{ formatSelectedDate }}</h3>
            <button class="add-btn" @click="showAddEvent = true">
              <SvgIcon name="Plus" :size="16" />
              添加事件
            </button>
          </div>
          <div class="events-list">
            <div
              v-for="(event, index) in getDayEvents(selectedDate)"
              :key="index"
              class="event-item"
              :style="{ borderLeftColor: event.color }"
            >
              <div class="event-content">
                <span class="event-title">{{ event.title }}</span>
                <span v-if="event.time" class="event-time">{{ event.time }}</span>
              </div>
              <button class="delete-btn" @click="deleteEvent(index)">
                <SvgIcon name="Trash" :size="14" />
              </button>
            </div>
            <div v-if="getDayEvents(selectedDate).length === 0" class="no-events">
              暂无事件
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加事件弹窗 -->
    <BaseModal
      v-if="showAddEvent"
      :is-open="showAddEvent"
      title="添加事件"
      @close="showAddEvent = false"
    >
      <div class="form-group">
        <label>事件名称</label>
        <input v-model="newEvent.title" placeholder="输入事件名称..." />
      </div>
      <div class="form-group">
        <label>时间（可选）</label>
        <input v-model="newEvent.time" type="time" />
      </div>
      <div class="form-group">
        <label>颜色标记</label>
        <div class="color-picker">
          <button
            v-for="color in eventColors"
            :key="color"
            class="color-option"
            :style="{ backgroundColor: color }"
            :class="{ selected: newEvent.color === color }"
            @click="newEvent.color = color"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAddEvent = false">取消</button>
        <button class="btn-primary" @click="addEvent" :disabled="!newEvent.title">添加</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'
import BaseModal from '../base/BaseModal.vue'

interface CalendarEvent {
  id: string
  date: string
  title: string
  time?: string
  color: string
}

interface CalendarData {
  events?: CalendarEvent[]
}

const props = defineProps<{
  instanceId: string
  initialData?: CalendarData
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: CalendarData]
  openDetail: []
  closeDetail: []
}>()

const eventColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8', '#a29bfe']

const events = ref<CalendarEvent[]>([])
const currentDate = ref(new Date())
const selectedDate = ref('')
const showAddEvent = ref(false)

const newEvent = ref({
  title: '',
  time: '',
  color: eventColors[0]
})

const currentMonth = computed(() => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return months[currentDate.value.getMonth()]
})

const currentYearMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
})

const monthEventCount = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return events.value.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
})

const miniCalendarDays = computed(() => generateCalendarDays(true))
const calendarDays = computed(() => generateCalendarDays(false))

function generateCalendarDays(isMini: boolean) {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    const isToday = date.toDateString() === today.toDateString()
    const hasEvent = events.value.some(e => e.date === dateStr)
    
    days.push({
      date: dateStr,
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      hasEvent
    })
  }
  
  return isMini ? days.slice(0, 28) : days
}

function loadData() {
  if (props.initialData?.events) {
    events.value = props.initialData.events
  }
}

function saveData() {
  emit('update', { events: events.value })
}

function getDayEvents(dateStr: string) {
  return events.value.filter(e => e.date === dateStr)
}

function selectDate(date: any) {
  selectedDate.value = date.date
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function goToToday() {
  currentDate.value = new Date()
  const today = new Date().toISOString().split('T')[0]
  selectedDate.value = today
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  emit('closeDetail')
}

function addEvent() {
  if (!newEvent.value.title || !selectedDate.value) return
  
  events.value.push({
    id: Date.now().toString(),
    date: selectedDate.value,
    title: newEvent.value.title,
    time: newEvent.value.time,
    color: newEvent.value.color
  })
  
  saveData()
  
  newEvent.value = {
    title: '',
    time: '',
    color: eventColors[0]
  }
  showAddEvent.value = false
}

function deleteEvent(index: number) {
  const dayEvents = getDayEvents(selectedDate.value)
  const eventToDelete = dayEvents[index]
  events.value = events.value.filter(e => e.id !== eventToDelete.id)
  saveData()
}

onMounted(() => {
  loadData()
  const today = new Date().toISOString().split('T')[0]
  selectedDate.value = today
})
</script>

<style scoped>
.calendar-widget {
  height: 100%;
}

/* 缩略图预览 */
.calendar-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  cursor: pointer;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.mini-calendar {
  flex: 1;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.weekday {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 6px;
  position: relative;
}

.day.other-month {
  color: var(--text-muted);
  opacity: 0.5;
}

.day.today {
  background: var(--accent-primary);
  color: white;
  font-weight: 600;
}

.day.has-event::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  background: var(--accent-danger);
  border-radius: 50%;
}

.preview-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
}

/* 详情页 */
.calendar-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
}

.month-nav h2 {
  font-size: 18px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.today-btn {
  padding: 8px 16px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.calendar-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.calendar-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(6, 1fr);
  gap: 1px;
  background: var(--border);
  padding: 1px;
}

.weekday-header {
  background: var(--bg-hover);
  padding: 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.calendar-day {
  background: var(--bg-primary);
  padding: 8px;
  cursor: pointer;
  transition: var(--transition-normal);
  min-height: 80px;
}

.calendar-day:hover {
  background: var(--bg-hover);
}

.calendar-day.other-month {
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.calendar-day.today {
  background: rgba(74, 144, 217, 0.1);
}

.calendar-day.today .day-number {
  background: var(--accent-primary);
  color: white;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
}

.calendar-day.selected {
  box-shadow: inset 0 0 0 2px var(--accent-primary);
}

.day-number {
  font-size: 14px;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* 选中日期面板 */
.selected-date-panel {
  width: 300px;
  border-left: 1px solid var(--border);
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.events-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid;
}

.event-content {
  flex: 1;
}

.event-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.event-time {
  font-size: 12px;
  color: var(--text-muted);
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.event-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.no-events {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--transition-normal);
}

.color-option.selected {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent-primary);
  border: none;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .calendar-body {
    flex-direction: column;
  }
  
  .selected-date-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border);
    max-height: 300px;
  }
  
  .calendar-day {
    min-height: 60px;
  }
}
</style>
