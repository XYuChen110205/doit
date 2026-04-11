<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button
        v-for="tool in toolbarTools"
        :key="tool.action"
        class="tool-btn"
        :title="tool.title"
        @click="insertMarkdown(tool.action)"
      >
        <SvgIcon :name="tool.icon" :size="16" />
      </button>
      <div class="toolbar-divider"></div>
      <button
        class="tool-btn"
        :class="{ active: showPreview }"
        title="预览"
        @click="showPreview = !showPreview"
      >
        <SvgIcon name="Eye" :size="16" />
      </button>
    </div>
    
    <!-- 编辑区 -->
    <div class="editor-wrapper" :style="wrapperStyle">
      <textarea
        ref="textareaRef"
        v-model="content"
        class="markdown-textarea"
        :placeholder="placeholder"
        :style="textareaStyle"
        @input="onInput"
        @keydown="onKeyDown"
      ></textarea>
      
      <!-- 预览区 -->
      <div
        v-if="showPreview"
        class="markdown-preview"
        :style="previewStyle"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EditorConfig } from '../../types/wechat-note'
import SvgIcon from '../icons/SvgIcon.vue'

interface Props {
  modelValue: string
  config: EditorConfig
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '使用 Markdown 格式写作...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: []
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const content = ref(props.modelValue)
const showPreview = ref(false)

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

// 工具栏
const toolbarTools = [
  { action: 'bold', icon: 'Bold', title: '粗体' },
  { action: 'italic', icon: 'Italic', title: '斜体' },
  { action: 'heading', icon: 'Heading', title: '标题' },
  { action: 'list', icon: 'List', title: '列表' },
  { action: 'link', icon: 'Link', title: '链接' },
  { action: 'code', icon: 'Code', title: '代码' },
  { action: 'quote', icon: 'Quote', title: '引用' }
]

// 简单的 Markdown 渲染
const renderedMarkdown = computed(() => {
  let html = content.value
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 标题
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 引用
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // 列表
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // 换行
    .replace(/\n/g, '<br>')
  
  return html
})

const wrapperStyle = computed(() => ({
  backgroundColor: props.config.backgroundColor,
  borderRadius: props.config.borderRadius,
  display: 'flex',
  gap: '16px'
}))

const textareaStyle = computed(() => ({
  fontFamily: props.config.fontFamily,
  fontSize: props.config.fontSize,
  lineHeight: props.config.lineHeight,
  color: props.config.textColor,
  backgroundColor: 'transparent',
  flex: showPreview.value ? '1' : 'none',
  width: showPreview.value ? '50%' : '100%'
}))

const previewStyle = computed(() => ({
  fontFamily: props.config.fontFamily,
  fontSize: props.config.fontSize,
  lineHeight: props.config.lineHeight,
  color: props.config.textColor,
  flex: '1',
  width: '50%',
  padding: props.config.padding,
  borderLeft: '1px solid var(--border)',
  overflow: 'auto'
}))

function onInput() {
  emit('update:modelValue', content.value)
  emit('change')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    insertText('  ')
  }
}

function insertText(text: string) {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  content.value = content.value.substring(0, start) + text + content.value.substring(end)
  
  setTimeout(() => {
    textarea.setSelectionRange(start + text.length, start + text.length)
    emit('update:modelValue', content.value)
    emit('change')
  }, 0)
}

function insertMarkdown(action: string) {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  const templates: Record<string, { prefix: string; suffix: string; placeholder: string }> = {
    bold: { prefix: '**', suffix: '**', placeholder: '粗体文本' },
    italic: { prefix: '*', suffix: '*', placeholder: '斜体文本' },
    heading: { prefix: '## ', suffix: '', placeholder: '标题' },
    list: { prefix: '- ', suffix: '', placeholder: '列表项' },
    link: { prefix: '[', suffix: '](url)', placeholder: '链接文本' },
    code: { prefix: '`', suffix: '`', placeholder: 'code' },
    quote: { prefix: '> ', suffix: '', placeholder: '引用文本' }
  }
  
  const template = templates[action]
  if (!template) return
  
  const textToInsert = selectedText || template.placeholder
  const newText = template.prefix + textToInsert + template.suffix
  
  content.value = content.value.substring(0, start) + newText + content.value.substring(end)
  
  setTimeout(() => {
    const cursorPos = start + template.prefix.length + textToInsert.length
    textarea.setSelectionRange(cursorPos, cursorPos)
    emit('update:modelValue', content.value)
    emit('change')
  }, 0)
}
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  min-height: 400px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border-bottom: 1px solid var(--border);
}

.tool-btn {
  width: 32px;
  height: 32px;
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

.tool-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn.active {
  background: var(--accent-primary);
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 var(--space-2);
}

.editor-wrapper {
  width: 100%;
  min-height: 400px;
}

.markdown-textarea {
  width: 100%;
  min-height: 400px;
  padding: var(--space-4);
  border: none;
  outline: none;
  resize: none;
  background: transparent;
}

.markdown-preview {
  padding: var(--space-4);
  overflow: auto;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin-top: 0;
  margin-bottom: var(--space-3);
}

.markdown-preview :deep(p) {
  margin-bottom: var(--space-2);
}

.markdown-preview :deep(pre) {
  background: var(--bg-secondary);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  overflow: auto;
}

.markdown-preview :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid var(--accent-primary);
  padding-left: var(--space-3);
  margin: var(--space-3) 0;
  color: var(--text-secondary);
}

.markdown-preview :deep(li) {
  margin-left: var(--space-4);
}

.markdown-preview :deep(a) {
  color: var(--accent-primary);
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}
</style>
