<template>
  <div class="code-editor" :style="editorStyle">
    <!-- 行号 -->
    <div v-if="config.showLineNumbers" class="line-numbers">
      <div
        v-for="n in lineCount"
        :key="n"
        class="line-number"
        :style="{ color: config.textColor, opacity: 0.5 }"
      >
        {{ n }}
      </div>
    </div>
    
    <!-- 代码编辑区 -->
    <div class="code-area">
      <textarea
        ref="textareaRef"
        v-model="content"
        class="code-textarea"
        :placeholder="placeholder"
        :style="textareaStyle"
        spellcheck="false"
        @input="onInput"
        @keydown="onKeyDown"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EditorConfig } from '../../types/wechat-note'

interface Props {
  modelValue: string
  config: EditorConfig
  placeholder?: string
  language?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '// 在此输入代码...',
  language: 'javascript'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: []
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const content = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

const lineCount = computed(() => {
  return content.value.split('\n').length
})

const editorStyle = computed(() => ({
  backgroundColor: props.config.backgroundColor,
  borderRadius: props.config.borderRadius,
  display: 'flex',
  fontFamily: props.config.fontFamily,
  fontSize: props.config.fontSize,
  lineHeight: props.config.lineHeight
}))

const textareaStyle = computed(() => ({
  fontFamily: props.config.fontFamily,
  fontSize: props.config.fontSize,
  lineHeight: props.config.lineHeight,
  color: props.config.textColor,
  backgroundColor: 'transparent'
}))

function onInput() {
  emit('update:modelValue', content.value)
  emit('change')
}

function onKeyDown(e: KeyboardEvent) {
  // Tab 键插入缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    insertText('  ')
    return
  }
  
  // Enter 键自动缩进
  if (e.key === 'Enter') {
    e.preventDefault()
    const textarea = textareaRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = content.value
    
    // 获取当前行的缩进
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.substring(lineStart, start)
    const indent = currentLine.match(/^\s*/)?.[0] || ''
    
    // 检查是否需要额外缩进（行尾有 { 或 :）
    const needsExtraIndent = /[{\[:]\s*$/.test(currentLine)
    const extraIndent = needsExtraIndent ? '  ' : ''
    
    const newText = '\n' + indent + extraIndent
    content.value = value.substring(0, start) + newText + value.substring(end)
    
    setTimeout(() => {
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
    
    emit('update:modelValue', content.value)
    emit('change')
    return
  }
  
  // 自动闭合括号
  const brackets: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '`': '`'
  }
  
  if (brackets[e.key]) {
    e.preventDefault()
    const closing = brackets[e.key]
    insertText(e.key + closing, -1)
    return
  }
}

function insertText(text: string, cursorOffset: number = 0) {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  content.value = content.value.substring(0, start) + text + content.value.substring(end)
  
  setTimeout(() => {
    const newCursor = start + text.length + cursorOffset
    textarea.setSelectionRange(newCursor, newCursor)
    emit('update:modelValue', content.value)
    emit('change')
  }, 0)
}
</script>

<style scoped>
.code-editor {
  width: 100%;
  min-height: 400px;
  padding: 20px;
}

.line-numbers {
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  margin-right: 16px;
  user-select: none;
  text-align: right;
}

.line-number {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.code-area {
  flex: 1;
  position: relative;
}

.code-textarea {
  width: 100%;
  min-height: 400px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

.code-textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}
</style>
