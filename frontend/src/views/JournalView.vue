<template>
  <div class="journal-view">
    <!-- 顶部标题栏 -->
    <div class="journal-header">
      <div class="header-left">
        <span class="journal-icon">📝</span>
        <span class="journal-title">今日手账</span>
      </div>
      <div class="header-right">
        <span v-if="isSaving" class="save-status">保存中...</span>
        <span v-else-if="lastSaved" class="save-status saved">
          已保存 {{ formatTime(lastSaved) }}
        </span>
      </div>
    </div>

    <!-- 主编辑区 - 横线纸效果 -->
    <div class="journal-editor-container">
      <div class="lined-paper">
        <textarea
          v-model="content"
          class="journal-textarea"
          placeholder="记录今天的点滴..."
          @input="handleInput"
        ></textarea>
        <div class="line-decoration"></div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="journal-footer">
      <span class="hint-text">写下的文字会自动保存</span>
    </div>

    <!-- 碎片流 - 自动记录 -->
    <div class="fragments-section">
      <h3 class="fragments-title">
        <span>碎片流</span>
        <span class="subtitle">· 自动记录</span>
      </h3>
      <div class="fragments-list">
        <div
          v-for="fragment in fragments"
          :key="fragment.id"
          class="fragment-card"
          :class="fragment.type"
        >
          <p class="fragment-content">"{{ fragment.content }}"</p>
          <div class="fragment-meta">
            <span class="fragment-time">{{ formatDate(fragment.time) }}</span>
            <span class="fragment-action">→ {{ fragment.action }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Fragment {
  id: string
  content: string
  time: Date
  type: 'rest' | 'inspiration' | 'project'
  action: string
}

// 状态
const content = ref('')
const isSaving = ref(false)
const lastSaved = ref<Date | null>(null)
const saveTimeout = ref<number | null>(null)

// 模拟碎片数据
const fragments = ref<Fragment[]>([
  {
    id: '1',
    content: '好累，不太想工作',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    type: 'rest',
    action: '帮你休息一下'
  },
  {
    id: '2',
    content: '水色系好舒服 ψ(∇ψ)',
    time: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8小时前
    type: 'inspiration',
    action: '存入灵感库'
  },
  {
    id: '3',
    content: '想学吉他',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
    type: 'project',
    action: '创建项目'
  }
])

// 处理输入
function handleInput() {
  isSaving.value = true
  
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value)
  }
  
  saveTimeout.value = window.setTimeout(() => {
    saveJournal()
  }, 1000)
}

// 保存手账
function saveJournal() {
  const data = {
    content: content.value,
    date: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString()
  }
  localStorage.setItem('today-journal', JSON.stringify(data))
  
  isSaving.value = false
  lastSaved.value = new Date()
}

// 加载手账
function loadJournal() {
  const saved = localStorage.getItem('today-journal')
  if (saved) {
    const data = JSON.parse(saved)
    const today = new Date().toISOString().split('T')[0]
    
    // 只加载今天的内容
    if (data.date === today) {
      content.value = data.content || ''
      if (data.updatedAt) {
        lastSaved.value = new Date(data.updatedAt)
      }
    }
  }
}

// 格式化时间
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

// 格式化日期
function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  
  if (days === 0) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000))
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else {
    return `${days}天前`
  }
}

// 生命周期
onMounted(() => {
  loadJournal()
})

onUnmounted(() => {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value)
  }
  saveJournal()
})
</script>

<style scoped>
.journal-view {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
  min-height: 100vh;
  background: #faf9f6;
}

/* 顶部标题栏 */
.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
  border-bottom: 1px solid #e8e6e1;
  margin-bottom: var(--space-6);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.journal-icon {
  font-size: 24px;
}

.journal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: #8b9dc3;
  font-family: 'Noto Serif SC', serif;
}

.save-status {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.save-status.saved {
  color: #9db5c6;
}

/* 编辑器容器 */
.journal-editor-container {
  margin-bottom: var(--space-4);
}

/* 横线纸效果 */
.lined-paper {
  position: relative;
  background: #fffef8;
  border-radius: var(--radius-lg);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 10px 30px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

/* 横线背景 */
.lined-paper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 31px,
    #e8e4dc 31px,
    #e8e4dc 32px
  );
  background-attachment: local;
  pointer-events: none;
}

/* 左边红线 */
.lined-paper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 48px;
  width: 1px;
  height: 100%;
  background: #f0e6d8;
  pointer-events: none;
}

.journal-textarea {
  width: 100%;
  min-height: 400px;
  padding: 24px 24px 24px 64px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 18px;
  line-height: 32px;
  color: #4a4a4a;
  background: transparent;
  position: relative;
  z-index: 1;
}

.journal-textarea::placeholder {
  color: #c4c4c4;
  font-style: italic;
}

/* 底部提示 */
.journal-footer {
  text-align: right;
  padding: var(--space-3) 0;
}

.hint-text {
  font-size: var(--font-size-sm);
  color: #c4c4c4;
  font-style: italic;
}

/* 碎片流区域 */
.fragments-section {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid #e8e6e1;
}

.fragments-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: #9db5c6;
  margin-bottom: var(--space-4);
  font-family: 'Noto Serif SC', serif;
}

.fragments-title .subtitle {
  font-weight: var(--font-weight-regular);
  color: #c4c4c4;
}

.fragments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.fragment-card {
  background: #fffef8;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border-left: 3px solid #e8e4dc;
  transition: var(--transition-fast);
}

.fragment-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.fragment-card.rest {
  border-left-color: #d4a5a5;
}

.fragment-card.inspiration {
  border-left-color: #9db5c6;
}

.fragment-card.project {
  border-left-color: #a8c5a8;
}

.fragment-content {
  font-family: 'Noto Serif SC', serif;
  font-size: var(--font-size-md);
  color: #5a5a5a;
  font-style: italic;
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

.fragment-meta {
  display: flex;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: #c4c4c4;
}

.fragment-time {
  color: #b8b8b8;
}

.fragment-action {
  color: #9db5c6;
}

/* 响应式 */
@media (max-width: 768px) {
  .journal-view {
    padding: var(--space-4);
  }
  
  .journal-textarea {
    padding: 20px 16px 20px 48px;
    font-size: 16px;
    line-height: 28px;
    min-height: 300px;
  }
  
  .lined-paper::after {
    left: 36px;
  }
  
  .lined-paper::before {
    background-image: repeating-linear-gradient(
      transparent,
      transparent 27px,
      #e8e4dc 27px,
      #e8e4dc 28px
    );
  }
}
</style>
