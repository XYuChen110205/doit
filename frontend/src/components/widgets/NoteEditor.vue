<template>
  <div class="note-editor">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="note-preview" @click="openDetail">
      <div class="preview-content">
        <p v-if="content" class="preview-text">{{ previewText }}</p>
        <p v-else class="empty-hint">点击编辑便签...</p>
      </div>
      <div class="preview-footer">
        <span class="update-time">{{ formatTime(updatedAt) }}</span>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="note-detail">
      <div class="detail-toolbar">
        <div class="toolbar-left">
          <button class="tool-btn" @click="closeDetail" title="返回">
            <SvgIcon name="ChevronLeft" :size="18" />
          </button>
          <span class="word-count">{{ content.length }} 字</span>
        </div>
        <div class="toolbar-right">
          <button class="tool-btn" @click="copyContent" title="复制">
            <SvgIcon name="Copy" :size="16" />
          </button>
          <button class="tool-btn" @click="clearContent" title="清空">
            <SvgIcon name="Trash" :size="16" />
          </button>
        </div>
      </div>

      <div class="detail-content">
        <textarea
          ref="textareaRef"
          v-model="content"
          placeholder="在此输入便签内容..."
          class="note-textarea"
          @input="onInput"
        ></textarea>
      </div>

      <div class="detail-footer">
        <span class="save-status">{{ saveStatus }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'

interface NoteData {
  content?: string
  updatedAt?: string
}

const props = defineProps<{
  instanceId: string
  initialData?: NoteData
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: NoteData]
  openDetail: []
  closeDetail: []
}>()

// 状态
const content = ref('')
const updatedAt = ref<string>('')
const saveStatus = ref('已保存')
const textareaRef = ref<HTMLTextAreaElement>()
let saveTimeout: ReturnType<typeof setTimeout> | null = null

// 计算属性
const previewText = computed(() => {
  const text = content.value.trim()
  if (text.length <= 100) return text
  return text.slice(0, 100) + '...'
})

// 方法
function loadData() {
  if (props.initialData) {
    content.value = props.initialData.content || ''
    updatedAt.value = props.initialData.updatedAt || new Date().toISOString()
  }
}

function saveData() {
  updatedAt.value = new Date().toISOString()
  emit('update', {
    content: content.value,
    updatedAt: updatedAt.value
  })
  saveStatus.value = '已保存'
}

function onInput() {
  saveStatus.value = '保存中...'
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveData()
  }, 500)
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  saveData()
  emit('closeDetail')
}

function copyContent() {
  navigator.clipboard.writeText(content.value).then(() => {
    saveStatus.value = '已复制'
    setTimeout(() => {
      saveStatus.value = '已保存'
    }, 1500)
  })
}

function clearContent() {
  if (content.value && confirm('确定要清空便签内容吗？')) {
    content.value = ''
    saveData()
  }
}

function formatTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60000) return '刚刚'
  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  // 小于24小时
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  // 小于7天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 监听详情模式变化，自动聚焦
watch(() => props.isDetailView, (isDetail) => {
  if (isDetail) {
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 缩略图预览 */
.note-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  cursor: pointer;
  transition: var(--transition-normal);
}

.note-preview:hover {
  background: rgba(0, 0, 0, 0.02);
}

.preview-content {
  flex: 1;
  overflow: hidden;
}

.preview-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}

.preview-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light, rgba(0,0,0,0.05));
}

.update-time {
  font-size: 11px;
  color: var(--text-muted);
}

/* 详情页 */
.note-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.tool-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.word-count {
  font-size: 12px;
  color: var(--text-muted);
}

.detail-content {
  flex: 1;
  overflow: hidden;
}

.note-textarea {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  background: transparent;
  font-family: inherit;
}

.note-textarea::placeholder {
  color: var(--text-muted);
}

.detail-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-hover);
  display: flex;
  justify-content: flex-end;
}

.save-status {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
