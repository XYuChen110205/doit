<template>
  <div class="lined-editor">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="lined-preview" @click="openDetail">
      <div class="preview-content" :style="previewStyle">
        <h4 class="preview-title">{{ localTitle }}</h4>
        <p class="preview-text" v-html="previewContent"></p>
      </div>
      <div class="preview-footer">
        <span class="word-count">{{ wordCount }} 字</span>
      </div>
    </div>

    <!-- 详情页 -->
    <template v-else>
      <!-- 标题栏 -->
      <div class="editor-header">
        <button class="back-btn" @click="closeDetail">
          <SvgIcon name="ChevronLeft" :size="18" />
        </button>
        <input
          v-model="localTitle"
          class="title-input"
          placeholder="输入标题..."
          @blur="saveTitle"
        />
        <div class="header-actions">
          <span v-if="saveStatus" class="save-status">{{ saveStatus }}</span>
          <button class="action-btn" @click="showSettings = !showSettings">
            <SvgIcon name="Settings" :size="16" />
          </button>
        </div>
      </div>

      <!-- 设置面板 -->
      <div v-if="showSettings" class="settings-panel">
        <div class="setting-row">
          <label>行高</label>
          <input
            type="range"
            v-model.number="lineHeight"
            min="20"
            max="40"
            @change="updateLineHeight"
          />
          <span>{{ lineHeight }}px</span>
        </div>
        <div class="setting-row">
          <label>横线颜色</label>
          <input
            type="color"
            v-model="lineColor"
            @change="updateColors"
          />
        </div>
        <div class="setting-row">
          <label>纸张颜色</label>
          <input
            type="color"
            v-model="paperColor"
            @change="updateColors"
          />
        </div>
      </div>

      <!-- 编辑器内容区 -->
      <div
        class="lined-content"
        :style="linedStyle"
        @click="focusEditor"
      >
        <div
          ref="editorRef"
          class="editor-area"
          contenteditable="true"
          :style="editorStyle"
          @input="onInput"
          @keydown="onKeyDown"
          v-html="content"
        ></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'

const props = defineProps<{
  instanceId: string
  initialTitle?: string
  initialContent?: string
  initialLineHeight?: number
  initialLineColor?: string
  initialPaperColor?: string
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: any]
  updateTitle: [title: string]
  openDetail: []
  closeDetail: []
}>()

// 编辑器引用
const editorRef = ref<HTMLDivElement>()

// 状态
const localTitle = ref(props.initialTitle || '未命名')
const content = ref(props.initialContent || '')
const lineHeight = ref(props.initialLineHeight || 28)
const lineColor = ref(props.initialLineColor || '#e8e8e8')
const paperColor = ref(props.initialPaperColor || '#faf8f5')
const saveStatus = ref('')
const showSettings = ref(false)
let saveTimeout: number | null = null

// 计算属性
const linedStyle = computed(() => ({
  backgroundColor: paperColor.value,
  backgroundImage: `repeating-linear-gradient(
    transparent,
    transparent ${lineHeight.value - 1}px,
    ${lineColor.value} ${lineHeight.value - 1}px,
    ${lineColor.value} ${lineHeight.value}px
  )`,
  backgroundAttachment: 'local'
}))

const editorStyle = computed(() => ({
  lineHeight: `${lineHeight.value}px`,
  minHeight: '300px'
}))

const previewStyle = computed(() => ({
  backgroundColor: paperColor.value
}))

const previewContent = computed(() => {
  // 移除HTML标签，只保留纯文本预览
  const temp = document.createElement('div')
  temp.innerHTML = content.value
  let text = temp.textContent || temp.innerText || ''
  if (text.length > 80) {
    text = text.slice(0, 80) + '...'
  }
  return text
})

const wordCount = computed(() => {
  const temp = document.createElement('div')
  temp.innerHTML = content.value
  const text = temp.textContent || temp.innerText || ''
  return text.length
})

// 聚焦编辑器
function focusEditor() {
  editorRef.value?.focus()
}

// 输入处理
function onInput() {
  if (!editorRef.value) return
  
  const html = editorRef.value.innerHTML
  content.value = html
  
  // 自动保存
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveStatus.value = '保存中...'
  
  saveTimeout = window.setTimeout(() => {
    saveData()
  }, 1000)
}

// 键盘处理
function onKeyDown(e: KeyboardEvent) {
  // Enter 键保持行高
  if (e.key === 'Enter') {
    e.preventDefault()
    document.execCommand('defaultParagraphSeparator', false, 'div')
    document.execCommand('insertParagraph', false)
  }
}

// 保存数据
function saveData() {
  const data = {
    title: localTitle.value,
    content: content.value,
    lineHeight: lineHeight.value,
    lineColor: lineColor.value,
    paperColor: paperColor.value,
    updatedAt: new Date().toISOString()
  }
  
  emit('update', data)
  saveStatus.value = '已保存'
  
  setTimeout(() => {
    saveStatus.value = ''
  }, 2000)
}

// 保存标题
function saveTitle() {
  emit('updateTitle', localTitle.value)
  saveData()
}

// 更新行高
function updateLineHeight() {
  saveData()
}

// 更新颜色
function updateColors() {
  saveData()
}

// 打开详情
function openDetail() {
  emit('openDetail')
}

// 关闭详情
function closeDetail() {
  saveData()
  emit('closeDetail')
}

// 初始化内容
onMounted(() => {
  if (editorRef.value && content.value) {
    editorRef.value.innerHTML = content.value
  }
})

// 监听初始内容变化
watch(() => props.initialContent, (newContent) => {
  if (newContent && editorRef.value && !content.value) {
    content.value = newContent
    editorRef.value.innerHTML = newContent
  }
})

// 监听详情模式变化，自动聚焦
watch(() => props.isDetailView, (isDetail) => {
  if (isDetail) {
    setTimeout(() => {
      editorRef.value?.focus()
    }, 100)
  }
})
</script>

<style scoped>
.lined-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* 缩略图预览 */
.lined-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: var(--transition-normal);
}

.lined-preview:hover {
  opacity: 0.9;
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.preview-footer {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.word-count {
  font-size: 11px;
  color: var(--text-muted);
}

/* 详情页 */
.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--border-light);
  backdrop-filter: blur(10px);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.title-input {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 4px 0;
}

.title-input::placeholder {
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 设置面板 */
.settings-panel {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-row label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.setting-row input[type="range"] {
  width: 80px;
}

.setting-row input[type="color"] {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.setting-row span {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
}

/* 编辑器内容区 */
.lined-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.editor-area {
  width: 100%;
  min-height: 300px;
  outline: none;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 16px;
  color: var(--text-primary);
}

.editor-area:empty::before {
  content: '开始写作...';
  color: var(--text-muted);
  font-style: italic;
}

/* 编辑器内容样式 */
.editor-area :deep(div) {
  margin: 0;
  padding: 0;
}

.editor-area :deep(p) {
  margin: 0;
  padding: 0;
}

/* 首行缩进 */
.editor-area :deep(div:first-of-type) {
  text-indent: 2em;
}
</style>
