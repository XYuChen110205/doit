<template>
  <div class="today-view">
    <!-- 今日日期 -->
    <div class="date-header">
      <h1 class="greeting">{{ greeting }}</h1>
      <p class="date">{{ todayDate }}</p>
    </div>

    <!-- 今日任务 -->
    <div class="tasks-section">
      <h2 class="section-title">
        <SvgIcon name="Task" :size="20" />
        今日任务
        <span class="task-count">{{ pendingTasks.length }} 待办</span>
      </h2>

      <div class="task-input">
        <input
          v-model="newTaskTitle"
          type="text"
          placeholder="添加今日任务..."
          @keyup.enter="addTask"
        />
        <button @click="addTask" :disabled="!newTaskTitle.trim()">
          <SvgIcon name="Plus" :size="16" />
        </button>
      </div>

      <div class="task-list">
        <div
          v-for="task in todayTasks"
          :key="task.id"
          class="task-item"
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

        <div v-if="todayTasks.length === 0" class="empty-tasks">
          <SvgIcon name="InboxEmpty" :size="48" />
          <p>今天还没有任务</p>
          <span>添加一个任务开始新的一天吧</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-links">
      <router-link to="/inbox" class="quick-link">
        <SvgIcon name="Inbox" :size="24" />
        <span>收集箱</span>
      </router-link>
      <router-link to="/calendar" class="quick-link">
        <SvgIcon name="Calendar" :size="24" />
        <span>日历</span>
      </router-link>
      <router-link to="/notes" class="quick-link">
        <SvgIcon name="Note" :size="24" />
        <span>笔记</span>
      </router-link>
      <router-link to="/stats" class="quick-link">
        <SvgIcon name="Chart" :size="24" />
        <span>统计</span>
      </router-link>
    </div>

    <!-- 自定义组件区域 -->
    <div class="widgets-section">
      <div class="widgets-header">
        <h2 class="section-title">
          <SvgIcon name="Layout" :size="20" />
          我的组件
        </h2>
        <button class="add-widget-btn" @click="showComponentLibrary = true">
          <SvgIcon name="Plus" :size="16" />
          添加组件
        </button>
      </div>

      <div class="widgets-grid">
        <div
          v-for="widget in widgets"
          :key="widget.instanceId"
          class="widget-card"
          :class="{ 'detail-mode': activeWidget === widget.instanceId }"
        >
          <!-- 组件头部 -->
          <div v-if="activeWidget !== widget.instanceId" class="widget-header">
            <input
              v-model="widget.title"
              class="widget-title-input"
              @blur="updateWidgetTitle(widget.instanceId, widget.title)"
              @click.stop
            />
            <div class="widget-actions">
              <button @click.stop="openWidgetDetail(widget.instanceId)" title="展开">
                <SvgIcon name="Maximize" :size="14" />
              </button>
              <button @click.stop="removeWidget(widget.instanceId)" title="删除">
                <SvgIcon name="Trash" :size="14" />
              </button>
            </div>
          </div>

          <!-- 缩略图预览 -->
          <div
            v-if="activeWidget !== widget.instanceId"
            class="widget-preview"
            @click="openWidgetDetail(widget.instanceId)"
          >
            <WidgetBackground :config="widget.background">
              <!-- 番茄钟预览 -->
              <PomodoroWidget
                v-if="widget.widgetType === WidgetType.POMODORO"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 倒计时预览 -->
              <CountdownWidget
                v-else-if="widget.widgetType === WidgetType.COUNTDOWN"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 课程表预览 -->
              <ScheduleWidget
                v-else-if="widget.widgetType === WidgetType.SCHEDULE"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 任务列表预览 -->
              <TaskListWidget
                v-else-if="widget.widgetType === WidgetType.TASK_LIST"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
              />
              <!-- 横线笔记本预览 -->
              <LinedPaperEditor
                v-else-if="widget.widgetType === WidgetType.LINED_PAPER"
                :instance-id="widget.instanceId"
                :initial-title="widget.title"
                :initial-content="widget.data?.content"
                :initial-line-height="widget.data?.lineHeight"
                :initial-line-color="widget.background.lineColor"
                :initial-paper-color="widget.background.paperColor"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 便签预览 -->
              <NoteEditor
                v-else-if="widget.widgetType === WidgetType.NOTE_EDITOR"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 链接收藏预览 -->
              <LinkCollector
                v-else-if="widget.widgetType === WidgetType.LINKS"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 唯美文章预览 -->
              <BeautifulEditor
                v-else-if="widget.widgetType === WidgetType.BEAUTIFUL_EDITOR"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 代码编辑器预览 -->
              <CodeEditor
                v-else-if="widget.widgetType === WidgetType.CODE_EDITOR"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 日历预览 -->
              <CalendarWidget
                v-else-if="widget.widgetType === WidgetType.CALENDAR"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                :is-detail-view="false"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @open-detail="openWidgetDetail(widget.instanceId)"
              />
              <!-- 其他组件 -->
              <div v-else class="preview-placeholder">
                <SvgIcon :name="getWidgetIcon(widget.widgetType)" :size="32" />
                <span>{{ getWidgetTitle(widget.widgetType) }}</span>
              </div>
            </WidgetBackground>
          </div>

          <!-- 详情页 -->
          <div v-else class="widget-detail">
            <div class="detail-header">
              <button class="back-btn" @click="closeWidgetDetail">
                <SvgIcon name="ChevronLeft" :size="18" />
                返回
              </button>
              <input
                v-model="widget.title"
                class="detail-title-input"
                @blur="updateWidgetTitle(widget.instanceId, widget.title)"
              />
              <button class="delete-btn" @click="removeWidget(widget.instanceId)">
                <SvgIcon name="Trash" :size="16" />
              </button>
            </div>
            <div class="detail-body">
              <WidgetBackground :config="widget.background">
                <!-- 番茄钟详情 -->
                <PomodoroWidget
                  v-if="widget.widgetType === WidgetType.POMODORO"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 倒计时详情 -->
                <CountdownWidget
                  v-else-if="widget.widgetType === WidgetType.COUNTDOWN"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 课程表详情 -->
                <ScheduleWidget
                  v-else-if="widget.widgetType === WidgetType.SCHEDULE"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 任务列表详情 -->
                <TaskListWidget
                  v-else-if="widget.widgetType === WidgetType.TASK_LIST"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                />
                <!-- 横线笔记本详情 -->
                <LinedPaperEditor
                  v-else-if="widget.widgetType === WidgetType.LINED_PAPER"
                  :instance-id="widget.instanceId"
                  :initial-title="widget.title"
                  :initial-content="widget.data?.content"
                  :initial-line-height="widget.data?.lineHeight"
                  :initial-line-color="widget.background.lineColor"
                  :initial-paper-color="widget.background.paperColor"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 便签详情 -->
                <NoteEditor
                  v-else-if="widget.widgetType === WidgetType.NOTE_EDITOR"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 链接收藏详情 -->
                <LinkCollector
                  v-else-if="widget.widgetType === WidgetType.LINKS"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 唯美文章详情 -->
                <BeautifulEditor
                  v-else-if="widget.widgetType === WidgetType.BEAUTIFUL_EDITOR"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 代码编辑器详情 -->
                <CodeEditor
                  v-else-if="widget.widgetType === WidgetType.CODE_EDITOR"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 日历详情 -->
                <CalendarWidget
                  v-else-if="widget.widgetType === WidgetType.CALENDAR"
                  :instance-id="widget.instanceId"
                  :initial-data="widget.data"
                  :is-detail-view="true"
                  @update="(data) => updateWidgetData(widget.instanceId, data)"
                  @close-detail="closeWidgetDetail"
                />
                <!-- 其他组件 -->
                <div v-else class="detail-placeholder">
                  <SvgIcon :name="getWidgetIcon(widget.widgetType)" :size="48" />
                  <p>{{ getWidgetTitle(widget.widgetType) }}</p>
                  <span>组件详情页开发中...</span>
                </div>
              </WidgetBackground>
            </div>
          </div>
        </div>

        <!-- 添加组件按钮 -->
        <button class="add-widget-card" @click="showComponentLibrary = true">
          <SvgIcon name="Plus" :size="32" />
          <span>添加组件</span>
        </button>
      </div>
    </div>

    <!-- 组件库弹窗 -->
    <ComponentLibrary
      :is-open="showComponentLibrary"
      @close="showComponentLibrary = false"
      @select="addWidget"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../components/icons/SvgIcon.vue'
import ComponentLibrary from '../components/widgets/ComponentLibrary.vue'
import WidgetBackground from '../components/widgets/WidgetBackground.vue'
import LinedPaperEditor from '../components/widgets/LinedPaperEditor.vue'
import TaskListWidget from '../components/widgets/TaskListWidget.vue'
import ScheduleWidget from '../components/widgets/ScheduleWidget.vue'
import PomodoroWidget from '../components/widgets/PomodoroWidget.vue'
import CountdownWidget from '../components/widgets/CountdownWidget.vue'
import NoteEditor from '../components/widgets/NoteEditor.vue'
import LinkCollector from '../components/widgets/LinkCollector.vue'
import BeautifulEditor from '../components/widgets/BeautifulEditor.vue'
import CodeEditor from '../components/widgets/CodeEditor.vue'
import CalendarWidget from '../components/widgets/CalendarWidget.vue'
import { WidgetType, type WidgetInstance } from '../types/widget'
import { getWidgetConfig } from '../components/widgets/registry'

// 类型定义
interface Task {
  id: string
  title: string
  status: 'pending' | 'done'
  due_date: string
  createdAt: string
}

// 状态
const tasks = ref<Task[]>([])
const newTaskTitle = ref('')
const widgets = ref<WidgetInstance[]>([])
const showComponentLibrary = ref(false)
const activeWidget = ref<string | null>(null)

// 计算属性
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const todayDate = computed(() => {
  const date = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
})

const todayStr = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const todayTasks = computed(() => {
  return tasks.value
    .filter(task => task.due_date === todayStr.value)
    .sort((a, b) => {
      if (a.status === b.status) return 0
      return a.status === 'done' ? 1 : -1
    })
})

const pendingTasks = computed(() => {
  return todayTasks.value.filter(t => t.status === 'pending')
})

// 方法
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function loadData() {
  const savedTasks = localStorage.getItem('tasks')
  if (savedTasks) {
    tasks.value = JSON.parse(savedTasks)
  }

  const savedWidgets = localStorage.getItem('todayWidgets')
  if (savedWidgets) {
    widgets.value = JSON.parse(savedWidgets)
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks.value))
}

function saveWidgets() {
  localStorage.setItem('todayWidgets', JSON.stringify(widgets.value))
}

function addTask() {
  const title = newTaskTitle.value.trim()
  if (!title) return

  const newTask: Task = {
    id: generateId(),
    title,
    status: 'pending',
    due_date: todayStr.value,
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

function addWidget(config: any) {
  const widget: WidgetInstance = {
    instanceId: generateId(),
    widgetType: config.type,
    title: config.title,
    background: { ...config.defaultBackground },
    position: widgets.value.length,
    data: null,
    isCollapsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  widgets.value.push(widget)
  saveWidgets()
  showComponentLibrary.value = false
}

function removeWidget(instanceId: string) {
  widgets.value = widgets.value.filter(w => w.instanceId !== instanceId)
  if (activeWidget.value === instanceId) {
    activeWidget.value = null
  }
  saveWidgets()
}

function updateWidgetData(instanceId: string, data: any) {
  const widget = widgets.value.find(w => w.instanceId === instanceId)
  if (widget) {
    widget.data = data
    widget.updatedAt = new Date().toISOString()
    saveWidgets()
  }
}

function updateWidgetTitle(instanceId: string, title: string) {
  const widget = widgets.value.find(w => w.instanceId === instanceId)
  if (widget) {
    widget.title = title
    widget.updatedAt = new Date().toISOString()
    saveWidgets()
  }
}

function openWidgetDetail(instanceId: string) {
  activeWidget.value = instanceId
}

function closeWidgetDetail() {
  activeWidget.value = null
}

function getWidgetIcon(type: WidgetType): string {
  return getWidgetConfig(type)?.icon || 'Document'
}

function getWidgetTitle(type: WidgetType): string {
  return getWidgetConfig(type)?.title || '未知组件'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.today-view {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* 日期头部 */
.date-header {
  text-align: center;
}

.greeting {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.date {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

/* 任务区域 */
.tasks-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.task-count {
  margin-left: auto;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
}

.task-input {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.task-input input {
  flex: 1;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.task-input input:focus {
  border-color: var(--accent-primary);
}

.task-input button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.task-input button:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.task-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.task-item:hover {
  background: var(--bg-hover);
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition-normal);
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: var(--accent-primary);
}

.task-item.done .checkbox {
  background: var(--accent-success);
  border-color: var(--accent-success);
}

.task-title {
  flex: 1;
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.task-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.empty-tasks {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8);
  color: var(--text-muted);
}

.empty-tasks p {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.empty-tasks span {
  font-size: var(--font-size-sm);
}

/* 快捷入口 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-secondary);
  transition: var(--transition-normal);
  box-shadow: var(--shadow-card);
}

.quick-link:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
  color: var(--accent-primary);
}

.quick-link svg {
  color: var(--accent-primary);
}

.quick-link span {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* 组件区域 */
.widgets-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.widgets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.add-widget-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-widget-btn:hover {
  background: var(--accent-primary-hover);
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.widget-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition-normal);
  border: 2px solid transparent;
}

.widget-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.widget-card.detail-mode {
  grid-column: 1 / -1;
  border-color: var(--accent-primary);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border-light);
}

.widget-title-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
}

.widget-actions {
  display: flex;
  gap: var(--space-1);
}

.widget-actions button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.widget-actions button:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.widget-preview {
  height: 180px;
  cursor: pointer;
  overflow: hidden;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--text-muted);
  padding: var(--space-4);
}

.preview-placeholder span {
  font-size: var(--font-size-sm);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 详情页 */
.widget-detail {
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border-light);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-normal);
}

.back-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.detail-title-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  outline: none;
}

.detail-header .delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-normal);
}

.detail-header .delete-btn:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.detail-body {
  flex: 1;
  min-height: 400px;
}

.detail-placeholder {
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--text-muted);
}

.detail-placeholder p {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

.add-widget-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-normal);
  min-height: 180px;
}

.add-widget-card:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-primary-light);
}

/* 响应式 */
@media (max-width: 768px) {
  .today-view {
    padding: var(--space-4);
  }

  .quick-links {
    grid-template-columns: repeat(2, 1fr);
  }

  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .widget-card.detail-mode {
    grid-column: 1;
  }
}
</style>
