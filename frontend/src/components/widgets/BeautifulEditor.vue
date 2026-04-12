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
          <button class="tool-btn" @click="showSettings = !showSettings" title="设置">
            <SvgIcon name="Settings" :size="16" />
          </button>
          <button class="tool-btn" @click="copyContent" title="复制全文">
            <SvgIcon name="Copy" :size="16" />
          </button>
        </div>
      </div>

      <!-- 设置面板 -->
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-row">
          <!-- 背景图选择 -->
          <div class="setting-group">
            <label>背景图片</label>
            <div class="bg-grid">
              <div
                v-for="bg in backgroundOptions"
                :key="bg.id"
                class="bg-option"
                :class="{ active: selectedBg === bg.id }"
                @click="selectBackground(bg)"
              >
                <div class="bg-thumb" :style="{ backgroundImage: `url(${bg.thumb})` }"></div>
              </div>
            </div>
          </div>
          
          <!-- 透明度调节 -->
          <div class="setting-group sliders">
            <label>背景透明度: {{ Math.round(bgOpacity * 100) }}%</label>
            <input
              type="range"
              v-model.number="bgOpacity"
              min="0"
              max="1"
              step="0.05"
              @input="saveData"
            />
            
            <label>画布透明度: {{ Math.round(paperOpacity * 100) }}%</label>
            <input
              type="range"
              v-model.number="paperOpacity"
              min="0.3"
              max="1"
              step="0.05"
              @input="saveData"
            />
          </div>
        </div>
      </div>

      <!-- 编辑器主体 -->
      <div class="editor-wrapper">
        <!-- 上半部分 - 背景图区域 -->
        <div class="bg-section" :style="bgSectionStyle">
          <div class="bg-image" :style="bgImageStyle"></div>
        </div>
        
        <!-- 下半部分 - 写作区域 -->
        <div class="writing-section">
          <div class="editor-paper" :style="paperStyle">
            <div class="paper-title">{{ title || '无标题' }}</div>
            <textarea
              ref="editorRef"
              v-model="content"
              class="editor-content"
              placeholder="在此输入文章内容..."
              @input="onInput"
            ></textarea>
            <div class="paper-footer">
              <span class="author">{{ author || '匿名' }}</span>
              <span class="date">{{ formatDate(updatedAt) }}</span>
            </div>
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
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'

interface BeautifulEditorData {
  title?: string
  content?: string
  author?: string
  backgroundId?: string
  bgOpacity?: number
  paperOpacity?: number
  updatedAt?: string
}

interface BackgroundOption {
  id: string
  name: string
  url: string
  thumb: string
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
  { id: 'bg1', name: '田园风光', url: './backgrounds/bg1.jpg', thumb: './backgrounds/bg1.jpg' },
  { id: 'bg2', name: '春日嬉戏', url: './backgrounds/bg2.jpg', thumb: './backgrounds/bg2.jpg' },
  { id: 'bg3', name: '荷塘月色', url: './backgrounds/bg3.jpg', thumb: './backgrounds/bg3.jpg' },
  { id: 'bg4', name: '桂花飘香', url: './backgrounds/bg4.jpg', thumb: './backgrounds/bg4.jpg' },
  { id: 'bg5', name: '松鼠纸船', url: './backgrounds/bg5.jpg', thumb: './backgrounds/bg5.jpg' },
  { id: 'bg6', name: '图书馆', url: './backgrounds/bg6.jpg', thumb: './backgrounds/bg6.jpg' },
]

// 状态
const title = ref('')
const content = ref('')
const author = ref('')
const selectedBg = ref('bg2')
const bgOpacity = ref(0.3)
const paperOpacity = ref(0.95)
const updatedAt = ref('')
const saveStatus = ref('已保存')
const showSettings = ref(false)
const editorRef = ref<HTMLTextAreaElement>()
let saveTimeout: ReturnType<typeof setTimeout> | null = null

// 计算属性
const currentBg = computed(() => {
  return backgroundOptions.find(bg => bg.id === selectedBg.value) || backgroundOptions[1]
})

const previewBgStyle = computed(() => ({
  backgroundImage: `url(${currentBg.value.thumb})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

const bgSectionStyle = computed(() => ({
  backgroundImage: `url(${currentBg.value.url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  opacity: bgOpacity.value
}))

const bgImageStyle = computed(() => ({
  backgroundImage: `url(${currentBg.value.url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top'
}))

const paperStyle = computed(() => ({
  backgroundColor: `rgba(255, 255, 255, ${paperOpacity.value})`
}))

const previewText = computed(() => {
  let text = content.value || ''
  if (text.length > 60) {
    text = text.slice(0, 60) + '...'
  }
  return text || '点击开始写作...'
})

const wordCount = computed(() => {
  return content.value.length
})

// 方法
function loadData() {
  if (props.initialData) {
    title.value = props.initialData.title || ''
    content.value = props.initialData.content || ''
    author.value = props.initialData.author || ''
    selectedBg.value = props.initialData.backgroundId || 'bg2'
    bgOpacity.value = props.initialData.bgOpacity ?? 0.3
    paperOpacity.value = props.initialData.paperOpacity ?? 0.95
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
    bgOpacity: bgOpacity.value,
    paperOpacity: paperOpacity.value,
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
  const fullText = `${title.value}\n\n${content.value}\n\n—— ${author.value || '匿名'} ${formatDate(updatedAt.value)}`
  navigator.clipboard.writeText(fullText).then(() => {
    saveStatus.value = '已复制'
    setTimeout(() => saveStatus.value = '已保存', 1500)
  })
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

onMounted(() => {
  loadData()
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
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.7) 100%
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
  color: #444;
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
  background: rgba(255, 255, 255, 0.95);
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
  flex-shrink: 0;
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

/* 设置面板 */
.settings-panel {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 20px;
  animation: slideDown 0.3s ease;
  flex-shrink: 0;
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

.settings-row {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.setting-group.sliders {
  min-width: 200px;
}

.setting-group input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.setting-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4a90d9;
  cursor: pointer;
}

.bg-grid {
  display: flex;
  gap: 8px;
}

.bg-option {
  width: 60px;
  height: 45px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  overflow: hidden;
}

.bg-option:hover {
  transform: translateY(-2px);
}

.bg-option.active {
  border-color: #4a90d9;
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.3);
}

.bg-thumb {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

/* 编辑器主体 */
.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 上半部分 - 背景图 */
.bg-section {
  height: 40%;
  min-height: 200px;
  position: relative;
  transition: opacity 0.3s ease;
}

.bg-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
}

/* 下半部分 - 写作区域 */
.writing-section {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(to bottom, #f5f5f5 0%, #fff 100px);
}

.editor-paper {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 12px;
  padding: 40px 48px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 400px;
}

.paper-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 28px;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', 'Microsoft YaHei', serif;
  letter-spacing: 2px;
}

.editor-content {
  width: 100%;
  min-height: 300px;
  font-size: 16px;
  line-height: 2;
  color: #333;
  outline: none;
  border: none;
  resize: none;
  background: transparent;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', 'Microsoft YaHei', serif;
}

.editor-content::placeholder {
  color: #999;
  font-style: italic;
}

.paper-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  text-align: right;
  font-size: 13px;
  color: #666;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', 'Microsoft YaHei', serif;
}

.author {
  margin-right: 16px;
}

/* 底部状态栏 */
.detail-footer {
  padding: 10px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  flex-shrink: 0;
}

.save-status {
  font-size: 12px;
  color: #999;
}

/* 响应式 */
@media (max-width: 768px) {
  .settings-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .bg-section {
    height: 30%;
    min-height: 150px;
  }
  
  .editor-paper {
    padding: 24px;
  }
  
  .paper-title {
    font-size: 20px;
  }
  
  .editor-content {
    font-size: 15px;
  }
  
  .title-input {
    max-width: 200px;
  }
}
</style>
