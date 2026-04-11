// 微信笔记系统类型定义

// 编辑器类型
export enum EditorType {
  TEXT = 'text',           // 普通文本（首行缩进）
  CODE = 'code',           // 代码编辑器
  MARKDOWN = 'markdown',   // Markdown
  ENGLISH = 'english',     // 英语作文（特殊格式）
  MATH = 'math',           // 数学公式
  DRAWING = 'drawing',     // 画图/手写
  CUSTOM = 'custom'        // 自定义
}

// 编辑器配置
export interface EditorConfig {
  type: EditorType
  name: string
  icon: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize: string
  lineHeight: string
  padding: string
  borderRadius: string
  // 特殊配置
  showLineNumbers?: boolean      // 代码编辑器显示行号
  enableSyntaxHighlight?: boolean // 启用语法高亮
  enableSpellCheck?: boolean     // 启用拼写检查
  paperTexture?: boolean         // 纸张纹理
  gridLines?: boolean            // 网格线
  ruledLines?: boolean           // 横线
}

// 群聊（记录本）
export interface ChatGroup {
  id: string
  name: string
  avatar?: string
  description?: string
  members: ChatMember[]
  createdAt: string
  updatedAt: string
  userId: string
  isPinned?: boolean
  order?: number
}

// 群成员（不同编辑器类型）
export interface ChatMember {
  id: string
  groupId: string
  name: string
  editorType: EditorType
  editorConfig: EditorConfig
  avatar?: string
  isDefault?: boolean  // 默认成员，不可删除
  order?: number
  createdAt: string
}

// 聊天记录（多条记录）
export interface ChatRecord {
  id: string
  groupId: string
  memberId: string
  content: string
  title?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  isDeleted?: boolean
  deletedAt?: string
}

// 素材库
export interface MaterialLibrary {
  id: string
  name: string
  type: MaterialType
  userId: string
  createdAt: string
}

// 素材类型
export enum MaterialType {
  IMAGE = 'image',
  TEXT = 'text',
  CODE = 'code',
  LINK = 'link',
  WEBPAGE = 'webpage',
  FILE = 'file'
}

// 素材项
export interface MaterialItem {
  id: string
  libraryId: string
  type: MaterialType
  title: string
  content: string  // 文本内容、代码、链接URL等
  thumbnail?: string  // 图片缩略图
  metadata?: Record<string, any>  // 额外元数据
  tags?: string[]
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
}

// 预定义的编辑器配置
export const EDITOR_CONFIGS: Record<EditorType, EditorConfig> = {
  [EditorType.TEXT]: {
    type: EditorType.TEXT,
    name: '文本笔记',
    icon: 'Note',
    backgroundColor: '#FFFEF0',  // 米黄色纸张
    textColor: '#2C3E50',
    fontFamily: '"Noto Serif SC", "SimSun", serif',
    fontSize: '16px',
    lineHeight: '2',
    padding: '32px',
    borderRadius: '4px',
    paperTexture: true,
    ruledLines: false
  },
  [EditorType.CODE]: {
    type: EditorType.CODE,
    name: '代码编辑器',
    icon: 'Code',
    backgroundColor: '#1E1E1E',  // VS Code 深色背景
    textColor: '#D4D4D4',
    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '20px',
    borderRadius: '8px',
    showLineNumbers: true,
    enableSyntaxHighlight: true
  },
  [EditorType.MARKDOWN]: {
    type: EditorType.MARKDOWN,
    name: 'Markdown',
    icon: 'Markdown',
    backgroundColor: '#FFFFFF',
    textColor: '#333333',
    fontFamily: '"Noto Sans SC", sans-serif',
    fontSize: '16px',
    lineHeight: '1.8',
    padding: '32px',
    borderRadius: '8px'
  },
  [EditorType.ENGLISH]: {
    type: EditorType.ENGLISH,
    name: '英语作文',
    icon: 'English',
    backgroundColor: '#F8F9FA',
    textColor: '#212529',
    fontFamily: '"Times New Roman", serif',
    fontSize: '16px',
    lineHeight: '1.8',
    padding: '40px',
    borderRadius: '4px',
    ruledLines: true
  },
  [EditorType.MATH]: {
    type: EditorType.MATH,
    name: '数学公式',
    icon: 'Math',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    fontFamily: '"Latin Modern Math", "Cambria Math", serif',
    fontSize: '18px',
    lineHeight: '2',
    padding: '32px',
    borderRadius: '8px'
  },
  [EditorType.DRAWING]: {
    type: EditorType.DRAWING,
    name: '手写/画图',
    icon: 'Draw',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    fontFamily: 'sans-serif',
    fontSize: '16px',
    lineHeight: '1.5',
    padding: '0',
    borderRadius: '8px',
    gridLines: true
  },
  [EditorType.CUSTOM]: {
    type: EditorType.CUSTOM,
    name: '自定义',
    icon: 'Custom',
    backgroundColor: '#FFFFFF',
    textColor: '#333333',
    fontFamily: '"Noto Sans SC", sans-serif',
    fontSize: '16px',
    lineHeight: '1.8',
    padding: '24px',
    borderRadius: '8px'
  }
}

// 默认群成员配置
export const DEFAULT_MEMBERS: Omit<ChatMember, 'id' | 'groupId' | 'createdAt'>[] = [
  {
    name: '文本助手',
    editorType: EditorType.TEXT,
    editorConfig: EDITOR_CONFIGS[EditorType.TEXT],
    isDefault: true,
    order: 1
  },
  {
    name: '代码助手',
    editorType: EditorType.CODE,
    editorConfig: EDITOR_CONFIGS[EditorType.CODE],
    isDefault: true,
    order: 2
  },
  {
    name: 'Markdown',
    editorType: EditorType.MARKDOWN,
    editorConfig: EDITOR_CONFIGS[EditorType.MARKDOWN],
    isDefault: true,
    order: 3
  },
  {
    name: '英语作文',
    editorType: EditorType.ENGLISH,
    editorConfig: EDITOR_CONFIGS[EditorType.ENGLISH],
    isDefault: true,
    order: 4
  }
]
