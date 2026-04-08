<template>
  <div class="makeup-calendar">
    <!-- 顶部导航 -->
    <div class="calendar-header">
      <div class="view-tabs">
        <button class="tab-btn active">日历</button>
        <button class="tab-btn" @click="$router.push('/makeup/appointments')">列表</button>
      </div>
    </div>

    <!-- 月份导航 -->
    <div class="month-nav">
      <button class="nav-btn" @click="changeMonth(-1)">
        <span class="arrow left"></span>
      </button>
      <div class="month-title">
        <span class="year">{{ currentYear }}</span>
        <span class="month">{{ String(currentMonth).padStart(2, '0') }}</span>
      </div>
      <button class="nav-btn" @click="changeMonth(1)">
        <span class="arrow right"></span>
      </button>
      <div class="nav-actions">
        <button class="icon-btn search" title="搜索">
          <span class="icon"></span>
        </button>
        <button class="icon-btn filter" title="筛选">
          <span class="icon"></span>
        </button>
      </div>
    </div>

    <!-- 星期标题 -->
    <div class="weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday" :class="{ weekend: day === '日' || day === '六' }">
        {{ day }}
      </div>
    </div>

    <!-- 日历网格 -->
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
          <span v-if="date.taskCount > 0" class="task-badge">+{{ date.taskCount }}</span>
        </div>
        <div class="lunar-date">{{ date.lunar }}</div>
        <div class="day-tasks">
          <div
            v-for="task in date.tasks.slice(0, 4)"
            :key="task.id"
            class="task-tag-block"
            :style="{ backgroundColor: getTagColor(task) }"
          >
            {{ getTagName(task) }}
          </div>
          <div v-if="date.tasks.length > 4" class="more-tasks">+{{ date.tasks.length - 4 }}</div>
        </div>
      </div>
    </div>

    <!-- 选中日期的任务详情 -->
    <div v-if="selectedDate" class="day-detail">
      <div class="detail-header">
        <h3>{{ selectedDateDisplay }}</h3>
        <button class="add-btn" @click="showAddModal = true">+ 添加预约</button>
      </div>
      <div class="detail-list">
        <div
          v-for="task in selectedDateTasks"
          :key="task.id"
          class="detail-item"
          :style="{ borderLeftColor: getTagColor(task) }"
        >
          <div class="item-time">{{ task.time || '全天' }}</div>
          <div class="item-content">
            <span class="item-tag" :style="{ backgroundColor: getTagColor(task) }">
              {{ getTagName(task) }}
            </span>
            <span class="item-title">{{ task.title }}</span>
          </div>
          <div class="item-status" :class="task.status">{{ statusText[task.status] }}</div>
        </div>
        <div v-if="selectedDateTasks.length === 0" class="empty-detail">
          暂无预约
        </div>
      </div>
    </div>

    <!-- 添加预约弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <h3>添加预约</h3>
        <div class="form-group">
          <label>服务类型</label>
          <div class="service-tags">
            <button
              v-for="service in services"
              :key="service.name"
              class="service-tag"
              :class="{ selected: selectedService === service.name }"
              :style="{ backgroundColor: selectedService === service.name ? service.color : 'transparent', borderColor: service.color }"
              @click="selectedService = service.name"
            >
              {{ service.name }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>客户姓名</label>
          <input v-model="newTask.clientName" type="text" placeholder="输入客户姓名" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>时间</label>
            <input v-model="newTask.time" type="time" />
          </div>
          <div class="form-group">
            <label>价格</label>
            <input v-model="newTask.price" type="number" placeholder="¥" />
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="newTask.notes" type="text" placeholder="可选" />
        </div>
        <div class="form-actions">
          <button class="btn-cancel" @click="closeAddModal">取消</button>
          <button class="btn-confirm" :disabled="!canAdd" @click="addAppointment">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// 服务类型配置（带颜色）
const services = [
  { name: '约妆', color: '#ff4757' },
  { name: '全能班写', color: '#a55eea' },
  { name: '互勉', color: '#26de81' },
  { name: '新娘跟妆', color: '#fd79a8' },
  { name: '上门妆', color: '#fdcb6e' },
  { name: '私教课', color: '#00b894' },
  { name: '写真进修', color: '#e17055' }
]

// 农历数据（简化版）
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

const festivals: Record<string, string> = {
  '2026-01-01': '元旦',
  '2026-02-17': '元宵节',
  '2026-03-08': '妇女节',
  '2026-04-05': '清明节',
  '2026-05-01': '劳动节',
  '2026-06-19': '端午节',
  '2026-09-25': '中秋节',
  '2026-10-01': '国庆节'
}

interface Appointment {
  id: string
  date: string
  time?: string
  title: string
  clientName: string
  service: string
  price?: number
  status: 'pending' | 'confirmed' | 'completed'
  notes?: string
}

const currentDate = ref(new Date())
const selectedDate = ref('')
const showAddModal = ref(false)
const selectedService = ref('')
const appointments = ref<Appointment[]>([])

const newTask = ref({
  clientName: '',
  time: '09:00',
  price: '',
  notes: ''
})

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

const selectedDateDisplay = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const canAdd = computed(() => selectedService.value && newTask.value.clientName.trim())

// 生成日历数据
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let firstDayWeek = firstDay.getDay()

  const days = []
  const today = formatDate(new Date())

  // 上月日期
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const dateStr = formatDate(new Date(year, month - 1, day))
    days.push(createDayData(day, dateStr, false, today))
  }

  // 当月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = formatDate(new Date(year, month, i))
    days.push(createDayData(i, dateStr, true, today))
  }

  // 下月日期
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const dateStr = formatDate(new Date(year, month + 1, i))
    days.push(createDayData(i, dateStr, false, today))
  }

  return days
})

const selectedDateTasks = computed(() => {
  return appointments.value
    .filter(a => a.date === selectedDate.value)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
})

const statusText: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成'
}

function createDayData(day: number, dateStr: string, isCurrentMonth: boolean, today: string) {
  const date = new Date(dateStr)
  const dayTasks = appointments.value.filter(a => a.date === dateStr)

  // 计算农历（简化算法）
  const lunarDay = getLunarDay(date)
  const festival = festivals[dateStr]

  return {
    day,
    dateStr,
    isCurrentMonth,
    isToday: dateStr === today,
    lunar: festival || lunarDay,
    taskCount: dayTasks.length,
    tasks: dayTasks.slice(0, 5)
  }
}

// 简化农历计算
function getLunarDay(date: Date): string {
  const baseDate = new Date(2026, 0, 1) // 2026-01-01 是农历十三
  const baseLunar = 12
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  const lunarIndex = (baseLunar + diffDays) % 30
  return lunarDays[(lunarIndex + 30) % 30]
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function changeMonth(delta: number) {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentDate.value = newDate
}

function selectDate(date: { dateStr: string }) {
  selectedDate.value = date.dateStr
}

function getTagColor(task: Appointment): string {
  const service = services.find(s => s.name === task.service)
  return service?.color || '#ff4757'
}

function getTagName(task: Appointment): string {
  return task.service
}

function closeAddModal() {
  showAddModal.value = false
  selectedService.value = ''
  newTask.value = { clientName: '', time: '09:00', price: '', notes: '' }
}

function addAppointment() {
  if (!canAdd.value) return

  const appointment: Appointment = {
    id: Date.now().toString(),
    date: selectedDate.value,
    time: newTask.value.time,
    title: `${selectedService.value} - ${newTask.value.clientName}`,
    clientName: newTask.value.clientName,
    service: selectedService.value,
    price: Number(newTask.value.price) || 0,
    status: 'pending',
    notes: newTask.value.notes
  }

  appointments.value.push(appointment)
  saveAppointments()
  closeAddModal()
}

function saveAppointments() {
  localStorage.setItem('makeup_appointments', JSON.stringify(appointments.value))
}

function loadAppointments() {
  const saved = localStorage.getItem('makeup_appointments')
  if (saved) {
    appointments.value = JSON.parse(saved)
  } else {
    // 初始化示例数据
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    appointments.value = [
      { id: '1', date: `${year}-${String(month).padStart(2, '0')}-01`, time: '10:00', title: '约妆 - 张女士', clientName: '张女士', service: '约妆', price: 128, status: 'confirmed' },
      { id: '2', date: `${year}-${String(month).padStart(2, '0')}-01`, time: '14:00', title: '全能班写 - 学员A', clientName: '学员A', service: '全能班写', price: 0, status: 'pending' },
      { id: '3', date: `${year}-${String(month).padStart(2, '0')}-01`, time: '16:00', title: '互勉 - 模特B', clientName: '模特B', service: '互勉', price: 0, status: 'confirmed' },
      { id: '4', date: `${year}-${String(month).padStart(2, '0')}-03`, time: '09:00', title: '新娘跟妆 - 李小姐', clientName: '李小姐', service: '新娘跟妆', price: 888, status: 'confirmed' },
      { id: '5', date: `${year}-${String(month).padStart(2, '0')}-05`, time: '13:00', title: '私教课 - 学员C', clientName: '学员C', service: '私教课', price: 299, status: 'pending' }
    ]
    saveAppointments()
  }
}

onMounted(() => {
  loadAppointments()
  selectedDate.value = formatDate(new Date())
})

watch(currentDate, () => {
  loadAppointments()
})
</script>

<style scoped>
.makeup-calendar {
  padding: var(--space-4);
  max-width: 800px;
  margin: 0 auto;
}

/* 顶部导航 */
.calendar-header {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.view-tabs {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  padding: var(--space-1);
}

.tab-btn {
  padding: var(--space-2) var(--space-6);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-normal);
}

.tab-btn.active {
  background: #ff4757;
  color: white;
}

/* 月份导航 */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  position: relative;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow {
  display: block;
  width: 10px;
  height: 10px;
  border-style: solid;
  border-color: var(--text-primary);
  border-width: 0 2px 2px 0;
}

.arrow.left {
  transform: rotate(135deg);
}

.arrow.right {
  transform: rotate(-45deg);
}

.month-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.month-title .year {
  font-size: var(--font-size-xl);
}

.month-title .month {
  font-size: var(--font-size-2xl);
}

.nav-actions {
  position: absolute;
  right: 0;
  display: flex;
  gap: var(--space-2);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.search::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-secondary);
  border-radius: 50%;
  position: relative;
}

.icon-btn.filter::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--text-secondary);
  box-shadow: 0 -5px 0 var(--text-secondary), 0 5px 0 var(--text-secondary);
}

/* 星期标题 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.weekday {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--space-2);
}

.weekday.weekend {
  color: #ff4757;
}

/* 日历网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
}

.calendar-day {
  aspect-ratio: 1;
  min-height: 80px;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-day:hover {
  background: var(--bg-hover);
}

.calendar-day.other-month {
  opacity: 0.4;
}

.calendar-day.today {
  background: rgba(255, 71, 87, 0.1);
}

.calendar-day.today .day-number {
  background: #ff4757;
  color: white;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.calendar-day.selected {
  box-shadow: 0 0 0 2px #ff4757;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.day-number {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.task-badge {
  font-size: 10px;
  color: #ff4757;
  font-weight: var(--font-weight-bold);
}

.lunar-date {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow: hidden;
}

.task-tag-block {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  color: white;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-tasks {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
}

/* 详情面板 */
.day-detail {
  margin-top: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.detail-header h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.add-btn {
  padding: var(--space-2) var(--space-3);
  background: #ff4757;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  border-left: 4px solid;
}

.item-time {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 50px;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.item-tag {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: white;
}

.item-title {
  color: var(--text-primary);
}

.item-status {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.item-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.item-status.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.item-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.empty-detail {
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
  padding: var(--space-4);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 400px;
}

.modal h3 {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--space-3);
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.service-tag {
  padding: var(--space-2) var(--space-3);
  border: 1px solid;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  background: transparent;
  transition: var(--transition-normal);
}

.service-tag.selected {
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.btn-cancel {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-confirm {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: #ff4757;
  color: white;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .makeup-calendar {
    padding: var(--space-2);
  }

  .calendar-day {
    min-height: 60px;
  }

  .task-tag-block {
    font-size: 9px;
    padding: 1px 2px;
  }

  .nav-actions {
    display: none;
  }
}
</style>
