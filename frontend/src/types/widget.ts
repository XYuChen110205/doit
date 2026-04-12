// 组件类型定义

// 组件类型枚举
export enum WidgetType {
  TASK_LIST = 'task_list',       // 任务列表
  NOTE_EDITOR = 'note_editor',   // 笔记编辑器
  CODE_EDITOR = 'code_editor',   // 代码编辑器
  CALENDAR = 'calendar',         // 日历
  POMODORO = 'pomodoro',         // 番茄钟
  SCHEDULE = 'schedule',         // 课程表
  COUNTDOWN = 'countdown',       // 倒计时
  STATS = 'stats',               // 统计卡片
  LINKS = 'links',               // 链接收藏
  IMAGE_GALLERY = 'image_gallery', // 图片库
  MARKDOWN = 'markdown',         // Markdown编辑器
  LINED_PAPER = 'lined_paper',   // 横线纸张编辑器
  BEAUTIFUL_EDITOR = 'beautiful_editor' // 唯美文章编辑器
}

// 背景类型
export enum BackgroundType {
  SOLID = 'solid',           // 纯色
  GRADIENT = 'gradient',     // 渐变
  IMAGE = 'image',           // 图片
  PAPER = 'paper',           // 纸张纹理
  LINED = 'lined',           // 横线纸张
  GRID = 'grid',             // 网格
  DOT = 'dot'                // 点阵
}

// 背景配置
export interface BackgroundConfig {
  type: BackgroundType
  // 纯色/渐变
  color?: string
  gradientFrom?: string
  gradientTo?: string
  // 图片
  imageUrl?: string
  // 纸张样式
  paperColor?: string
  lineColor?: string
  lineSpacing?: number
  // 通用
  opacity?: number
}

// 组件配置
export interface WidgetConfig {
  id: string                    // 唯一ID
  type: WidgetType              // 组件类型
  title: string                 // 显示标题
  icon: string                  // 图标名称
  description: string           // 描述
  defaultBackground: BackgroundConfig  // 默认背景
  allowBackgroundCustomize: boolean    // 是否允许自定义背景
  allowMultiple: boolean        // 是否允许添加多个实例
}

// 用户页面中的组件实例
export interface WidgetInstance {
  instanceId: string            // 实例唯一ID
  widgetType: WidgetType        // 组件类型
  title: string                 // 自定义标题
  background: BackgroundConfig  // 背景配置
  position: number              // 排序位置
  data: any                     // 组件数据
  isCollapsed: boolean          // 是否折叠
  createdAt: string
  updatedAt: string
}

// 用户自定义页面
export interface UserDashboard {
  id: string
  name: string                  // 页面名称
  widgets: WidgetInstance[]     // 组件列表
  createdAt: string
  updatedAt: string
}

// 组件注册表项
export interface WidgetRegistryItem extends WidgetConfig {
  component: any                // Vue组件
}
