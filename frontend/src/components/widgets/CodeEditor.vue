<template>
  <div class="code-editor">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="code-preview" @click="openDetail">
      <div class="preview-header">
        <SvgIcon name="Code" :size="20" />
        <span>{{ language.toUpperCase() }}</span>
      </div>
      <div class="preview-code">
        <pre><code>{{ previewCode }}</code></pre>
      </div>
      <div class="preview-footer">
        <span class="file-name">{{ fileName || 'untitled' }}</span>
        <span class="line-count">{{ lineCount }} 行</span>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="code-detail">
      <div class="detail-toolbar">
        <div class="toolbar-left">
          <button class="tool-btn" @click="closeDetail">
            <SvgIcon name="ChevronLeft" :size="18" />
          </button>
          <input
            v-model="fileName"
            class="filename-input"
            placeholder="文件名"
            @blur="saveData"
          />
          <select v-model="language" class="language-select" @change="saveData">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </option>
          </select>
        </div>
        <div class="toolbar-right">
          <button class="tool-btn" @click="copyCode" title="复制代码">
            <SvgIcon name="Copy" :size="16" />
          </button>
          <button class="tool-btn" @click="downloadCode" title="下载文件">
            <SvgIcon name="Download" :size="16" />
          </button>
          <button class="tool-btn" @click="clearCode" title="清空">
            <SvgIcon name="Trash" :size="16" />
          </button>
        </div>
      </div>

      <div class="editor-container">
        <div class="line-numbers">
          <span v-for="n in lineCount" :key="n" class="line-num">{{ n }}</span>
        </div>
        <textarea
          ref="codeRef"
          v-model="code"
          class="code-textarea"
          :class="language"
          spellcheck="false"
          @input="onInput"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <div class="detail-footer">
        <span class="save-status">{{ saveStatus }}</span>
        <span class="cursor-position">行 {{ cursorLine }}, 列 {{ cursorCol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'

interface CodeEditorData {
  fileName?: string
  language?: string
  code?: string
  updatedAt?: string
}

const props = defineProps<{
  instanceId: string
  initialData?: CodeEditorData
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: CodeEditorData]
  openDetail: []
  closeDetail: []
}>()

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
]

const fileName = ref('')
const language = ref('javascript')
const code = ref('')
const updatedAt = ref('')
const saveStatus = ref('已保存')
const cursorLine = ref(1)
const cursorCol = ref(1)
const codeRef = ref<HTMLTextAreaElement>()
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const previewCode = computed(() => {
  const lines = code.value.split('\n').slice(0, 6)
  return lines.join('\n') || '// 点击编辑代码...'
})

const lineCount = computed(() => {
  return code.value.split('\n').length
})

function loadData() {
  if (props.initialData) {
    fileName.value = props.initialData.fileName || ''
    language.value = props.initialData.language || 'javascript'
    code.value = props.initialData.code || ''
    updatedAt.value = props.initialData.updatedAt || new Date().toISOString()
  }
}

function saveData() {
  updatedAt.value = new Date().toISOString()
  emit('update', {
    fileName: fileName.value,
    language: language.value,
    code: code.value,
    updatedAt: updatedAt.value
  })
  saveStatus.value = '已保存'
}

function onInput() {
  saveStatus.value = '保存中...'
  updateCursorPosition()
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveData()
  }, 500)
}

function updateCursorPosition() {
  if (!codeRef.value) return
  const pos = codeRef.value.selectionStart
  const lines = code.value.substring(0, pos).split('\n')
  cursorLine.value = lines.length
  cursorCol.value = lines[lines.length - 1].length + 1
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = codeRef.value!.selectionStart
    const end = codeRef.value!.selectionEnd
    code.value = code.value.substring(0, start) + '  ' + code.value.substring(end)
    setTimeout(() => {
      codeRef.value!.selectionStart = codeRef.value!.selectionEnd = start + 2
    }, 0)
  }
  updateCursorPosition()
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  saveData()
  emit('closeDetail')
}

function copyCode() {
  navigator.clipboard.writeText(code.value).then(() => {
    saveStatus.value = '已复制'
    setTimeout(() => saveStatus.value = '已保存', 1500)
  })
}

function downloadCode() {
  const blob = new Blob([code.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value || `code.${language.value}`
  a.click()
  URL.revokeObjectURL(url)
}

function clearCode() {
  if (code.value && confirm('确定要清空代码吗？')) {
    code.value = ''
    saveData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.code-editor {
  height: 100%;
}

/* 缩略图预览 */
.code-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  cursor: pointer;
  background: #1e1e1e;
  color: #d4d4d4;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #fff;
  font-weight: 500;
}

.preview-code {
  flex: 1;
  overflow: hidden;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.preview-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #9cdcfe;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
  font-size: 11px;
  color: #888;
}

/* 详情页 */
.code-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #333;
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #3c3c3c;
  color: #fff;
}

.filename-input {
  padding: 6px 10px;
  background: #3c3c3c;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  width: 150px;
}

.filename-input:focus {
  outline: none;
  border-color: #007acc;
}

.language-select {
  padding: 6px 10px;
  background: #3c3c3c;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.language-select:focus {
  outline: none;
  border-color: #007acc;
}

/* 编辑器 */
.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.line-numbers {
  width: 50px;
  background: #1e1e1e;
  border-right: 1px solid #333;
  padding: 10px 0;
  text-align: right;
  overflow: hidden;
  flex-shrink: 0;
}

.line-num {
  display: block;
  padding: 0 10px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #858585;
}

.code-textarea {
  flex: 1;
  padding: 10px 16px;
  background: #1e1e1e;
  border: none;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  tab-size: 2;
}

/* 底部 */
.detail-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #007acc;
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
}

.save-status {
  color: #fff;
}

.cursor-position {
  color: #fff;
}
</style>
