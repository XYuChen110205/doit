<template>
  <div
    class="widget-background"
    :style="backgroundStyle"
  >
    <!-- 横线纸张背景 -->
    <template v-if="config.type === BackgroundType.LINED">
      <div class="lined-paper" :style="linedPaperStyle">
        <slot />
      </div>
    </template>
    
    <!-- 网格背景 -->
    <template v-else-if="config.type === BackgroundType.GRID">
      <div class="grid-paper" :style="gridPaperStyle">
        <slot />
      </div>
    </template>
    
    <!-- 点阵背景 -->
    <template v-else-if="config.type === BackgroundType.DOT">
      <div class="dot-paper" :style="dotPaperStyle">
        <slot />
      </div>
    </template>
    
    <!-- 其他背景 -->
    <template v-else>
      <div class="default-background" :style="defaultStyle">
        <slot />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BackgroundType, type BackgroundConfig } from '../../types/widget'

const props = defineProps<{
  config: BackgroundConfig
}>()

// 背景样式
const backgroundStyle = computed(() => {
  const style: Record<string, string> = {}
  
  switch (props.config.type) {
    case BackgroundType.SOLID:
      style.backgroundColor = props.config.color || '#ffffff'
      break
    case BackgroundType.GRADIENT:
      style.background = `linear-gradient(135deg, ${props.config.gradientFrom || '#667eea'}, ${props.config.gradientTo || '#764ba2'})`
      break
    case BackgroundType.IMAGE:
      if (props.config.imageUrl) {
        style.backgroundImage = `url(${props.config.imageUrl})`
        style.backgroundSize = 'cover'
        style.backgroundPosition = 'center'
      }
      break
    case BackgroundType.PAPER:
      style.backgroundColor = props.config.paperColor || '#faf8f5'
      break
  }
  
  if (props.config.opacity !== undefined) {
    style.opacity = String(props.config.opacity)
  }
  
  return style
})

// 横线纸张样式
const linedPaperStyle = computed(() => {
  const lineColor = props.config.lineColor || '#e0e0e0'
  const lineSpacing = props.config.lineSpacing || 28
  const paperColor = props.config.paperColor || '#faf8f5'
  
  return {
    backgroundColor: paperColor,
    backgroundImage: `repeating-linear-gradient(
      transparent,
      transparent ${lineSpacing - 1}px,
      ${lineColor} ${lineSpacing - 1}px,
      ${lineColor} ${lineSpacing}px
    )`,
    backgroundAttachment: 'local',
    lineHeight: `${lineSpacing}px`
  }
})

// 网格纸张样式
const gridPaperStyle = computed(() => {
  const lineColor = props.config.lineColor || '#e0e0e0'
  const lineSpacing = props.config.lineSpacing || 20
  const paperColor = props.config.paperColor || '#ffffff'
  
  return {
    backgroundColor: paperColor,
    backgroundImage: `
      linear-gradient(${lineColor} 1px, transparent 1px),
      linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
    `,
    backgroundSize: `${lineSpacing}px ${lineSpacing}px`
  }
})

// 点阵纸张样式
const dotPaperStyle = computed(() => {
  const lineColor = props.config.lineColor || '#d0d0d0'
  const lineSpacing = props.config.lineSpacing || 20
  const paperColor = props.config.paperColor || '#ffffff'
  
  return {
    backgroundColor: paperColor,
    backgroundImage: `radial-gradient(circle, ${lineColor} 1px, transparent 1px)`,
    backgroundSize: `${lineSpacing}px ${lineSpacing}px`
  }
})

// 默认背景样式
const defaultStyle = computed(() => {
  return backgroundStyle.value
})
</script>

<style scoped>
.widget-background {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
}

.lined-paper,
.grid-paper,
.dot-paper,
.default-background {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
}

/* 横线纸张特殊样式 */
.lined-paper {
  font-family: 'Georgia', 'Times New Roman', serif;
}

.lined-paper :deep(p),
.lined-paper :deep(div) {
  margin: 0;
  padding: 0;
}

/* 确保内容对齐到横线 */
.lined-paper :deep(*) {
  line-height: inherit;
}
</style>
