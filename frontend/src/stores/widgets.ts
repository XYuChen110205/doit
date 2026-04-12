import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  WidgetType,
  WidgetConfig,
  WidgetInstance,
  UserDashboard,
  BackgroundConfig
} from '../types/widget'

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useWidgetStore = defineStore('widgets', () => {
  // ========== State ==========
  const currentDashboard = ref<UserDashboard | null>(null)
  const isComponentLibraryOpen = ref(false)
  const editingWidget = ref<WidgetInstance | null>(null)

  // ========== Getters ==========
  const widgets = computed(() => currentDashboard.value?.widgets || [])
  
  const sortedWidgets = computed(() => {
    return [...widgets.value].sort((a, b) => a.position - b.position)
  })

  // ========== Actions ==========
  
  // 初始化仪表板
  function initDashboard() {
    const saved = localStorage.getItem('userDashboard')
    if (saved) {
      currentDashboard.value = JSON.parse(saved)
    } else {
      // 创建默认仪表板
      currentDashboard.value = {
        id: generateId(),
        name: '我的页面',
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      saveDashboard()
    }
  }

  // 保存仪表板
  function saveDashboard() {
    if (currentDashboard.value) {
      currentDashboard.value.updatedAt = new Date().toISOString()
      localStorage.setItem('userDashboard', JSON.stringify(currentDashboard.value))
    }
  }

  // 添加组件
  function addWidget(
    widgetType: WidgetType,
    config: WidgetConfig,
    title?: string,
    customBackground?: BackgroundConfig
  ) {
    if (!currentDashboard.value) return

    const instance: WidgetInstance = {
      instanceId: generateId(),
      widgetType,
      title: title || config.title,
      background: customBackground || { ...config.defaultBackground },
      position: currentDashboard.value.widgets.length,
      data: null,
      isCollapsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    currentDashboard.value.widgets.push(instance)
    saveDashboard()
    return instance
  }

  // 移除组件
  function removeWidget(instanceId: string, clearData: boolean = false) {
    if (!currentDashboard.value) return

    const index = currentDashboard.value.widgets.findIndex(w => w.instanceId === instanceId)
    if (index > -1) {
      currentDashboard.value.widgets.splice(index, 1)
      // 重新排序
      currentDashboard.value.widgets.forEach((w, i) => {
        w.position = i
      })
      saveDashboard()
    }
  }

  // 更新组件数据
  function updateWidgetData(instanceId: string, data: any) {
    if (!currentDashboard.value) return

    const widget = currentDashboard.value.widgets.find(w => w.instanceId === instanceId)
    if (widget) {
      widget.data = data
      widget.updatedAt = new Date().toISOString()
      saveDashboard()
    }
  }

  // 更新组件背景
  function updateWidgetBackground(instanceId: string, background: BackgroundConfig) {
    if (!currentDashboard.value) return

    const widget = currentDashboard.value.widgets.find(w => w.instanceId === instanceId)
    if (widget) {
      widget.background = background
      widget.updatedAt = new Date().toISOString()
      saveDashboard()
    }
  }

  // 更新组件标题
  function updateWidgetTitle(instanceId: string, title: string) {
    if (!currentDashboard.value) return

    const widget = currentDashboard.value.widgets.find(w => w.instanceId === instanceId)
    if (widget) {
      widget.title = title
      widget.updatedAt = new Date().toISOString()
      saveDashboard()
    }
  }

  // 切换折叠状态
  function toggleWidgetCollapse(instanceId: string) {
    if (!currentDashboard.value) return

    const widget = currentDashboard.value.widgets.find(w => w.instanceId === instanceId)
    if (widget) {
      widget.isCollapsed = !widget.isCollapsed
      saveDashboard()
    }
  }

  // 移动组件位置
  function moveWidget(instanceId: string, direction: 'up' | 'down') {
    if (!currentDashboard.value) return

    const widgets = currentDashboard.value.widgets
    const index = widgets.findIndex(w => w.instanceId === instanceId)
    if (index === -1) return

    if (direction === 'up' && index > 0) {
      // 上移
      const temp = widgets[index].position
      widgets[index].position = widgets[index - 1].position
      widgets[index - 1].position = temp
    } else if (direction === 'down' && index < widgets.length - 1) {
      // 下移
      const temp = widgets[index].position
      widgets[index].position = widgets[index + 1].position
      widgets[index + 1].position = temp
    }
    
    saveDashboard()
  }

  // 打开组件库
  function openComponentLibrary() {
    isComponentLibraryOpen.value = true
  }

  // 关闭组件库
  function closeComponentLibrary() {
    isComponentLibraryOpen.value = false
  }

  // 设置编辑中的组件
  function setEditingWidget(widget: WidgetInstance | null) {
    editingWidget.value = widget
  }

  return {
    // State
    currentDashboard,
    isComponentLibraryOpen,
    editingWidget,
    // Getters
    widgets,
    sortedWidgets,
    // Actions
    initDashboard,
    saveDashboard,
    addWidget,
    removeWidget,
    updateWidgetData,
    updateWidgetBackground,
    updateWidgetTitle,
    toggleWidgetCollapse,
    moveWidget,
    openComponentLibrary,
    closeComponentLibrary,
    setEditingWidget
  }
})
