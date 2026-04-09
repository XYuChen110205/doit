<template>
  <div class="custom-layout">
    <div class="page-header">
      <h1>我的仪表盘</h1>
      <button class="btn-primary" @click="showAddWidget = true">+ 添加组件</button>
    </div>

    <!-- 可拖拽的组件网格 -->
    <div class="widgets-grid">
      <div
        v-for="widget in activeWidgets"
        :key="widget.id"
        class="widget-card"
        :class="`size-${widget.size}`"
        :style="{ background: widget.color }"
      >
        <div class="widget-header">
          <h3>{{ widget.title }}</h3>
          <button class="btn-remove" @click="removeWidget(widget.id)">×</button>
        </div>
        <div class="widget-content">
          <!-- 快捷链接组件 -->
          <template v-if="widget.type === 'links'">
            <div class="quick-links">
              <a
                v-for="link in widget.data"
                :key="link.url"
                :href="link.url"
                target="_blank"
                class="link-item"
              >
                <span class="link-icon">{{ link.icon }}</span>
                <span class="link-name">{{ link.name }}</span>
              </a>
            </div>
          </template>

          <!-- 待办事项组件 -->
          <template v-if="widget.type === 'todos'">
            <div class="todo-list">
              <div
                v-for="todo in widget.data"
                :key="todo.id"
                class="todo-item"
                :class="{ completed: todo.completed }"
                @click="toggleTodo(widget.id, todo.id)"
              >
                <span class="todo-check">{{ todo.completed ? '✓' : '○' }}</span>
                <span class="todo-text">{{ todo.text }}</span>
              </div>
              <div class="add-todo">
                <input
                  v-model="newTodoText"
                  type="text"
                  placeholder="添加待办..."
                  @keyup.enter="addTodo(widget.id)"
                />
              </div>
            </div>
          </template>

          <!-- 笔记组件 -->
          <template v-if="widget.type === 'notes'">
            <textarea
              v-model="widget.data.content"
              class="notes-area"
              placeholder="在这里记录你的想法..."
              @blur="saveWidgets"
            ></textarea>
          </template>

          <!-- 倒计时组件 -->
          <template v-if="widget.type === 'countdown'">
            <div class="countdown-display">
              <div class="countdown-item">
                <span class="countdown-num">{{ countdownDays }}</span>
                <span class="countdown-label">天</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-num">{{ countdownHours }}</span>
                <span class="countdown-label">时</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-num">{{ countdownMinutes }}</span>
                <span class="countdown-label">分</span>
              </div>
            </div>
            <div class="countdown-target">{{ widget.data.targetName }}</div>
          </template>

          <!-- 习惯追踪组件 -->
          <template v-if="widget.type === 'habits'">
            <div class="habits-list">
              <div
                v-for="habit in widget.data"
                :key="habit.id"
                class="habit-item"
              >
                <span class="habit-name">{{ habit.name }}</span>
                <div class="habit-days">
                  <span
                    v-for="(done, index) in habit.weekDays"
                    :key="index"
                    class="habit-day"
                    :class="{ done }"
                    @click="toggleHabitDay(widget.id, habit.id, index)"
                  >
                    {{ ['一', '二', '三', '四', '五', '六', '日'][index] }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- 天气组件 -->
          <template v-if="widget.type === 'weather'">
            <div class="weather-display">
              <div class="weather-main">
                <span class="weather-icon">{{ widget.data.icon }}</span>
                <span class="weather-temp">{{ widget.data.temp }}°</span>
              </div>
              <div class="weather-info">
                <span>{{ widget.data.city }}</span>
                <span>{{ widget.data.desc }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 添加组件弹窗 -->
    <div v-if="showAddWidget" class="modal-overlay" @click.self="showAddWidget = false">
      <div class="modal">
        <h3>添加组件</h3>
        <div class="widget-types">
          <div
            v-for="type in widgetTypes"
            :key="type.type"
            class="widget-type-item"
            @click="addWidget(type.type)"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <span class="type-name">{{ type.name }}</span>
          </div>
        </div>
        <button class="btn-close" @click="showAddWidget = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Widget {
  id: string
  type: string
  title: string
  size: 'small' | 'medium' | 'large'
  color: string
  data: any
}

const widgetTypes = [
  { type: 'links', name: '快捷链接', icon: '🔗' },
  { type: 'todos', name: '待办事项', icon: '✓' },
  { type: 'notes', name: '便签笔记', icon: '📝' },
  { type: 'countdown', name: '倒计时', icon: '⏰' },
  { type: 'habits', name: '习惯追踪', icon: '📊' },
  { type: 'weather', name: '天气', icon: '🌤' }
]

const defaultWidgets: Widget[] = [
  {
    id: '1',
    type: 'links',
    title: '常用链接',
    size: 'medium',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    data: [
      { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
      { name: '掘金', url: 'https://juejin.cn', icon: '📚' },
      { name: 'B站', url: 'https://bilibili.com', icon: '📺' },
      { name: '知乎', url: 'https://zhihu.com', icon: '💡' }
    ]
  },
  {
    id: '2',
    type: 'todos',
    title: '今日待办',
    size: 'medium',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    data: [
      { id: 1, text: '完成项目文档', completed: false },
      { id: 2, text: '回复邮件', completed: true },
      { id: 3, text: '健身30分钟', completed: false }
    ]
  },
  {
    id: '3',
    type: 'notes',
    title: '随手记',
    size: 'small',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    data: { content: '' }
  },
  {
    id: '4',
    type: 'countdown',
    title: '距离周末',
    size: 'small',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    data: { targetDate: getNextWeekend(), targetName: '周末愉快！' }
  }
]

function getNextWeekend(): string {
  const now = new Date()
  const day = now.getDay()
  const daysUntilWeekend = day === 0 ? 0 : 6 - day
  const weekend = new Date(now)
  weekend.setDate(now.getDate() + daysUntilWeekend)
  weekend.setHours(0, 0, 0, 0)
  return weekend.toISOString()
}

const widgets = ref<Widget[]>([])
const showAddWidget = ref(false)
const newTodoText = ref('')

// 倒计时计算
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  const saved = localStorage.getItem('custom_widgets')
  widgets.value = saved ? JSON.parse(saved) : defaultWidgets
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const activeWidgets = computed(() => widgets.value)

const countdownWidget = computed(() => widgets.value.find(w => w.type === 'countdown'))
const countdownDays = computed(() => {
  if (!countdownWidget.value) return 0
  const target = new Date(countdownWidget.value.data.targetDate)
  const diff = target.getTime() - now.value.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
})
const countdownHours = computed(() => {
  if (!countdownWidget.value) return 0
  const target = new Date(countdownWidget.value.data.targetDate)
  const diff = target.getTime() - now.value.getTime()
  return Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
})
const countdownMinutes = computed(() => {
  if (!countdownWidget.value) return 0
  const target = new Date(countdownWidget.value.data.targetDate)
  const diff = target.getTime() - now.value.getTime()
  return Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)))
})

function saveWidgets() {
  localStorage.setItem('custom_widgets', JSON.stringify(widgets.value))
}

function addWidget(type: string) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  ]

  const newWidget: Widget = {
    id: Date.now().toString(),
    type,
    title: widgetTypes.find(t => t.type === type)?.name || '新组件',
    size: type === 'notes' ? 'small' : 'medium',
    color: colors[Math.floor(Math.random() * colors.length)],
    data: getDefaultData(type)
  }

  widgets.value.push(newWidget)
  saveWidgets()
  showAddWidget.value = false
}

function getDefaultData(type: string) {
  switch (type) {
    case 'links':
      return [{ name: '百度', url: 'https://baidu.com', icon: '🔍' }]
    case 'todos':
      return []
    case 'notes':
      return { content: '' }
    case 'countdown':
      return { targetDate: getNextWeekend(), targetName: '倒计时' }
    case 'habits':
      return [{ id: 1, name: '早起', weekDays: [false, false, false, false, false, false, false] }]
    case 'weather':
      return { city: '北京', temp: 22, icon: '☀️', desc: '晴朗' }
    default:
      return {}
  }
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
  saveWidgets()
}

function toggleTodo(widgetId: string, todoId: number) {
  const widget = widgets.value.find(w => w.id === widgetId)
  if (widget) {
    const todo = widget.data.find((t: any) => t.id === todoId)
    if (todo) {
      todo.completed = !todo.completed
      saveWidgets()
    }
  }
}

function addTodo(widgetId: string) {
  if (!newTodoText.value.trim()) return
  const widget = widgets.value.find(w => w.id === widgetId)
  if (widget) {
    widget.data.push({
      id: Date.now(),
      text: newTodoText.value,
      completed: false
    })
    newTodoText.value = ''
    saveWidgets()
  }
}

function toggleHabitDay(widgetId: string, habitId: number, dayIndex: number) {
  const widget = widgets.value.find(w => w.id === widgetId)
  if (widget) {
    const habit = widget.data.find((h: any) => h.id === habitId)
    if (habit) {
      habit.weekDays[dayIndex] = !habit.weekDays[dayIndex]
      saveWidgets()
    }
  }
}
</script>

<style scoped>
.custom-layout {
  padding: var(--space-4);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.widget-card {
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  color: white;
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.widget-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.widget-card.size-small {
  grid-column: span 1;
}

.widget-card.size-medium {
  grid-column: span 1;
}

.widget-card.size-large {
  grid-column: span 2;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.widget-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.btn-remove {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 快捷链接 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.link-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  color: white;
  text-decoration: none;
  transition: var(--transition-fast);
}

.link-item:hover {
  background: rgba(255, 255, 255, 0.3);
}

.link-icon {
  font-size: 20px;
}

.link-name {
  font-size: var(--font-size-sm);
}

/* 待办事项 */
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.todo-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  opacity: 0.7;
}

.todo-check {
  font-size: 16px;
}

.todo-text {
  font-size: var(--font-size-sm);
}

.add-todo input {
  width: 100%;
  padding: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: var(--font-size-sm);
}

.add-todo input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

/* 笔记 */
.notes-area {
  width: 100%;
  min-height: 120px;
  padding: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: var(--font-size-sm);
  resize: vertical;
}

.notes-area::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

/* 倒计时 */
.countdown-display {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-num {
  font-size: 36px;
  font-weight: var(--font-weight-bold);
}

.countdown-label {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.countdown-target {
  text-align: center;
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

/* 习惯追踪 */
.habits-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.habit-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.habit-name {
  font-size: var(--font-size-sm);
}

.habit-days {
  display: flex;
  gap: var(--space-1);
}

.habit-day {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.habit-day.done {
  background: rgba(255, 255, 255, 0.6);
}

.habit-day:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 天气 */
.weather-display {
  text-align: center;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.weather-icon {
  font-size: 48px;
}

.weather-temp {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 400px;
}

.modal h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.widget-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.widget-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
}

.widget-type-item:hover {
  background: var(--accent-primary-bg);
}

.type-icon {
  font-size: 32px;
}

.type-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.btn-close {
  width: 100%;
  padding: var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 768px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .widget-card.size-large {
    grid-column: span 1;
  }
}
</style>
