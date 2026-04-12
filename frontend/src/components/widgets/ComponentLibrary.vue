<template>
  <BaseModal
    :is-open="isOpen"
    title="添加组件"
    size="large"
    @close="close"
  >
    <template #default>
    <div class="component-library">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <SvgIcon name="Search" :size="18" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索组件..."
          class="search-input"
        />
      </div>

      <!-- 组件分类 -->
      <div class="categories">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-btn"
          :class="{ active: currentCategory === cat.id }"
          @click="currentCategory = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 组件列表 -->
      <div class="components-grid">
        <div
          v-for="widget in filteredWidgets"
          :key="widget.id"
          class="component-card"
          @click="selectWidget(widget)"
        >
          <div class="card-icon" :style="getIconStyle(widget)">
            <SvgIcon :name="widget.icon" :size="28" />
          </div>
          <div class="card-info">
            <h4 class="card-title">{{ widget.title }}</h4>
            <p class="card-desc">{{ widget.description }}</p>
          </div>
          <div class="card-action">
            <SvgIcon name="Plus" :size="20" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredWidgets.length === 0" class="empty-state">
        <SvgIcon name="InboxEmpty" :size="48" />
        <p>没有找到匹配的组件</p>
      </div>
    </div>

    </template>

    <!-- 添加确认对话框 -->
    <template #footer>
      <div v-if="selectedWidget" class="add-confirm">
        <span>添加 "{{ selectedWidget.title }}"?</span>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="selectedWidget = null">取消</button>
          <button class="btn-primary" @click="confirmAdd">确认添加</button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '../base/BaseModal.vue'
import SvgIcon from '../icons/SvgIcon.vue'
import { getAvailableWidgets } from './registry'
import { WidgetType, type WidgetConfig } from '../../types/widget'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [widget: WidgetConfig]
}>()

// 状态
const searchQuery = ref('')
const currentCategory = ref('all')
const selectedWidget = ref<WidgetConfig | null>(null)

// 所有组件
const allWidgets = getAvailableWidgets()

// 分类
const categories = [
  { id: 'all', name: '全部' },
  { id: 'editor', name: '编辑器' },
  { id: 'productivity', name: '效率' },
  { id: 'organize', name: '整理' }
]

// 组件分类映射
const widgetCategories: Record<string, WidgetType[]> = {
  editor: [WidgetType.LINED_PAPER, WidgetType.NOTE_EDITOR, WidgetType.CODE_EDITOR, WidgetType.MARKDOWN, WidgetType.BEAUTIFUL_EDITOR],
  productivity: [WidgetType.POMODORO, WidgetType.TASK_LIST, WidgetType.COUNTDOWN],
  organize: [WidgetType.SCHEDULE, WidgetType.LINKS, WidgetType.STATS]
}

// 过滤后的组件
const filteredWidgets = computed(() => {
  let result = allWidgets

  // 按分类过滤
  if (currentCategory.value !== 'all') {
    const types = widgetCategories[currentCategory.value] || []
    result = result.filter(w => types.includes(w.type))
  }

  // 按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(w =>
      w.title.toLowerCase().includes(query) ||
      w.description.toLowerCase().includes(query)
    )
  }

  return result
})

// 获取图标样式
function getIconStyle(widget: WidgetConfig) {
  const bg = widget.defaultBackground
  if (bg.type === 'gradient') {
    return {
      background: `linear-gradient(135deg, ${bg.gradientFrom}, ${bg.gradientTo})`,
      color: 'white'
    }
  }
  return {
    backgroundColor: bg.color || '#f0f0f0',
    color: '#333'
  }
}

// 选择组件
function selectWidget(widget: WidgetConfig) {
  selectedWidget.value = widget
}

// 确认添加
function confirmAdd() {
  if (selectedWidget.value) {
    emit('select', selectedWidget.value)
    selectedWidget.value = null
    close()
  }
}

// 关闭
function close() {
  searchQuery.value = ''
  currentCategory.value = 'all'
  selectedWidget.value = null
  emit('close')
}
</script>

<style scoped>
.component-library {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.search-bar svg {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* 分类 */
.categories {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.category-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.category-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.category-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 组件网格 */
.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--space-2);
}

.component-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.component-card:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.card-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--accent-primary-light);
  border-radius: var(--radius-md);
  color: var(--accent-primary);
  opacity: 0;
  transition: var(--transition-normal);
}

.component-card:hover .card-action {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
}

.empty-state svg {
  margin-bottom: var(--space-3);
  opacity: 0.5;
}

/* 添加确认 */
.add-confirm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.confirm-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-primary,
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

/* 响应式 */
@media (max-width: 640px) {
  .components-grid {
    grid-template-columns: 1fr;
  }

  .add-confirm {
    flex-direction: column;
    gap: var(--space-3);
  }

  .confirm-actions {
    width: 100%;
  }

  .confirm-actions button {
    flex: 1;
  }
}
</style>
