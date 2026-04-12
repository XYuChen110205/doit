import { WidgetType, BackgroundType, type WidgetConfig } from '../../types/widget'

// 组件配置注册表
export const widgetRegistry: WidgetConfig[] = [
  {
    id: 'lined_paper_editor',
    type: WidgetType.LINED_PAPER,
    title: '横线笔记本',
    icon: 'Note',
    description: '带横线的纸张编辑器，适合写作和记录',
    defaultBackground: {
      type: BackgroundType.LINED,
      paperColor: '#faf8f5',
      lineColor: '#e8e8e8',
      lineSpacing: 28
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  },
  {
    id: 'task_list',
    type: WidgetType.TASK_LIST,
    title: '任务列表',
    icon: 'Task',
    description: '管理你的待办事项',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#ffffff'
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  },
  {
    id: 'note_editor',
    type: WidgetType.NOTE_EDITOR,
    title: '便签',
    icon: 'Document',
    description: '简单的文本便签',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#fef3c7'
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  },
  {
    id: 'code_editor',
    type: WidgetType.CODE_EDITOR,
    title: '代码片段',
    icon: 'Code',
    description: '记录和编辑代码',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#1e1e1e'
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  },
  {
    id: 'pomodoro',
    type: WidgetType.POMODORO,
    title: '番茄钟',
    icon: 'Clock',
    description: '专注计时器',
    defaultBackground: {
      type: BackgroundType.GRADIENT,
      gradientFrom: '#667eea',
      gradientTo: '#764ba2'
    },
    allowBackgroundCustomize: true,
    allowMultiple: false
  },
  {
    id: 'countdown',
    type: WidgetType.COUNTDOWN,
    title: '倒计时',
    icon: 'Timer',
    description: '重要日期倒计时',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#ffffff'
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  },
  {
    id: 'schedule',
    type: WidgetType.SCHEDULE,
    title: '课程表',
    icon: 'Calendar',
    description: '每周课程安排',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#ffffff'
    },
    allowBackgroundCustomize: true,
    allowMultiple: false
  },
  {
    id: 'links',
    type: WidgetType.LINKS,
    title: '链接收藏',
    icon: 'Link',
    description: '收藏常用链接',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#ffffff'
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  },
  {
    id: 'stats',
    type: WidgetType.STATS,
    title: '统计卡片',
    icon: 'Chart',
    description: '任务完成统计',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#ffffff'
    },
    allowBackgroundCustomize: true,
    allowMultiple: false
  },
  {
    id: 'markdown',
    type: WidgetType.MARKDOWN,
    title: 'Markdown',
    icon: 'Document',
    description: 'Markdown编辑器',
    defaultBackground: {
      type: BackgroundType.SOLID,
      color: '#ffffff'
    },
    allowBackgroundCustomize: true,
    allowMultiple: true
  }
]

// 根据类型获取组件配置
export function getWidgetConfig(type: WidgetType): WidgetConfig | undefined {
  return widgetRegistry.find(w => w.type === type)
}

// 获取所有可添加的组件
export function getAvailableWidgets(): WidgetConfig[] {
  return widgetRegistry
}
