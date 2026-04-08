<template>
  <div class="custom-dashboard">
    <div class="dashboard-header">
      <div class="header-title">
        <h1>我的工作台</h1>
        <p class="subtitle">完全自定义你的工作空间</p>
      </div>
      <div class="header-actions">
        <button class="edit-btn" @click="isEditing = !isEditing">{{ isEditing ? '完成' : '编辑布局' }}</button>
        <button class="add-widget-btn" @click="showWidgetModal = true" v-if="isEditing">+ 添加组件</button>
      </div>
    </div>

    <div class="widget-grid" :class="{ editing: isEditing }">
      <div
        v-for="(widget, index) in widgets"
        :key="widget.id"
        class="widget-card"
        :class="[widget.size, { editing: isEditing }]"
        :style="isEditing ? { cursor: 'move' } : {}"
        draggable="true"
        @dragstart="dragStart(index)"
        @dragover.prevent
        @drop="drop(index)"
      >
        <div class="widget-header" v-if="isEditing">
          <span class="drag-handle">⋮⋮</span>
          <button class="remove-btn" @click="removeWidget(index)">×</button>
        </div>

        <!-- 待办组件 -->
        <template v-if="widget.type === 'todo'">
          <h3>待办事项</h3>
          <div class="todo-widget">
            <div class="todo-input">
              <input v-model="newTodo" type="text" placeholder="添加待办..." @keyup.enter="addTodo" />
              <button @click="addTodo">+</button>
            </div>
            <div class="todo-list">
              <div v-for="(todo, i) in todos" :key="i" class="todo-item" :class="{ completed: todo.completed }">
                <input type="checkbox" v-model="todo.completed" />
                <span>{{ todo.text }}</span>
                <button class="delete-btn" @click="removeTodo(i)">×</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 快捷链接组件 -->
        <template v-if="widget.type === 'links'">
          <h3>快捷链接</h3>
          <div class="links-widget">
            <a v-for="link in quickLinks" :key="link.name" :href="link.url" target="_blank" class="link-item">
              <div class="link-icon" :style="{ background: link.color }"></div>
              <span>{{ link.name }}</span>
            </a>
          </div>
        </template>

        <!-- 笔记组件 -->
        <template v-if="widget.type === 'notes'">
          <h3>快速笔记</h3>
          <div class="notes-widget">
            <textarea v-model="quickNote" placeholder="记录你的想法..."></textarea>
          </div>
        </template>

        <!-- 天气组件 -->
        <template v-if="widget.type === 'weather'">
          <h3>天气</h3>
          <div class="weather-widget">
            <div class="weather-main">
              <div class="weather-temp">{{ weather.temp }}°</div>
              <div class="weather-desc">{{ weather.desc }}</div>
            </div>
            <div class="weather-info">
              <span>湿度 {{ weather.humidity }}%</span>
              <span>风速 {{ weather.wind }}km/h</span>
            </div>
          </div>
        </template>

        <!-- 日历组件 -->
        <template v-if="widget.type === 'calendar'">
          <h3>日历</h3>
          <div class="calendar-widget">
            <div class="calendar-header">
              <button @click="prevMonth">&lt;</button>
              <span>{{ currentMonth }}</span>
              <button @click="nextMonth">&gt;</button>
            </div>
            <div class="calendar-grid">
              <div v-for="day in weekDays" :key="day" class="week-day">{{ day }}</div>
              <div
                v-for="date in calendarDays"
                :key="date.date"
                class="calendar-day"
                :class="{ today: date.isToday, other: date.isOtherMonth }"
              >
                {{ date.day }}
              </div>
            </div>
          </div>
        </template>

        <!-- 统计组件 -->
        <template v-if="widget.type === 'stats'">
          <h3>今日统计</h3>
          <div class="stats-widget">
            <div class="stat-item">
              <div class="stat-num">{{ stats.tasks }}</div>
              <div class="stat-label">完成任务</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.focus }}</div>
              <div class="stat-label">专注分钟</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.notes }}</div>
              <div class="stat-label">笔记数量</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 添加组件弹窗 -->
    <div v-if="showWidgetModal" class="modal-overlay" @click.self="showWidgetModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加组件</h3>
          <button class="close-btn" @click="showWidgetModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="widget-options">
            <div
              v-for="option in widgetOptions"
              :key="option.type"
              class="widget-option"
              @click="addWidget(option.type)"
            >
              <div class="option-icon" :class="option.type"></div>
              <span class="option-name">{{ option.name }}</span>
              <span class="option-desc">{{ option.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const isEditing = ref(false)
const showWidgetModal = ref(false)
const dragIndex = ref(-1)

// 组件列表
const widgets = ref([
  { id: 1, type: 'todo', size: 'medium' },
  { id: 2, type: 'stats', size: 'small' },
  { id: 3, type: 'links', size: 'small' },
  { id: 4, type: 'notes', size: 'medium' },
  { id: 5, type: 'weather', size: 'small' },
  { id: 6, type: 'calendar', size: 'medium' }
])

const widgetOptions = [
  { type: 'todo', name: '待办事项', desc: '管理你的待办任务' },
  { type: 'links', name: '快捷链接', desc: '快速访问常用网站' },
  { type: 'notes', name: '快速笔记', desc: '随时记录想法' },
  { type: 'weather', name: '天气', desc: '查看当前天气' },
  { type: 'calendar', name: '日历', desc: '查看日历' },
  { type: 'stats', name: '统计', desc: '今日数据统计' }
]

// 待办数据
const newTodo = ref('')
const todos = ref([
  { text: '完成项目文档', completed: false },
  { text: '回复邮件', completed: true },
  { text: '学习新技术', completed: false }
])

function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({ text: newTodo.value, completed: false })
    newTodo.value = ''
  }
}

function removeTodo(index: number) {
  todos.value.splice(index, 1)
}

// 快捷链接
const quickLinks = ref([
  { name: 'GitHub', url: 'https://github.com', color: '#333' },
  { name: 'LeetCode', url: 'https://leetcode.com', color: '#ffa116' },
  { name: '掘金', url: 'https://juejin.cn', color: '#1e80ff' },
  { name: '知乎', url: 'https://zhihu.com', color: '#0084ff' }
])

// 笔记
const quickNote = ref('')

// 天气
const weather = ref({ temp: 22, desc: '多云', humidity: 65, wind: 12 })

// 日历
const currentDate = ref(new Date())
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const currentMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isOtherMonth: true, isToday: false, date: '' })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === new Date().getDate() && month === new Date().getMonth()
    days.push({ day: i, isOtherMonth: false, isToday, date: `${year}-${month + 1}-${i}` })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isOtherMonth: true, isToday: false, date: '' })
  }
  return days
})

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

// 统计
const stats = ref({ tasks: 5, focus: 120, notes: 8 })

// 拖拽
function dragStart(index: number) {
  dragIndex.value = index
}

function drop(index: number) {
  if (dragIndex.value !== -1 && dragIndex.value !== index) {
    const item = widgets.value[dragIndex.value]
    widgets.value.splice(dragIndex.value, 1)
    widgets.value.splice(index, 0, item)
  }
  dragIndex.value = -1
}

function addWidget(type: string) {
  widgets.value.push({
    id: Date.now(),
    type,
    size: type === 'todo' || type === 'notes' || type === 'calendar' ? 'medium' : 'small'
  })
  showWidgetModal.value = false
}

function removeWidget(index: number) {
  widgets.value.splice(index, 1)
}
</script>

<style scoped>
.custom-dashboard {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.header-title h1 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.edit-btn, .add-widget-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.edit-btn {
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.add-widget-btn {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.widget-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.widget-card.editing {
  border: 2px dashed var(--accent-primary);
}

.widget-card.small {
  grid-row: span 1;
}

.widget-card.medium {
  grid-row: span 2;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.drag-handle {
  color: var(--text-secondary);
  cursor: move;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--error);
  color: var(--text-inverse);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-md);
}

.widget-card h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

/* 待办组件 */
.todo-widget {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.todo-input {
  display: flex;
  gap: var(--space-2);
}

.todo-input input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.todo-input button {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-lg);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.todo-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.todo-item.completed span {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.todo-item span {
  flex: 1;
  font-size: var(--font-size-sm);
}

.delete-btn {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
}

.delete-btn:hover {
  color: var(--error);
}

/* 链接组件 */
.links-widget {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: var(--transition-fast);
}

.link-item:hover {
  background: var(--bg-hover);
}

.link-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
}

.link-item span {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

/* 笔记组件 */
.notes-widget textarea {
  width: 100%;
  min-height: 150px;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: vertical;
  font-family: var(--font-family-base);
}

/* 天气组件 */
.weather-widget {
  text-align: center;
}

.weather-main {
  margin-bottom: var(--space-3);
}

.weather-temp {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.weather-desc {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.weather-info {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 日历组件 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.calendar-header button {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: none;
  cursor: pointer;
  color: var(--text-primary);
}

.calendar-header span {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
  text-align: center;
}

.week-day {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  padding: var(--space-1);
}

.calendar-day {
  padding: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
}

.calendar-day.other {
  color: var(--text-secondary);
}

.calendar-day.today {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

/* 统计组件 */
.stats-widget {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  text-align: center;
}

.stat-item .stat-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
}

.stat-item .stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  font-size: 24px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: var(--space-4);
}

.widget-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.widget-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.widget-option:hover {
  background: var(--bg-hover);
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
}

.option-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.option-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-align: center;
}

@media (max-width: 768px) {
  .widget-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }
}
</style>
