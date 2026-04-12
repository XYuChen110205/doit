<template>
  <div class="dashboard-view">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">{{ dashboardName }}</h1>
        <span class="widget-count">{{ widgets.length }} 个组件</span>
      </div>
      <div class="header-actions">
        <button class="add-widget-btn" @click="openComponentLibrary">
          <SvgIcon name="Plus" :size="18" />
          添加组件
        </button>
      </div>
    </div>

    <!-- 组件列表 -->
    <div class="widgets-container">
      <TransitionGroup name="widget-list">
        <div
          v-for="widget in sortedWidgets"
          :key="widget.instanceId"
          class="widget-wrapper"
          :class="{ collapsed: widget.isCollapsed }"
        >
          <!-- 组件头部 -->
          <div class="widget-header">
            <div class="widget-title-section">
              <input
                v-model="widget.title"
                class="widget-title-input"
                @blur="updateWidgetTitle(widget.instanceId, widget.title)"
              />
            </div>
            <div class="widget-actions">
              <button
                class="action-btn"
                :title="widget.isCollapsed ? '展开' : '折叠'"
                @click="toggleCollapse(widget.instanceId)"
              >
                <SvgIcon :name="widget.isCollapsed ? 'EyeOff' : 'Eye'" :size="16" />
              </button>
              <button
                class="action-btn"
                title="上移"
                :disabled="isFirst(widget)"
                @click="moveWidget(widget.instanceId, 'up')"
              >
                <SvgIcon name="ChevronUp" :size="16" />
              </button>
              <button
                class="action-btn"
                title="下移"
                :disabled="isLast(widget)"
                @click="moveWidget(widget.instanceId, 'down')"
              >
                <SvgIcon name="ChevronDown" :size="16" />
              </button>
              <button
                class="action-btn danger"
                title="删除"
                @click="confirmRemove(widget)"
              >
                <SvgIcon name="Trash" :size="16" />
              </button>
            </div>
          </div>

          <!-- 组件内容 -->
          <div v-show="!widget.isCollapsed" class="widget-content">
            <WidgetBackground :config="widget.background">
              <!-- 横线纸张编辑器 -->
              <LinedPaperEditor
                v-if="widget.widgetType === WidgetType.LINED_PAPER"
                :instance-id="widget.instanceId"
                :initial-title="widget.title"
                :initial-content="widget.data?.content"
                :initial-line-height="widget.data?.lineHeight"
                :initial-line-color="widget.background.lineColor"
                :initial-paper-color="widget.background.paperColor"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
                @update-title="(title) => updateWidgetTitle(widget.instanceId, title)"
              />

              <!-- 任务列表 -->
              <TaskListWidget
                v-else-if="widget.widgetType === WidgetType.TASK_LIST"
                :instance-id="widget.instanceId"
                :initial-data="widget.data"
                @update="(data) => updateWidgetData(widget.instanceId, data)"
              />

              <!-- 其他组件类型可以在这里添加 -->
              <div v-else class="placeholder-widget">
                <SvgIcon :name="getWidgetIcon(widget.widgetType)" :size="48" />
                <p>{{ getWidgetTitle(widget.widgetType) }}</p>
                <span>组件开发中...</span>
              </div>
            </WidgetBackground>
          </div>
        </div>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="widgets.length === 0" class="empty-state">
        <div class="empty-illustration">
          <SvgIcon name="Layout" :size="64" />
        </div>
        <h3>开始自定义你的页面</h3>
        <p>点击"添加组件"按钮，选择你需要的功能</p>
        <button class="add-widget-btn large" @click="openComponentLibrary">
          <SvgIcon name="Plus" :size="20" />
          添加第一个组件
        </button>
      </div>
    </div>

    <!-- 组件库对话框 -->
    <ComponentLibrary
      :is-open="isComponentLibraryOpen"
      @close="closeComponentLibrary"
      @select="onSelectWidget"
    />

    <!-- 删除确认对话框 -->
    <BaseModal
      v-if="widgetToRemove"
      title="删除组件"
      @close="widgetToRemove = null"
    >
      <div class="remove-confirm">
        <p>确定要删除 "{{ widgetToRemove.title }}" 吗？</p>
        <label class="clear-data-option">
          <input type="checkbox" v-model="clearDataOnRemove" />
          同时清空该组件的数据
        </label>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="widgetToRemove = null">取消</button>
        <button class="btn-danger" @click="removeWidgetConfirmed">删除</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWidgetStore } from '../stores/widgets'
import { WidgetType, type WidgetInstance, type WidgetConfig } from '../types/widget'
import { getWidgetConfig } from '../components/widgets/registry'
import ComponentLibrary from '../components/widgets/ComponentLibrary.vue'
import WidgetBackground from '../components/widgets/WidgetBackground.vue'
import LinedPaperEditor from '../components/widgets/LinedPaperEditor.vue'
import TaskListWidget from '../components/widgets/TaskListWidget.vue'
import BaseModal from '../components/base/BaseModal.vue'
import SvgIcon from '../components/icons/SvgIcon.vue'

const widgetStore = useWidgetStore()

// 状态
const isComponentLibraryOpen = ref(false)
const widgetToRemove = ref<WidgetInstance | null>(null)
const clearDataOnRemove = ref(false)
const dashboardName = ref('我的页面')

// 计算属性
const widgets = computed(() => widgetStore.widgets)
const sortedWidgets = computed(() => widgetStore.sortedWidgets)

// 初始化
onMounted(() => {
  widgetStore.initDashboard()
})

// 打开组件库
function openComponentLibrary() {
  isComponentLibraryOpen.value = true
}

// 关闭组件库
function closeComponentLibrary() {
  isComponentLibraryOpen.value = false
}

// 选择组件
function onSelectWidget(config: WidgetConfig) {
  widgetStore.addWidget(config.type, config)
}

// 更新组件数据
function updateWidgetData(instanceId: string, data: any) {
  widgetStore.updateWidgetData(instanceId, data)
}

// 更新组件标题
function updateWidgetTitle(instanceId: string, title: string) {
  widgetStore.updateWidgetTitle(instanceId, title)
}

// 切换折叠
function toggleCollapse(instanceId: string) {
  widgetStore.toggleWidgetCollapse(instanceId)
}

// 移动组件
function moveWidget(instanceId: string, direction: 'up' | 'down') {
  widgetStore.moveWidget(instanceId, direction)
}

// 确认删除
function confirmRemove(widget: WidgetInstance) {
  widgetToRemove.value = widget
  clearDataOnRemove.value = false
}

// 删除组件
function removeWidgetConfirmed() {
  if (widgetToRemove.value) {
    widgetStore.removeWidget(widgetToRemove.value.instanceId, clearDataOnRemove.value)
    widgetToRemove.value = null
  }
}

// 判断是否第一个
function isFirst(widget: WidgetInstance): boolean {
  return sortedWidgets.value[0]?.instanceId === widget.instanceId
}

// 判断是否最后一个
function isLast(widget: WidgetInstance): boolean {
  return sortedWidgets.value[sortedWidgets.value.length - 1]?.instanceId === widget.instanceId
}

// 获取组件图标
function getWidgetIcon(type: WidgetType): string {
  return getWidgetConfig(type)?.icon || 'Document'
}

// 获取组件标题
function getWidgetTitle(type: WidgetType): string {
  return getWidgetConfig(type)?.title || '未知组件'
}
</script>

<style scoped>
.dashboard-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* 页面头部 */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.widget-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.add-widget-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-widget-btn:hover {
  background: var(--accent-primary-hover);
}

.add-widget-btn.large {
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-md);
}

/* 组件容器 */
.widgets-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 组件包装器 */
.widget-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: var(--transition-normal);
}

.widget-wrapper:hover {
  box-shadow: var(--shadow-float);
}

.widget-wrapper.collapsed {
  opacity: 0.8;
}

/* 组件头部 */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.widget-title-section {
  flex: 1;
  min-width: 0;
}

.widget-title-input {
  width: 100%;
  background: transparent;
  border: none;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  outline: none;
  padding: var(--space-1) 0;
}

.widget-title-input:hover,
.widget-title-input:focus {
  border-bottom: 1px solid var(--border);
}

.widget-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.danger:hover {
  background: rgba(229, 115, 115, 0.1);
  color: var(--accent-danger);
}

/* 组件内容 */
.widget-content {
  min-height: 200px;
}

/* 占位组件 */
.placeholder-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  color: var(--text-muted);
  gap: var(--space-3);
}

.placeholder-widget p {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.placeholder-widget span {
  font-size: var(--font-size-sm);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}

.empty-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: var(--accent-primary-light);
  border-radius: var(--radius-xl);
  color: var(--accent-primary);
  margin-bottom: var(--space-4);
}

.empty-state h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-state p {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

/* 删除确认 */
.remove-confirm {
  padding: var(--space-4) 0;
}

.remove-confirm p {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.clear-data-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.clear-data-option input {
  width: 16px;
  height: 16px;
}

/* 按钮 */
.btn-secondary,
.btn-danger {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-danger {
  background: rgba(229, 115, 115, 0.1);
  color: var(--accent-danger);
  border: 1px solid var(--accent-danger);
}

.btn-danger:hover {
  background: var(--accent-danger);
  color: white;
}

/* 动画 */
.widget-list-enter-active,
.widget-list-leave-active {
  transition: all 0.3s ease;
}

.widget-list-enter-from,
.widget-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .dashboard-view {
    padding: var(--space-4);
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .widget-actions {
    gap: var(--space-1);
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }
}
</style>
