<template>
  <div class="font-selector">
    <h3 class="selector-title">字体设置</h3>
    <p class="selector-desc">选择你喜欢的字体风格</p>
    
    <div class="font-options">
      <div
        v-for="font in fontOptions"
        :key="font.id"
        class="font-option"
        :class="{ active: currentFontId === font.id }"
        @click="selectFont(font.id)"
      >
        <div class="font-preview" :style="{ fontFamily: font.family + ', ' + font.fallback }">
          <span class="preview-text">中文 ABC 123</span>
        </div>
        <div class="font-info">
          <span class="font-name">{{ font.name }}</span>
          <span class="font-desc">{{ font.description }}</span>
        </div>
        <div v-if="currentFontId === font.id" class="check-icon">✓</div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-tip">
      <span class="loading-spinner"></span>
      正在加载字体...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFont, fontOptions } from '../composables/useFont'

const { currentFontId, switchFont } = useFont()
const loading = ref(false)

async function selectFont(fontId: string) {
  if (fontId === currentFontId.value) return
  
  loading.value = true
  const success = await switchFont(fontId)
  loading.value = false
  
  if (success) {
    // 可以在这里添加提示
    console.log('字体切换成功:', fontId)
  } else {
    alert('字体加载失败，请检查网络连接')
  }
}
</script>

<style scoped>
.font-selector {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.selector-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.selector-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.font-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.font-option {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-primary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.font-option:hover {
  background: var(--bg-hover);
  border-color: var(--border);
}

.font-option.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary-subtle);
}

.font-preview {
  flex-shrink: 0;
  width: 100px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.preview-text {
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.font-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.font-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.font-desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.check-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .font-option {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .font-preview {
    width: 100%;
    height: 60px;
  }
  
  .check-icon {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
  }
}
</style>
