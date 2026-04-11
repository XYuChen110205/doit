<template>
  <div class="today-view">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <SvgIcon name="Loading" :size="32" />
        <span>加载中...</span>
      </div>
    </div>

    <!-- 左栏：任务列表 -->
    <div class="tasks-section">
      <!-- 日期导航 -->
      <div class="date-header">
        <button class="nav-arrow" @click="changeDate(-1)">
          <span class="arrow-left"></span>
        </button>
        <div class="date-display">
          <span class="date-text">{{ formattedDate }}</span>
          <span class="weekday">{{ weekday }}</span>
        </div>
        <button class="nav-arrow" @click="changeDate(1)">
          <span class="arrow-right"></span>
        </button>
      </div>

      <!-- 标签筛选 -->
      <div class="tag-filter-bar">
        <span class="filter-label">筛选:</span>
        <div class="filter-tags">
          <button
            class="filter-tag all"
            :class="{ active: filterTagId === null }"
            @click="filterTagId = null"
          >
            全部
          </button>
          <button
            v-for="tag in allTags"
            :key="tag.id"
            class="filter-tag"
            :class="{ active: filterTagId === tag.id }"
            :style="{
              backgroundColor: filterTagId === tag.id ? tag.color : 'transparent',
              borderColor: tag.color,
              color: filterTagId === tag.id ? '#fff' : tag.color
            }"
            @click="filterTagId = tag.id"
          >
            {{ tag.name }}
          </button>
        </div>
      </div>

      <!-- 添加任务 - 必须先选标签 -->
      <div class="add-task-container">
        <div class="tag-selection">
          <span class="selection-label">1. 选择标签 <span class="required">*</span></span>
          <div class="tag-pool">
            <button
              v-for="tag in allTags"
              :key="tag.id"
              class="tag-choice"
              :class="{ selected: selectedTagId === tag.id }"
              :style="{ backgroundColor: selectedTagId === tag.id ? tag.color : 'transparent', borderColor: tag.color, color: selectedTagId === tag.id ? '#fff' : tag.color }"
              @click="selectedTagId = tag.id"
            >
              {{ tag.name }}
            </button>
            <router-link v-if="allTags.length === 0" to="/tags" class="create-tag-link">
              <SvgIcon name="Plus" :size="14" />
              创建标签
            </router-link>
          </div>
        </div>
        <div class="task-input-section" :class="{ disabled: !selectedTagId }">
          <span class="selection-label">2. 输入任务内容</span>
          <div class="input-row">
            <input
              v-model="newTaskTitle"
              type="text"
              class="task-input"
              :placeholder="selectedTagId ? '输入任务内容，按回车快速添加...' : '请先选择标签'"
              :disabled="!selectedTagId"
              @keyup.enter="createTask"
            />
            <button
              class="add-btn"
              :disabled="!canCreate"
              @click="createTask"
            >
              <SvgIcon name="Plus" :size="16" />
              添加
            </button>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="task-list">
        <!-- 未完成任务 -->
        <div class="task-group">
          <div class="group-header">
            <span class="group-title">待完成</span>
            <span class="group-count">{{ filteredPendingTasks.length }}</span>
          </div>
          <div
            v-for="task in filteredPendingTasks"
            :key="task.id"
            class="task-item"
          >
            <div class="task-main">
              <button class="checkbox" @click="toggleTaskStatus(task)">
                <span class="check-icon"></span>
              </button>
              <div class="task-content">
                <div class="task-tags-row" v-if="task.tags && task.tags.length > 0">
                  <span
                    v-for="tag in task.tags"
                    :key="tag.id"
                    class="task-tag"
                    :style="{ backgroundColor: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                </div>
                <span class="task-title">{{ task.title }}</span>
              </div>
              <button class="delete-btn" @click="confirmDeleteTask(task.id)" title="删除">
                <SvgIcon name="Trash" :size="16" />
              </button>
            </div>
          </div>
          <div v-if="filteredPendingTasks.length === 0" class="empty-state">
            <SvgIcon name="Task" :size="48" />
            <div class="empty-text">{{ filterTagId ? '该标签下暂无任务' : '暂无任务，添加一个吧' }}</div>
            <div class="empty-hint">选择上方标签，输入任务内容开始添加</div>
          </div>
        </div>

        <!-- 已完成任务 -->
        <div v-if="filteredCompletedTasks.length > 0" class="completed-section">
          <button class="toggle-completed" @click="showCompleted = !showCompleted">
            <span class="toggle-icon" :class="{ expanded: showCompleted }"></span>
            <span class="toggle-text">已完成 {{ filteredCompletedTasks.length }}</span>
          </button>
          <div v-show="showCompleted" class="task-group completed">
            <div
              v-for="task in filteredCompletedTasks"
              :key="task.id"
              class="task-item done"
            >
              <div class="task-main">
                <button class="checkbox checked" @click="toggleTaskStatus(task)">
                  <span class="check-icon"></span>
                </button>
                <div class="task-content">
                  <div class="task-tags-row" v-if="task.tags && task.tags.length > 0">
                    <span
                      v-for="tag in task.tags"
                      :key="tag.id"
                      class="task-tag"
                      :style="{ backgroundColor: tag.color }"
                    >
                      {{ tag.name }}
                    </span>
                  </div>
                  <span class="task-title">{{ task.title }}</span>
                </div>
                <button class="delete-btn" @click="confirmDeleteTask(task.id)" title="删除">
                  <SvgIcon name="Trash" :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右栏：笔记编辑器 -->
    <div class="notes-section">
      <div class="notes-card">
        <div class="notes-header">
          <h2 class="notes-title">
            <SvgIcon name="Document" :size="20" />
            今日笔记
          </h2>
          <div class="save-status">
            <span v-if="saveStatus === 'saving'" class="status-saving">
              <SvgIcon name="Loading" :size="14" />
              保存中...
            </span>
            <span v-else-if="saveStatus === 'saved'" class="status-saved">
              <SvgIcon name="Check" :size="14" />
              已保存
            </span>
            <span v-else class="status-idle">自动保存</span>
          </div>
        </div>
        <textarea
          v-model="noteContent"
          class="notes-textarea"
          placeholder="今天有什么想记录的...&#10;&#10;支持自动保存，无需手动点击"
          @blur="saveNote"
          @input="onNoteInput"
        ></textarea>
      </div>
    </div>

    <!-- Undo Toast -->
    <Transition name="toast">
      <div v-if="deletedTask" class="undo-toast">
        <SvgIcon name="Check" :size="16" />
        <span>任务已删除</span>
        <button class="undo-btn" @click="undoDelete">撤销</button>
      </div>
    </Transition>

    <!-- 错误提示 Toast -->
    <Transition name="toast">
      <div v-if="errorMessage" class="error-toast">
        <SvgIcon name="Alert" :size="16" />
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>

    <!-- 删除确认弹窗 -->
    <BaseModal v-model="showDeleteConfirm" title="确认删除">
      <div class="confirm-content">
        <p>确定要删除这个任务吗？</p>
        <p class="confirm-hint">删除后可以在 5 秒内撤销</p>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteConfirm = false">取消</BaseButton>
        <BaseButton variant="danger" @click="executeDelete">删除</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Task, CreateTaskRequest, Tag } from '../types'
import { createTask as apiCreateTask, getTasksByDate, updateTask, deleteTask as apiDeleteTask } from '../api/tasks'
import { getNoteByDate, saveNote as apiSaveNote } from '../api/notes'
import { listTags } from '../api/tags'
import { addTagToTask } from '../api/task_tags'
import SvgIcon from '../components/icons/SvgIcon.vue'
import BaseModal from '../components/base/BaseModal.vue'
import BaseButton from '../components/base/BaseButton.vue'

// 当前日期
const currentDate = ref(new Date())

// 任务相关
const tasks = ref<Task[]>([])
const newTaskTitle = ref('')
const selectedTagId = ref<number | null>(null)
const filterTagId = ref<number | null>(null)
const showCompleted = ref(false)
const deletedTask = ref<Task | null>(null)
let deleteTimer: ReturnType<typeof setTimeout> | null = null
const allTags = ref<Tag[]>([])

// 笔记相关
const noteContent = ref('')
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')
let saveTimer: ReturnType<typeof setTimeout> | null = null
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// 加载和错误状态
const isLoading = ref(false)
const errorMessage = ref('')
let errorTimer: ReturnType<typeof setTimeout> | null = null

// 删除确认
const showDeleteConfirm = ref(false)
const taskToDelete = ref<number | null>(null)

// 计算属性：格式化日期
const formattedDate = computed(() => {
  const month = currentDate.value.getMonth() + 1
  const day = currentDate.value.getDate()
  return `${month}月${day}日`
})

const weekday = computed(() => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekdays[currentDate.value.getDay()]
})

const dateString = computed(() => {
  return currentDate.value.toISOString().split('T')[0]
})

const canCreate = computed(() => selectedTagId.value && newTaskTitle.value.trim())

// 筛选后的任务
const filteredPendingTasks = computed(() => {
  let result = tasks.value.filter(t => t.status === 'pending')
  if (filterTagId.value) {
    result = result.filter(t => t.tags?.some(tag => tag.id === filterTagId.value))
  }
  return result
})

const filteredCompletedTasks = computed(() => {
  let result = tasks.value.filter(t => t.status === 'done')
  if (filterTagId.value) {
    result = result.filter(t => t.tags?.some(tag => tag.id === filterTagId.value))
  }
  return result
})

// 显示错误提示
function showError(message: string) {
  errorMessage.value = message
  if (errorTimer) clearTimeout(errorTimer)
  errorTimer = setTimeout(() => {
    errorMessage.value = ''
  }, 3000)
}

// 加载标签
async function loadTags() {
  try {
    allTags.value = await listTags()
  } catch (error) {
    console.error('加载标签失败:', error)
    showError('加载标签失败，请刷新页面重试')
  }
}

// 加载任务列表
async function loadTasks() {
  try {
    tasks.value = await getTasksByDate(dateString.value)
  } catch (error) {
    console.error('加载任务失败:', error)
    showError('加载任务失败，请检查网络连接')
  }
}

// 加载笔记
async function loadNote() {
  try {
    const note = await getNoteByDate(dateString.value)
    noteContent.value = note?.content || ''
    saveStatus.value = 'idle'
  } catch (error) {
    console.error('加载笔记失败:', error)
    showError('加载笔记失败')
  }
}

// 初始化加载
async function initLoad() {
  isLoading.value = true
  try {
    await Promise.all([loadTags(), loadTasks(), loadNote()])
  } finally {
    isLoading.value = false
  }
}

// 切换日期
function changeDate(days: number) {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + days)
  currentDate.value = newDate
}

// 创建任务
async function createTask() {
  if (!canCreate.value) return

  try {
    const data: CreateTaskRequest = {
      title: newTaskTitle.value.trim(),
      due_date: dateString.value,
      source: 'direct'
    }
    const task = await apiCreateTask(data)

    // 添加选中的标签
    if (selectedTagId.value) {
      await addTagToTask(task.id, selectedTagId.value)
    }

    newTaskTitle.value = ''
    selectedTagId.value = null
    await loadTasks()
  } catch (error) {
    console.error('创建任务失败:', error)
    showError('创建任务失败，请重试')
  }
}

// 切换任务状态
async function toggleTaskStatus(task: Task) {
  try {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    await updateTask(task.id, { status: newStatus })
    await loadTasks()
  } catch (error) {
    console.error('更新任务失败:', error)
    showError('更新任务失败')
  }
}

// 确认删除任务
function confirmDeleteTask(id: number) {
  taskToDelete.value = id
  showDeleteConfirm.value = true
}

// 执行删除
async function executeDelete() {
  if (!taskToDelete.value) return
  
  showDeleteConfirm.value = false
  const id = taskToDelete.value
  const task = tasks.value.find(t => t.id === id)
  if (!task) return

  try {
    await apiDeleteTask(id)
    deletedTask.value = task
    await loadTasks()

    if (deleteTimer) clearTimeout(deleteTimer)
    deleteTimer = setTimeout(() => {
      deletedTask.value = null
    }, 5000)
  } catch (error) {
    console.error('删除任务失败:', error)
    showError('删除任务失败')
  }
  taskToDelete.value = null
}

// 撤销删除
async function undoDelete() {
  if (!deletedTask.value) return

  try {
    const data: CreateTaskRequest = {
      title: deletedTask.value.title,
      detail: deletedTask.value.detail,
      task_type: deletedTask.value.task_type,
      priority: deletedTask.value.priority,
      due_date: deletedTask.value.due_date || dateString.value,
      source: deletedTask.value.source
    }
    const task = await apiCreateTask(data)

    // 恢复标签
    if (deletedTask.value.tags) {
      for (const tag of deletedTask.value.tags) {
        await addTagToTask(task.id, tag.id)
      }
    }

    deletedTask.value = null
    if (deleteTimer) clearTimeout(deleteTimer)
    await loadTasks()
  } catch (error) {
    console.error('撤销删除失败:', error)
    showError('撤销删除失败')
  }
}

// 笔记输入处理（防抖自动保存）
function onNoteInput() {
  saveStatus.value = 'idle'
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    saveNote()
  }, 1500)
}

// 保存笔记
async function saveNote() {
  if (saveStatus.value === 'saving') return

  try {
    saveStatus.value = 'saving'
    await apiSaveNote(dateString.value, noteContent.value)
    saveStatus.value = 'saved'

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveStatus.value = 'idle'
    }, 2000)
  } catch (error) {
    console.error('保存笔记失败:', error)
    saveStatus.value = 'idle'
    showError('保存笔记失败')
  }
}

// 监听日期变化
watch(currentDate, () => {
  loadTasks()
  loadNote()
})

// 初始化
onMounted(() => {
  initLoad()
})
</script>

<style scoped>
.today-view {
  display: flex;
  gap: var(--space-6);
  min-height: calc(100vh - 64px - var(--space-6) * 2);
  padding: var(--space-6);
  position: relative;
}

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
}

/* ========== 左栏：任务列表 ========== */
.tasks-section {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 日期导航 */
.date-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-4) 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
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
  width: 10px;
  height: 10px;
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

.nav-arrow:hover .arrow-left,
.nav-arrow:hover .arrow-right {
  border-color: var(--text-primary);
}

.date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-width: 120px;
}

.date-text {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-wide);
}

.weekday {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  letter-spacing: var(--letter-spacing-wide);
}

/* 标签筛选栏 */
.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  flex-wrap: wrap;
}

.filter-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.filter-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-tag {
  padding: var(--space-2) var(--space-4);
  border: 2px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  background: transparent;
  transition: var(--transition-normal);
}

.filter-tag.all.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 添加任务容器 */
.add-task-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.tag-selection {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.selection-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.required {
  color: var(--accent-danger);
}

.tag-pool {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-choice {
  padding: var(--space-2) var(--space-4);
  border: 2px solid;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  background: transparent;
  transition: var(--transition-normal);
}

.tag-choice.selected {
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.create-tag-link {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  color: var(--accent-primary);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.task-input-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-input-section.disabled {
  opacity: 0.5;
}

.input-row {
  display: flex;
  gap: var(--space-3);
  align-items: stretch;
}

.task-input {
  flex: 1;
  padding: var(--space-4);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  background: var(--bg-primary);
  outline: none;
  min-height: 52px;
}

.task-input::placeholder {
  color: var(--text-muted);
}

.task-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.task-input:disabled {
  background: var(--bg-secondary);
  cursor: not-allowed;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-normal);
  min-width: 100px;
}

.add-btn:hover:not(:disabled) {
  background: var(--accent-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 159, 212, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.task-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
}

.group-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.group-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-10);
  color: var(--text-muted);
}

.empty-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.empty-hint {
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

.task-item {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
  overflow: hidden;
}

.task-item:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}

.task-item.done {
  opacity: 0.7;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-main {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--transition-normal);
}

.checkbox:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.checkbox.checked {
  background: var(--accent-success);
  border-color: var(--accent-success);
}

.check-icon {
  display: block;
  width: 6px;
  height: 12px;
  border-style: solid;
  border-color: white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.task-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.task-tag {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: 1.5;
  word-break: break-word;
}

.delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  flex-shrink: 0;
}

.delete-btn:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.15);
}

/* 已完成任务折叠 */
.completed-section {
  margin-top: var(--space-2);
}

.toggle-completed {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  width: 100%;
  transition: var(--transition-normal);
}

.toggle-completed:hover {
  background: var(--bg-hover);
}

.toggle-icon {
  display: block;
  width: 8px;
  height: 8px;
  border-style: solid;
  border-color: var(--text-secondary);
  border-width: 0 2px 2px 0;
  transform: rotate(-45deg);
  transition: var(--transition-normal);
}

.toggle-icon.expanded {
  transform: rotate(45deg) translate(2px, -2px);
}

/* ========== 右栏：笔记编辑器 ========== */
.notes-section {
  flex: 0 0 45%;
}

.notes-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.notes-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.save-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.status-saving,
.status-saved,
.status-idle {
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.status-saving {
  color: var(--text-secondary);
}

.status-saved {
  color: var(--accent-success);
  font-weight: var(--font-weight-medium);
}

.status-idle {
  color: var(--text-muted);
}

.notes-textarea {
  flex: 1;
  width: 100%;
  min-height: 400px;
  padding: var(--space-4);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  line-height: 1.8;
  color: var(--text-primary);
  background: var(--bg-primary);
  resize: none;
  outline: none;
  transition: var(--transition-normal);
}

.notes-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.notes-textarea::placeholder {
  color: var(--text-muted);
}

/* ========== Undo Toast ========== */
.undo-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--text-primary);
  color: white;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  z-index: var(--z-toast);
  box-shadow: var(--shadow-float);
}

.undo-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
  background: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.undo-btn:hover {
  background: var(--accent-primary);
  color: white;
}

/* ========== Error Toast ========== */
.error-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--accent-danger);
  color: white;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  z-index: var(--z-toast);
  box-shadow: var(--shadow-float);
}

/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* ========== 确认弹窗 ========== */
.confirm-content {
  text-align: center;
  padding: var(--space-4) 0;
}

.confirm-content p {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.confirm-hint {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* ========== 响应式适配 ========== */
@media (max-width: 1024px) {
  .today-view {
    flex-direction: column;
    gap: var(--space-5);
  }

  .tasks-section,
  .notes-section {
    flex: 1;
    width: 100%;
  }

  .notes-card {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .today-view {
    padding: var(--space-4);
    gap: var(--space-4);
  }

  .date-text {
    font-size: var(--font-size-xl);
  }

  .task-input {
    font-size: var(--font-size-base);
  }

  .task-title {
    font-size: var(--font-size-base);
  }

  .input-row {
    flex-direction: column;
  }

  .add-btn {
    width: 100%;
    padding: var(--space-3);
    justify-content: center;
  }

  .tag-filter-bar {
    padding: var(--space-3);
  }

  .filter-tag {
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-sm);
  }
}

@media (max-width: 480px) {
  .today-view {
    padding: var(--space-3);
  }

  .date-header {
    padding: var(--space-3) 0;
  }

  .date-text {
    font-size: var(--font-size-lg);
    min-width: 100px;
  }

  .task-main {
    padding: var(--space-3);
    gap: var(--space-3);
  }

  .checkbox {
    width: 24px;
    height: 24px;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
  }

  .notes-card {
    padding: var(--space-4);
  }

  .notes-textarea {
    font-size: var(--font-size-base);
    padding: var(--space-3);
  }
}
</style>
