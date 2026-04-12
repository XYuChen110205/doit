<template>
  <div class="beautiful-editor">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="editor-preview" @click="openDetail">
      <div class="preview-bg" :style="previewBgStyle"></div>
      <div class="preview-overlay"></div>
      <div class="preview-content">
        <h4 class="preview-title">{{ title || '无标题' }}</h4>
        <p class="preview-text">{{ previewText }}</p>
      </div>
      <div class="preview-footer">
        <span class="word-count">{{ wordCount }} 字</span>
        <span class="update-time">{{ formatTime(updatedAt) }}</span>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="editor-detail">
      <!-- 顶部工具栏 -->
      <div class="detail-toolbar">
        <div class="toolbar-left">
          <button class="tool-btn" @click="closeDetail" title="返回">
            <SvgIcon name="ChevronLeft" :size="18" />
          </button>
          <input
            v-model="title"
            class="title-input"
            placeholder="输入文章标题..."
            @blur="saveData"
          />
        </div>
        <div class="toolbar-right">
          <span class="word-count">{{ wordCount }} 字</span>
          <button class="tool-btn" @click="showBgSelector = !showBgSelector" title="更换背景">
            <SvgIcon name="Palette" :size="16" />
          </button>
          <button class="tool-btn" @click="copyContent" title="复制全文">
            <SvgIcon name="Copy" :size="16" />
          </button>
          <button class="tool-btn" @click="exportImage" title="导出图片">
            <SvgIcon name="Download" :size="16" />
          </button>
        </div>
      </div>

      <!-- 背景选择器 -->
      <div v-if="showBgSelector" class="bg-selector">
        <div class="selector-header">
          <span>选择背景</span>
          <button class="close-btn" @click="showBgSelector = false">
            <SvgIcon name="ChevronUp" :size="16" />
          </button>
        </div>
        <div class="bg-grid">
          <div
            v-for="bg in backgroundOptions"
            :key="bg.id"
            class="bg-option"
            :class="{ active: selectedBg === bg.id }"
            @click="selectBackground(bg)"
          >
            <div class="bg-thumb" :style="{ backgroundImage: `url(${bg.thumb})` }"></div>
            <span class="bg-name">{{ bg.name }}</span>
          </div>
        </div>
      </div>

      <!-- 编辑器主体 -->
      <div 
        ref="editorContainerRef"
        class="editor-container"
        :style="editorBgStyle"
      >
        <div class="editor-paper">
          <div class="paper-title">{{ title || '无标题' }}</div>
          <div 
            ref="editorRef"
            class="editor-content"
            contenteditable="true"
            @input="onInput"
            @keydown="onKeyDown"
            v-html="content"
          ></div>
          <div class="paper-footer">
            <span class="author">{{ author || '匿名' }}</span>
            <span class="date">{{ formatDate(updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="detail-footer">
        <span class="save-status">{{ saveStatus }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'

interface BeautifulEditorData {
  title?: string
  content?: string
  author?: string
  backgroundId?: string
  updatedAt?: string
}

interface BackgroundOption {
  id: string
  name: string
  url: string
  thumb: string
  textColor: string
  titleColor: string
}

const props = defineProps<{
  instanceId: string
  initialData?: BeautifulEditorData
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: BeautifulEditorData]
  openDetail: []
  closeDetail: []
}>()

// 背景选项
const backgroundOptions: BackgroundOption[] = [
  { id: 'bg1', name: '田园风光', url: '/backgrounds/bg1.jpg', thumb: '/backgrounds/bg1.jpg', textColor: '#333', titleColor: '#2c3e50' },
  { id: 'bg2', name: '春日嬉戏', url: '/backgrounds/bg2.jpg', thumb: '/backgrounds/bg2.jpg', textColor: '#333', titleColor: '#2c3e50' },
  { id: 'bg3', name: '荷塘月色', url: '/backgrounds/bg3.jpg', thumb: '/backgrounds/bg3.jpg', textColor: '#333', titleColor: '#2c3e50' },
  { id: 'bg4', name: '桂花飘香', url: '/backgrounds/bg4.jpg', thumb: '/backgrounds/bg4.jpg', textColor: '#333', titleColor: '#2c3e50' },
  { id: 'bg5', name: '松鼠纸船', url: '/backgrounds/bg5.jpg', thumb: '/backgrounds/bg5.jpg', textColor: '#333', titleColor: '#2c3e50' },
  { id: 'bg6', name: '图书馆', url: '/backgrounds/bg6.jpg', thumb: '/backgrounds/bg6.jpg', textColor: '#333', titleColor: '#2c3e50' },
]

// 状态
const title = ref('')
const content = ref('')
const author = ref('')
const selectedBg = ref('bg2')
const updatedAt = ref('')
const saveStatus = ref('已保存')
const showBgSelector = ref(false)
const editorRef = ref<HTMLDivElement>()
const editorContainerRef = ref<HTMLDivElement>()
let saveTimeout: ReturnType<typeof setTimeout> | null = null

// 计算属性
const currentBg = computed(() => {
  return backgroundOptions.find(bg => bg.id === selectedBg.value) || backgroundOptions[1]
})

const previewBgStyle = computed(() => ({
  backgroundImage: `url(${currentBg.value.url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

const editorBgStyle = computed(() => ({
  backgroundImage: `url(${currentBg.value.url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed'
}))

const previewText = computed(() => {
  const temp = document.createElement('div')
  temp.innerHTML = content.value
  let text = temp.textContent || temp.innerText || ''
  if (text.length > 60) {
    text = text.slice(0, 60) + '...'
  }
  return text || '点击开始写作...'
})

const wordCount = computed(() => {
  const temp = document.createElement('div')
  temp.innerHTML = content.value
  const text = temp.textContent || temp.innerText || ''
  return text.length
})

// 方法
function loadData() {
  if (props.initialData) {
    title.value = props.initialData.title || ''
    content.value = props.initialData.content || ''
    author.value = props.initialData.author || ''
    selectedBg.value = props.initialData.backgroundId || 'bg2'
    updatedAt.value = props.initialData.updatedAt || new Date().toISOString()
  }
}

function saveData() {
  updatedAt.value = new Date().toISOString()
  emit('update', {
    title: title.value,
    content: content.value,
    author: author.value,
    backgroundId: selectedBg.value,
    updatedAt: updatedAt.value
  })
  saveStatus.value = '已保存'
}

function onInput() {
  if (!editorRef.value) return
  content.value = editorRef.value.innerHTML
  saveStatus.value = '保存中...'
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveData()
  }, 800)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    document.execCommand('defaultParagraphSeparator', false, 'p')
    document.execCommand('insertParagraph', false)
  }
}

function selectBackground(bg: BackgroundOption) {
  selectedBg.value = bg.id
  saveData()
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  saveData()
  emit('closeDetail')
}

function copyContent() {
  const temp = document.createElement('div')
  temp.innerHTML = content.value
  const text = temp.textContent || temp.innerText || ''
  const fullText = `${title.value}\n\n${text}\n\n—— ${author.value || '匿名'} ${formatDate(updatedAt.value)}`
  navigator.clipboard.writeText(fullText).then(() => {
    saveStatus.value = '已复制'
    setTimeout(() => saveStatus.value = '已保存', 1500)
  })
}

function exportImage() {
  saveStatus.value = '导出功能开发中...'
  setTimeout(() => saveStatus.value = '已保存', 2000)
}

function formatTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatDate(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 监听详情模式变化
watch(() => props.isDetailView, (isDetail) => {
  if (isDetail) {
    setTimeout(() => {
      editorRef.value?.focus()
    }, 100)
  }
})

onMounted(() => {
  loadData()
  if (editorRef.value && content.value) {
    editorRef.value.innerHTML = content.value
  }
})
</script>

<style scoped>
.beautiful-editor {
  height: 100%;
}

/* 缩略图预览 */
.editor-preview {
  height: 100%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
}

.preview-bg {
  position: absolute;
  inset: 0;
  transition: transform 0.3s ease;
}

.editor-preview:hover .preview-bg {
  transform: scale(1.05);
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.8) 100%
  );
}

.preview-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  z-index: 1;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', serif;
}

.preview-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #555;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', serif;
}

.preview-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  font-size: 11px;
  color: #666;
}

/* 详情页 */
.editor-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.title-input {
  flex: 1;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  background: transparent;
  outline: none;
  transition: all 0.2s;
}

.title-input:hover,
.title-input:focus {
  border-color: #ddd;
  background: #fafafa;
}

.title-input::placeholder {
  color: #999;
}

.word-count {
  font-size: 13px;
  color: #999;
  padding: 0 8px;
}

/* 背景选择器 */
.bg-selector {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
}

.bg-grid {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.bg-option {
  flex-shrink: 0;
  width: 80px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-option:hover {
  transform: translateY(-2px);
}

.bg-option.active .bg-thumb {
  box-shadow: 0 0 0 3px #4a90d9;
}

.bg-thumb {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  margin-bottom: 6px;
  transition: all 0.2s;
}

.bg-name {
  font-size: 11px;
  color: #666;
}

.bg-option.active .bg-name {
  color: #4a90d9;
  font-weight: 500;
}

/* 编辑器主体 */
.editor-container {
  flex: 1;
  overflow-y: auto;
  padding: 40px 20px;
  min-height: 400px;
}

.editor-paper {
  max-width: 700px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  padding: 48px 56px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

.paper-title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 32px;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', serif;
  letter-spacing: 2px;
}

.editor-content {
  min-height: 400px;
  font-size: 17px;
  line-height: 2;
  color: #333;
  outline: none;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', serif;
  text-indent: 2em;
}

.editor-content:empty::before {
  content: '在此输入文章内容...';
  color: #999;
  font-style: italic;
}

.editor-content :deep(p) {
  margin: 0 0 1em 0;
  text-indent: 2em;
}

.paper-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  text-align: right;
  font-size: 14px;
  color: #666;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', serif;
}

.author {
  margin-right: 16px;
}

/* 底部状态栏 */
.detail-footer {
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.save-status {
  font-size: 12px;
  color: #999;
}

/* 响应式 */
@media (max-width: 768px) {
  .editor-paper {
    padding: 32px 24px;
  }
  
  .paper-title {
    font-size: 22px;
  }
  
  .editor-content {
    font-size: 15px;
  }
  
  .title-input {
    max-width: 200px;
  }
}
</style>
