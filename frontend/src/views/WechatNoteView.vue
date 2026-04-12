<template>
  <div class="wechat-note-view">
    <!-- 左侧群聊列表 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          <SvgIcon name="Note" :size="20" />
          我的记录本
        </h2>
        <button class="add-group-btn" @click="showCreateGroup = true" title="新建记录本">
          <SvgIcon name="Plus" :size="18" />
        </button>
      </div>

      <div class="group-list">
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-item"
          :class="{ active: currentGroup?.id === group.id }"
          @click="selectGroup(group)"
        >
          <div class="group-avatar">
            <SvgIcon name="Book" :size="20" />
          </div>
          <div class="group-info">
            <span class="group-name">{{ group.name }}</span>
            <span class="group-desc" v-if="group.description">{{ group.description }}</span>
          </div>
          <button class="delete-btn" @click.stop="deleteGroup(group.id)">
            <SvgIcon name="Trash" :size="14" />
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="groups.length === 0" class="empty-groups">
          <SvgIcon name="Book" :size="48" />
          <p>还没有记录本</p>
          <button class="create-btn" @click="showCreateGroup = true">
            创建一个
          </button>
        </div>
      </div>
    </div>

    <!-- 中间成员列表 -->
    <div class="member-sidebar" v-if="currentGroup">
      <div class="member-header">
        <h3>{{ currentGroup.name }}</h3>
        <button class="add-member-btn" @click="showAddMember = true" title="添加成员">
          <SvgIcon name="Plus" :size="16" />
        </button>
      </div>

      <div class="member-list">
        <div
          v-for="member in currentGroup.members"
          :key="member.id"
          class="member-item"
          :class="{ active: currentMember?.id === member.id }"
          @click="selectMember(member)"
        >
          <div class="member-avatar" :style="{ backgroundColor: member.editorConfig.backgroundColor }">
            <SvgIcon :name="member.editorConfig.icon" :size="16" />
          </div>
          <div class="member-info">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-type">{{ member.editorConfig.name }}</span>
          </div>
        </div>
      </div>

      <!-- 该成员的记录列表 -->
      <div class="record-list" v-if="currentMember">
        <div class="record-list-header">
          <span>历史记录</span>
          <button class="new-record-btn" @click="createNewRecord">
            <SvgIcon name="Plus" :size="14" />
            新建
          </button>
        </div>
        <div
          v-for="record in getMemberRecords(currentMember.id)"
          :key="record.id"
          class="record-item"
          :class="{ active: currentRecord?.id === record.id }"
          @click="selectRecord(record)"
        >
          <div class="record-title">{{ record.title || '无标题' }}</div>
          <div class="record-meta">
            <span class="record-date">{{ formatDate(record.updatedAt) }}</span>
            <button class="delete-record-btn" @click.stop="deleteRecord(record.id)">
              <SvgIcon name="Trash" :size="12" />
            </button>
          </div>
        </div>
        <div v-if="getMemberRecords(currentMember.id).length === 0" class="empty-records">
          <p>还没有记录</p>
          <button class="create-record-btn" @click="createNewRecord">
            创建第一条
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧编辑器区域 -->
    <div class="editor-area" v-if="currentMember && currentRecord">
      <div class="editor-header">
        <div class="editor-info">
          <span class="member-badge" :style="{ backgroundColor: currentMember.editorConfig.backgroundColor }">
            <SvgIcon :name="currentMember.editorConfig.icon" :size="14" />
            {{ currentMember.name }}
          </span>
          <input
            v-model="currentRecord.title"
            class="title-input"
            placeholder="输入标题..."
            @blur="saveData"
          />
        </div>
        <div class="editor-actions">
          <span class="save-status" :class="saveStatus">
            <SvgIcon v-if="saveStatus === 'saving'" name="Loading" :size="14" />
            <SvgIcon v-else-if="saveStatus === 'saved'" name="Check" :size="14" />
            {{ saveStatusText }}
          </span>
          <button class="action-btn" @click="showBackgroundPicker = true" title="更换背景">
            <SvgIcon name="Palette" :size="16" />
          </button>
        </div>
      </div>

      <!-- 编辑器容器 -->
      <div class="editor-container" :style="editorContainerStyle">
        <textarea
          v-model="editorContent"
          class="editor-textarea"
          placeholder="开始写作..."
          @input="onContentChange"
        ></textarea>
      </div>
    </div>

    <!-- 空状态 - 未选择群聊 -->
    <div v-else class="empty-editor">
      <SvgIcon name="Note" :size="64" />
      <h3>选择一个记录本开始</h3>
      <p>或者创建一个新的记录本</p>
    </div>

    <!-- 创建群聊弹窗 -->
    <BaseModal
      v-if="showCreateGroup"
      :is-open="showCreateGroup"
      title="新建记录本"
      @close="showCreateGroup = false"
    >
      <div class="form-group">
        <label>名称</label>
        <input v-model="newGroupName" placeholder="如：学习笔记、代码片段..." />
      </div>
      <div class="form-group">
        <label>描述（可选）</label>
        <input v-model="newGroupDesc" placeholder="简单描述这个记录本的用途..." />
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCreateGroup = false">取消</button>
        <button class="btn-primary" @click="createGroup" :disabled="!newGroupName.trim()">创建</button>
      </template>
    </BaseModal>

    <!-- 添加成员弹窗 -->
    <BaseModal
      v-if="showAddMember"
      :is-open="showAddMember"
      title="添加成员"
      @close="showAddMember = false"
    >
      <div class="member-type-list">
        <div
          v-for="config in availableEditorTypes"
          :key="config.type"
          class="member-type-item"
          :class="{ selected: selectedEditorType === config.type }"
          @click="selectedEditorType = config.type"
        >
          <div class="type-icon" :style="{ backgroundColor: config.backgroundColor }">
            <SvgIcon :name="config.icon" :size="20" />
          </div>
          <div class="type-info">
            <span class="type-name">{{ config.name }}</span>
            <span class="type-desc">{{ getEditorDesc(config.type) }}</span>
          </div>
        </div>
      </div>
      <div class="form-group" v-if="selectedEditorType">
        <label>成员名称</label>
        <input v-model="newMemberName" :placeholder="getDefaultMemberName(selectedEditorType)" />
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAddMember = false">取消</button>
        <button class="btn-primary" @click="addMember" :disabled="!selectedEditorType || !newMemberName.trim()">添加</button>
      </template>
    </BaseModal>

    <!-- 背景选择弹窗 -->
    <BaseModal
      v-if="showBackgroundPicker"
      :is-open="showBackgroundPicker"
      title="选择背景"
      @close="showBackgroundPicker = false"
    >
      <div class="background-options">
        <div
          v-for="bg in backgroundOptions"
          :key="bg.name"
          class="bg-option"
          :class="{ active: currentBg === bg.name }"
          @click="selectBackground(bg)"
        >
          <div class="bg-preview" :style="bg.style"></div>
          <span class="bg-name">{{ bg.label }}</span>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SvgIcon from '../components/icons/SvgIcon.vue'
import BaseModal from '../components/base/BaseModal.vue'

// 类型定义
interface EditorConfig {
  type: string
  name: string
  icon: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize: string
  lineHeight: string
  padding: string
  borderRadius: string
}

interface ChatMember {
  id: string
  name: string
  editorType: string
  editorConfig: EditorConfig
}

interface ChatRecord {
  id: string
  memberId: string
  title: string
  content: string
  updatedAt: string
}

interface ChatGroup {
  id: string
  name: string
  description: string
  members: ChatMember[]
}

// 编辑器类型配置
const EDITOR_CONFIGS: Record<string, EditorConfig> = {
  text: {
    type: 'text',
    name: '文本',
    icon: 'Document',
    backgroundColor: '#faf8f5',
    textColor: '#333',
    fontFamily: 'Georgia, serif',
    fontSize: '16px',
    lineHeight: '1.8',
    padding: '24px',
    borderRadius: '8px'
  },
  code: {
    type: 'code',
    name: '代码',
    icon: 'Code',
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    fontFamily: 'Consolas, monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '20px',
    borderRadius: '8px'
  },
  markdown: {
    type: 'markdown',
    name: 'Markdown',
    icon: 'Document',
    backgroundColor: '#ffffff',
    textColor: '#333',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '16px',
    lineHeight: '1.6',
    padding: '24px',
    borderRadius: '8px'
  },
  lined: {
    type: 'lined',
    name: '横线纸',
    icon: 'Note',
    backgroundColor: '#faf8f5',
    textColor: '#333',
    fontFamily: 'Georgia, serif',
    fontSize: '16px',
    lineHeight: '28px',
    padding: '24px',
    borderRadius: '8px'
  }
}

// 背景选项
const backgroundOptions = [
  { name: 'default', label: '默认', style: { background: '#faf8f5' } },
  { name: 'white', label: '纯白', style: { background: '#ffffff' } },
  { name: 'cream', label: '米色', style: { background: '#f5f5dc' } },
  { name: 'light-blue', label: '淡蓝', style: { background: '#e3f2fd' } },
  { name: 'light-green', label: '淡绿', style: { background: '#e8f5e9' } },
  { name: 'light-pink', label: '淡粉', style: { background: '#fce4ec' } },
  { name: 'dark', label: '深色', style: { background: '#2d2d2d' } },
  { name: 'lined', label: '横线纸', style: { 
    background: '#faf8f5',
    backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e0e0e0 27px, #e0e0e0 28px)',
    backgroundAttachment: 'local'
  }}
]

// 状态
const groups = ref<ChatGroup[]>([])
const records = ref<ChatRecord[]>([])
const currentGroup = ref<ChatGroup | null>(null)
const currentMember = ref<ChatMember | null>(null)
const currentRecord = ref<ChatRecord | null>(null)
const editorContent = ref('')
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')
const currentBg = ref('default')

// 弹窗状态
const showCreateGroup = ref(false)
const showAddMember = ref(false)
const showBackgroundPicker = ref(false)

// 表单数据
const newGroupName = ref('')
const newGroupDesc = ref('')
const selectedEditorType = ref<string | null>(null)
const newMemberName = ref('')

// 自动保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// 计算属性
const editorContainerStyle = computed(() => {
  if (!currentMember.value) return {}
  const config = currentMember.value.editorConfig
  const bg = backgroundOptions.find(b => b.name === currentBg.value)
  
  const baseStyle: Record<string, string> = {
    color: config.textColor,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    lineHeight: config.lineHeight,
    padding: config.padding,
    borderRadius: config.borderRadius,
  }
  
  // 如果是横线背景，使用横线样式
  if (currentBg.value === 'lined') {
    return {
      ...baseStyle,
      backgroundColor: '#faf8f5',
      backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e0e0e0 27px, #e0e0e0 28px)',
      backgroundAttachment: 'local',
      minHeight: '400px'
    }
  }
  
  return {
    ...baseStyle,
    backgroundColor: bg?.style?.background || config.backgroundColor,
    minHeight: '400px'
  }
})

const saveStatusText = computed(() => {
  if (saveStatus.value === 'saving') return '保存中...'
  if (saveStatus.value === 'saved') return '已保存'
  return ''
})

const availableEditorTypes = computed(() => {
  return Object.values(EDITOR_CONFIGS)
})

// 方法
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function loadData() {
  const savedGroups = localStorage.getItem('chatGroups')
  const savedRecords = localStorage.getItem('chatRecords')
  
  if (savedGroups) {
    groups.value = JSON.parse(savedGroups)
  }
  if (savedRecords) {
    records.value = JSON.parse(savedRecords)
  }
}

function saveData() {
  localStorage.setItem('chatGroups', JSON.stringify(groups.value))
  localStorage.setItem('chatRecords', JSON.stringify(records.value))
  saveStatus.value = 'saved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveStatus.value = 'idle'
  }, 2000)
}

function getMemberRecords(memberId: string): ChatRecord[] {
  return records.value
    .filter(r => r.memberId === memberId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function selectGroup(group: ChatGroup) {
  currentGroup.value = group
  currentMember.value = null
  currentRecord.value = null
  editorContent.value = ''
}

function selectMember(member: ChatMember) {
  currentMember.value = member
  currentRecord.value = null
  editorContent.value = ''
  
  // 加载该成员的记录
  const memberRecords = getMemberRecords(member.id)
  
  // 如果有记录，默认选中第一条
  if (memberRecords.length > 0) {
    selectRecord(memberRecords[0])
  } else {
    // 没有记录则创建新记录
    createNewRecord()
  }
}

function selectRecord(record: ChatRecord) {
  currentRecord.value = record
  editorContent.value = record.content
  saveStatus.value = 'idle'
}

function createNewRecord() {
  if (!currentGroup.value || !currentMember.value) return
  
  const newRecord: ChatRecord = {
    id: generateId(),
    memberId: currentMember.value.id,
    title: '',
    content: '',
    updatedAt: new Date().toISOString()
  }
  
  records.value.push(newRecord)
  saveData()
  selectRecord(newRecord)
}

function createGroup() {
  if (!newGroupName.value.trim()) return
  
  const newGroup: ChatGroup = {
    id: generateId(),
    name: newGroupName.value.trim(),
    description: newGroupDesc.value.trim(),
    members: []
  }
  
  groups.value.push(newGroup)
  saveData()
  selectGroup(newGroup)
  
  showCreateGroup.value = false
  newGroupName.value = ''
  newGroupDesc.value = ''
}

function addMember() {
  if (!currentGroup.value || !selectedEditorType.value || !newMemberName.value.trim()) return
  
  const config = EDITOR_CONFIGS[selectedEditorType.value]
  const newMember: ChatMember = {
    id: generateId(),
    name: newMemberName.value.trim(),
    editorType: selectedEditorType.value,
    editorConfig: { ...config }
  }
  
  currentGroup.value.members.push(newMember)
  saveData()
  selectMember(newMember)
  
  showAddMember.value = false
  selectedEditorType.value = null
  newMemberName.value = ''
}

function deleteGroup(id: string) {
  groups.value = groups.value.filter(g => g.id !== id)
  if (currentGroup.value?.id === id) {
    currentGroup.value = null
    currentMember.value = null
    currentRecord.value = null
  }
  saveData()
}

function deleteRecord(id: string) {
  records.value = records.value.filter(r => r.id !== id)
  if (currentRecord.value?.id === id) {
    createNewRecord()
  }
  saveData()
}

function onContentChange() {
  saveStatus.value = 'idle'
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (currentRecord.value) {
      currentRecord.value.content = editorContent.value
      currentRecord.value.updatedAt = new Date().toISOString()
      saveData()
    }
  }, 1000)
}

function selectBackground(bg: typeof backgroundOptions[0]) {
  currentBg.value = bg.name
  showBackgroundPicker.value = false
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

function getEditorDesc(type: string): string {
  const descs: Record<string, string> = {
    text: '首行缩进的文本编辑器，适合写日记、文章',
    code: '代码编辑器，支持语法高亮和行号',
    markdown: 'Markdown编辑器，支持预览',
    lined: '横线纸张，适合手写记录'
  }
  return descs[type] || '文本编辑器'
}

function getDefaultMemberName(type: string): string {
  const names: Record<string, string> = {
    text: '我的日记',
    code: '代码片段',
    markdown: 'Markdown笔记',
    lined: '横线笔记'
  }
  return names[type] || '笔记'
}

onMounted(() => {
  loadData()
})

// 监听记录变化，更新内容
watch(() => currentRecord.value?.id, (newId) => {
  if (newId && currentRecord.value) {
    editorContent.value = currentRecord.value.content
  }
})
</script>

<style scoped>
.wechat-note-view {
  display: flex;
  height: calc(100vh - 72px);
  background: var(--bg-primary);
}

/* 左侧群聊列表 */
.sidebar {
  width: 260px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.add-group-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-group-btn:hover {
  background: var(--accent-primary-hover);
}

.group-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.group-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
}

.group-item:hover {
  background: var(--bg-hover);
}

.group-item.active {
  background: var(--accent-primary-light);
}

.group-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.group-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.group-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.group-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--accent-danger);
}

.empty-groups {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-muted);
}

.create-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.create-btn:hover {
  background: var(--accent-primary-hover);
}

/* 中间成员列表 */
.member-sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.member-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.add-member-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-member-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.member-list {
  padding: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.member-item:hover {
  background: var(--bg-hover);
}

.member-item.active {
  background: var(--accent-primary-light);
}

.member-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: white;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.member-type {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* 记录列表 */
.record-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.record-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
}

.record-list-header span {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  text-transform: uppercase;
}

.new-record-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: var(--transition-normal);
}

.new-record-btn:hover {
  background: var(--accent-primary-hover);
}

.record-item {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  margin-bottom: var(--space-2);
}

.record-item:hover {
  background: var(--bg-hover);
}

.record-item.active {
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.record-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-1);
}

.record-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-date {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.delete-record-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.record-item:hover .delete-record-btn {
  opacity: 1;
}

.delete-record-btn:hover {
  color: var(--accent-danger);
}

.empty-records {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6);
  color: var(--text-muted);
}

.empty-records p {
  font-size: var(--font-size-sm);
}

.create-record-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.create-record-btn:hover {
  background: var(--accent-primary-hover);
}

/* 右侧编辑器区域 */
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.editor-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.member-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
}

.title-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: var(--transition-normal);
}

.title-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.save-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.save-status.saving {
  color: var(--text-secondary);
}

.save-status.saved {
  color: var(--accent-success);
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.editor-container {
  flex: 1;
  overflow: auto;
  padding: var(--space-4);
}

.editor-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

.empty-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--text-muted);
}

.empty-editor h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

/* 弹窗样式 */
.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: var(--transition-normal);
}

.form-group input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.member-type-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  max-height: 300px;
  overflow-y: auto;
}

.member-type-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.member-type-item:hover {
  border-color: var(--accent-primary);
  background: var(--bg-hover);
}

.member-type-item.selected {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.type-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: white;
}

.type-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.type-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.type-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.btn-secondary,
.btn-primary {
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

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 背景选择 */
.background-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.bg-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.bg-option:hover {
  border-color: var(--accent-primary);
}

.bg-option.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.bg-preview {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.bg-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }
  
  .member-sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .wechat-note-view {
    flex-direction: column;
    height: auto;
  }
  
  .sidebar,
  .member-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  
  .editor-area {
    min-height: 400px;
  }
  
  .background-options {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
