<template>
  <div class="inbox-view">
    <div class="inbox-container">
      <!-- 标题 -->
      <h1 class="inbox-title">收集箱</h1>

      <!-- 输入框 -->
      <div class="input-box">
        <input
          v-model="newContent"
          type="text"
          class="inbox-input"
          placeholder="快速记下你的想法..."
          @keyup.enter="createItem"
        />
      </div>

      <!-- 条目列表 -->
      <div class="inbox-list">
        <div
          v-for="item in inboxItems"
          :key="item.id"
          class="inbox-item"
        >
          <div class="item-content">
            <span class="item-text">{{ item.content }}</span>
            <span class="item-time">{{ formatTime(item.created_at) }}</span>
          </div>
          <div class="item-actions">
            <button class="action-btn convert" @click="convertItem(item.id)">
              转为任务
            </button>
            <button class="action-btn delete" @click="deleteItem(item.id)">
              删除
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="inboxItems.length === 0" class="empty-state">
          还没有想法，随时记录吧
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { InboxItem } from '../types'
import { createInbox, listInbox, convertInbox, deleteInbox } from '../api/inbox'

// 收集箱条目
const inboxItems = ref<InboxItem[]>([])
const newContent = ref('')
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

// 加载列表
async function loadInbox() {
  try {
    const items = await listInbox()
    // 按创建时间倒序排列
    inboxItems.value = items.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } catch (error) {
    console.error('加载收集箱失败:', error)
  }
}

// 创建条目
async function createItem() {
  const content = newContent.value.trim()
  if (!content) return

  try {
    await createInbox(content)
    newContent.value = ''
    await loadInbox()
  } catch (error) {
    console.error('创建收集箱条目失败:', error)
  }
}

// 转为任务
async function convertItem(id: number) {
  try {
    await convertInbox(id)
    await loadInbox()
    showToast('已转为任务')
  } catch (error) {
    console.error('转为任务失败:', error)
  }
}

// 删除条目
async function deleteItem(id: number) {
  try {
    await deleteInbox(id)
    await loadInbox()
  } catch (error) {
    console.error('删除收集箱条目失败:', error)
  }
}

// 格式化时间
function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

// 显示 Toast
function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

// 初始化
onMounted(() => {
  loadInbox()
})
</script>

<style scoped>
.inbox-view {
  min-height: calc(100vh - 64px - var(--space-8) * 2);
  padding: var(--space-8);
}

.inbox-container {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* 标题 */
.inbox-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-wide);
  text-align: center;
}

/* 输入框 */
.input-box {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}

.inbox-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: var(--transition-normal);
  outline: none;
}

.inbox-input::placeholder {
  color: var(--text-muted);
}

.inbox-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

/* 条目列表 */
.inbox-list {
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
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.inbox-item:hover {
  box-shadow: var(--shadow-hover);
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
  line-height: var(--line-height-tight);
  word-break: break-word;
}

.item-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: var(--letter-spacing-wide);
}

/* 操作按钮 - 始终显示 */
.item-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-normal);
  letter-spacing: var(--letter-spacing-wide);
  background-color: transparent;
}

.action-btn.convert {
  color: var(--accent-primary);
}

.action-btn.convert:hover {
  background-color: var(--accent-primary-light);
}

.action-btn.delete {
  color: var(--accent-danger);
}

.action-btn.delete:hover {
  background-color: rgba(204, 139, 139, 0.1);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  color: var(--text-muted);
  font-size: var(--font-size-md);
  letter-spacing: var(--letter-spacing-wide);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-3) var(--space-5);
  background-color: var(--text-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-float);
  z-index: var(--z-toast);
  letter-spacing: var(--letter-spacing-wide);
}

/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .inbox-view {
    padding: var(--space-5);
  }

  .inbox-container {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .inbox-view {
    padding: var(--space-4);
  }

  .inbox-title {
    font-size: var(--font-size-xl);
  }

  .inbox-input {
    font-size: 16px;
  }

  .inbox-item {
    padding: var(--space-3);
  }

  .action-btn {
    padding: var(--space-1) var(--space-2);
    font-size: 11px;
  }
}
</style>
