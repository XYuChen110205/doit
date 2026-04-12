<template>
  <div class="inbox-view">
    <!-- 添加新条目 -->
    <div class="add-section">
      <div class="input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="newItemContent"
          class="inbox-textarea"
          placeholder="记录任何想法、待办事项...&#10;支持多行输入，按 Ctrl+Enter 添加"
          @input="autoResize"
          @keydown.ctrl.enter="addItem"
        ></textarea>
        <button
          class="add-btn"
          :disabled="!newItemContent.trim()"
          @click="addItem"
        >
          <SvgIcon name="Plus" :size="16" />
          添加
        </button>
      </div>
    </div>

    <!-- 条目列表 -->
    <div class="items-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="inbox-item"
      >
        <div class="item-content">
          <span class="item-text">{{ item.content }}</span>
          <span class="item-date">{{ formatDate(item.createdAt) }}</span>
        </div>
        <div class="item-actions">
          <button
            class="action-btn convert"
            @click="convertToTask(item)"
            title="转为任务"
          >
            <SvgIcon name="Task" :size="16" />
            <span>转任务</span>
          </button>
          <button
            class="action-btn delete"
            @click="deleteItem(item.id)"
            title="删除"
          >
            <SvgIcon name="Trash" :size="16" />
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="items.length === 0" class="empty-state">
        <SvgIcon name="InboxEmpty" :size="64" />
        <h3>收集箱是空的</h3>
        <p>把任何想法、待办事项先丢进来，稍后再整理</p>
        <div class="empty-tips">
          <div class="tip-item">
            <SvgIcon name="Plus" :size="14" />
            <span>快速记录灵感</span>
          </div>
          <div class="tip-item">
            <SvgIcon name="Task" :size="14" />
            <span>随时转为正式任务</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <Transition name="toast">
      <div v-if="successMessage" class="success-toast">
        <SvgIcon name="Check" :size="16" />
        <span>{{ successMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '../components/icons/SvgIcon.vue'

const router = useRouter()

// 类型定义
interface InboxItem {
  id: string
  content: string
  createdAt: string
}

// 状态
const items = ref<InboxItem[]>([])
const newItemContent = ref('')
const successMessage = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

let successTimer: ReturnType<typeof setTimeout> | null = null

// 自动调整文本框高度
function autoResize() {
  const textarea = textareaRef.value
  if (!textarea) return
  
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 显示成功提示
function showSuccess(message: string) {
  successMessage.value = message
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 加载收集箱条目
function loadItems() {
  const saved = localStorage.getItem('inboxItems')
  if (saved) {
    items.value = JSON.parse(saved)
  }
}

// 保存到本地存储
function saveItems() {
  localStorage.setItem('inboxItems', JSON.stringify(items.value))
}

// 添加新条目
function addItem() {
  const content = newItemContent.value.trim()
  if (!content) return

  const newItem: InboxItem = {
    id: generateId(),
    content,
    createdAt: new Date().toISOString()
  }

  items.value.unshift(newItem)
  saveItems()
  newItemContent.value = ''
  // 重置文本框高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
  showSuccess('已添加到收集箱')
}

// 删除条目
function deleteItem(id: string) {
  items.value = items.value.filter(item => item.id !== id)
  saveItems()
  showSuccess('已删除')
}

// 转为任务
function convertToTask(item: InboxItem) {
  // 获取现有任务
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
  
  // 创建新任务
  const newTask = {
    id: generateId(),
    title: item.content,
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }
  
  tasks.push(newTask)
  localStorage.setItem('tasks', JSON.stringify(tasks))
  
  // 删除收集箱条目
  deleteItem(item.id)
  
  showSuccess('已转为今日任务')
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.inbox-view {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* 添加区域 */
.add-section {
  margin-bottom: var(--space-6);
}

.input-wrapper {
  display: flex;
  gap: var(--space-3);
  background: var(--bg-card);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.inbox-textarea {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: var(--transition-normal);
  resize: none;
  min-height: 60px;
  max-height: 200px;
  font-family: inherit;
  line-height: 1.5;
  overflow-y: auto;
}

.inbox-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.inbox-textarea::placeholder {
  color: var(--text-muted);
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
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;
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

/* 条目列表 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.inbox-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.inbox-item:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.item-text {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  line-height: 1.5;
  word-break: break-word;
}

.item-date {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.item-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.action-btn.convert {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
}

.action-btn.convert:hover {
  background: var(--accent-primary);
  color: white;
}

.action-btn.delete {
  background: var(--bg-secondary);
  color: var(--text-muted);
  padding: var(--space-2);
}

.action-btn.delete:hover {
  background: rgba(229, 115, 115, 0.15);
  color: var(--accent-danger);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12);
  color: var(--text-muted);
}

.empty-state h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: var(--space-4) 0 var(--space-2);
}

.empty-state p {
  font-size: var(--font-size-md);
  margin-bottom: var(--space-6);
}

.empty-tips {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  justify-content: center;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
}

/* Toast 提示 */
.success-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--accent-success);
  color: white;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  z-index: var(--z-toast, 1000);
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

/* 响应式 */
@media (max-width: 768px) {
  .inbox-view {
    padding: var(--space-4);
  }

  .input-wrapper {
    flex-direction: column;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .inbox-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .empty-tips {
    flex-direction: column;
    align-items: center;
  }
}
</style>
