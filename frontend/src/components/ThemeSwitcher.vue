<template>
  <div class="theme-switcher">
    <button class="theme-btn" @click="showPanel = !showPanel" title="切换主题">
      <span class="theme-icon">🎨</span>
    </button>
    
    <!-- 主题选择面板 -->
    <Transition name="panel">
      <div v-if="showPanel" class="theme-panel" @click.stop>
        <div class="panel-header">
          <h3>选择主题</h3>
          <button class="close-btn" @click="showPanel = false">×</button>
        </div>
        <div class="theme-options">
          <div
            v-for="(theme, key) in themes"
            :key="key"
            class="theme-option"
            :class="{ active: currentTheme === key }"
            @click="switchTheme(key)"
          >
            <div class="theme-preview" :style="getPreviewStyle(theme)">
              <div class="preview-card"></div>
              <div class="preview-text">Aa</div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{{ theme.description }}</span>
              <span v-if="currentTheme === key" class="theme-check">✓</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- 遮罩 -->
    <Transition name="fade">
      <div v-if="showPanel" class="overlay" @click="showPanel = false"></div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { themes, applyTheme, getCurrentTheme } from '../styles/themes'

const showPanel = ref(false)
const currentTheme = ref('water')

// 切换主题
function switchTheme(themeName: string) {
  applyTheme(themeName)
  currentTheme.value = themeName
  showPanel.value = false
}

// 获取预览样式
function getPreviewStyle(theme: typeof themes.water) {
  return {
    background: `linear-gradient(135deg, ${theme.colors.bgPrimary} 0%, ${theme.colors.bgSecondary} 100%)`,
  }
}

// 初始化
onMounted(() => {
  currentTheme.value = getCurrentTheme()
})
</script>

<style scoped>
.theme-switcher {
  position: relative;
}

.theme-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-card);
}

.theme-btn:hover {
  border-color: var(--accent-primary);
  transform: scale(1.05);
  box-shadow: var(--shadow-hover);
}

.theme-icon {
  font-size: 20px;
}

/* 主题面板 */
.theme-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-float);
  z-index: var(--z-modal);
  min-width: 320px;
  max-width: 90vw;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.panel-header h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.close-btn:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.theme-option:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}

.theme-option.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.theme-preview {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  box-shadow: var(--shadow-card);
  border: 2px solid var(--border);
}

.preview-card {
  width: 24px;
  height: 32px;
  background: white;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.theme-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.theme-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
}

/* 遮罩 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: calc(var(--z-modal) - 1);
}

/* 动画 */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
