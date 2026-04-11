<template>
  <div class="text-editor" :style="editorStyle">
    <textarea
      ref="textareaRef"
      v-model="content"
      class="editor-textarea"
      :placeholder="placeholder"
      :style="textareaStyle"
      @input="onInput"
      @keydown="onKeyDown"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EditorConfig } from '../../types/wechat-note'

interface Props {
  modelValue: string
  config: EditorConfig
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始写作...'
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

const editorStyle = computed(() => ({
  backgroundColor: props.config.backgroundColor,
  borderRadius: props.config.borderRadius,
  padding: props.config.padding,
  minHeight: '400px'
}))

const textareaStyle = computed(() => ({
  fontFamily: props.config.fontFamily,
  fontSize: props.config.fontSize,
  lineHeight: props.config.lineHeight,
  color: props.config.textColor,
  backgroundColor: 'transparent',
  // 文本编辑器首行缩进
  textIndent: props.config.type === 'text' ? '2em' : '0'
}))

function onInput() {
  emit('update:modelValue', content.value)
  emit('change')
}

function onKeyDown(e: KeyboardEvent) {
  // Tab 键插入空格而不是切换焦点
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = textareaRef.value?.selectionStart || 0
    const end = textareaRef.value?.selectionEnd || 0
    const spaces = '  '
    
    content.value = content.value.substring(0, start) + spaces + content.value.substring(end)
    
    // 恢复光标位置
    setTimeout(() => {
      textareaRef.value?.setSelectionRange(start + spaces.length, start + spaces.length)
    }, 0)
    
    emit('update:modelValue', content.value)
    emit('change')
  }
}
</script>

<style scoped>
.text-editor {
  width: 100%;
  min-height: 400px;
}

.editor-textarea {
  width: 100%;
  min-height: 400px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  line-height: 2;
}

.editor-textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}
</style>
