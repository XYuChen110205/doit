<template>
  <div class="wechat-note-view">
    <!-- 左侧群聊列表 -->
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
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
          :class="{ active: currentGroup?.id === group.id, pinned: group.isPinned }"
          @click="selectGroup(group)"
        >
          <div class="group-avatar">
            <SvgIcon name="Book" :size="20" />
          </div>
          <div class="group-info">
            <span class="group-name">{{ group.name }}</span>
            <span class="group-desc" v-if="group.description">{{ group.description }}</span>
          </div>
          <div class="group-actions" @click.stop>
            <button 
              class="action-btn pin" 
              :class="{ pinned: group.isPinned }"
              @click="togglePin(group)"
              title="置顶"
            >
              <SvgIcon name="Pin" :size="14" />
            </button>
            <button class="action-btn delete" @click="confirmDeleteGroup(group)" title="删除">
              <SvgIcon name="Trash" :size="14" />
            </button>
          </div>
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

      <!-- 素材库入口 -->
      <div class="material-library-entry" @click="showMaterialLibrary = true">
        <SvgIcon name="Folder" :size="18" />
        <span>素材库</span>
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
          v-for="record in memberRecords"
          :key="record.id"
          class="record-item"
          :class="{ active: currentRecord?.id === record.id }"
          @click="selectRecord(record)"
        >
          <div class="record-title">{{ record.title || '无标题' }}</div>
          <div class="record-meta">
            <span class="record-date">{{ formatDate(record.updatedAt) }}</span>
            <button class="delete-record-btn" @click.stop="confirmDeleteRecord(record)" title="删除">
              <SvgIcon name="Trash" :size="12" />
            </button>
          </div>
        </div>
        <div v-if="memberRecords.length === 0" class="empty-records">
          <p>还没有记录</p>
          <button class="create-record-btn" @click="createNewRecord">
            创建第一条
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧编辑器区域 -->
    <div class="editor-area" v-if="currentMember">
      <div class="editor-header">
        <div class="editor-info">
          <span class="member-badge" :style="{ backgroundColor: currentMember.editorConfig.backgroundColor }">
            <SvgIcon :name="currentMember.editorConfig.icon" :size="14" />
            {{ currentMember.name }}
          </span>
          <input
            v-if="currentRecord"
            v-model="currentRecord.title"
            class="title-input"
            placeholder="输入标题..."
            @blur="saveRecord"
          />
        </div>
        <div class="editor-actions">
          <span class="save-status" :class="saveStatus">
            <SvgIcon v-if="saveStatus === 'saving'" name="Loading" :size="14" />
            <SvgIcon v-else-if="saveStatus === 'saved'" name="Check" :size="14" />
            {{ saveStatusText }}
          </span>
          <button class="action-btn" @click="showMemberSettings = true" title="编辑器设置">
            <SvgIcon name="Settings" :size="16" />
          </button>
        </div>
      </div>

      <!-- 编辑器容器 -->
      <div 
        class="editor-container"
        :style="editorContainerStyle"
      >
        <!-- 代码编辑器 -->
        <CodeEditor
          v-if="currentMember.editorType === 'code'"
          v-model="editorContent"
          :config="currentMember.editorConfig"
          @change="onContentChange"
        />
        
        <!-- Markdown编辑器 -->
        <MarkdownEditor
          v-else-if="currentMember.editorType === 'markdown'"
          v-model="editorContent"
          :config="currentMember.editorConfig"
          @change="onContentChange"
        />
        
        <!-- 普通文本编辑器 -->
        <TextEditor
          v-else
          v-model="editorContent"
          :config="currentMember.editorConfig"
          @change="onContentChange"
        />
      </div>
    </div>

    <!-- 空状态 - 未选择群聊 -->
    <div v-else class="empty-editor">
      <SvgIcon name="Note" :size="64" />
      <h3>选择一个记录本开始</h3>
      <p>或者创建一个新的记录本</p>
    </div>

    <!-- 创建群聊弹窗 -->
    <BaseModal v-model="showCreateGroup" title="新建记录本">
      <div class="form-group">
        <label>名称</label>
        <input v-model="newGroupName" placeholder="如：学习笔记、代码片段..." />
      </div>
      <div class="form-group">
        <label>描述（可选）</label>
        <input v-model="newGroupDesc" placeholder="简单描述这个记录本的用途..." />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showCreateGroup = false">取消</BaseButton>
        <BaseButton @click="createGroup" :disabled="!newGroupName.trim()">创建</BaseButton>
      </template>
    </BaseModal>

    <!-- 添加成员弹窗 -->
    <BaseModal v-model="showAddMember" title="添加成员">
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
        <BaseButton variant="secondary" @click="showAddMember = false">取消</BaseButton>
        <BaseButton @click="addMember" :disabled="!selectedEditorType || !newMemberName.trim()">添加</BaseButton>
      </template>
    </BaseModal>

    <!-- 删除确认弹窗 -->
    <BaseModal v-model="showDeleteConfirm" :title="deleteConfirmTitle">
      <p>{{ deleteConfirmMessage }}</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteConfirm = false">取消</BaseButton>
        <BaseButton variant="danger" @click="executeDelete">删除</BaseButton>
      </template>
    </BaseModal>

    <!-- 素材库弹窗 -->
    <MaterialLibraryModal
      v-model="showMaterialLibrary"
      @select="insertMaterial"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { ChatGroup, ChatMember, ChatRecord, EditorConfig } from '../types/wechat-note'
import { EditorType, EDITOR_CONFIGS, DEFAULT_MEMBERS } from '../types/wechat-note'
import {
  listChatGroups,
  createChatGroup,
  updateChatGroup,
  deleteChatGroup,
  addChatMember,
  getChatRecordsByMember,
  createChatRecord,
  updateChatRecord,
  deleteChatRecord
} from '../api/chat-groups'
import SvgIcon from '../components/icons/SvgIcon.vue'
import BaseModal from '../components/base/BaseModal.vue'
import BaseButton from '../components/base/BaseButton.vue'
import CodeEditor from '../components/editors/CodeEditor.vue'
import MarkdownEditor from '../components/editors/MarkdownEditor.vue'
import TextEditor from '../components/editors/TextEditor.vue'
import MaterialLibraryModal from '../components/MaterialLibraryModal.vue'

// 状态
const groups = ref<ChatGroup[]>([])
const currentGroup = ref<ChatGroup | null>(null)
const currentMember = ref<ChatMember | null>(null)
const currentRecord = ref<ChatRecord | null>(null)
const memberRecords = ref<ChatRecord[]>([])
const editorContent = ref('')
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')
const isSidebarCollapsed = ref(false)

// 弹窗状态
const showCreateGroup = ref(false)
const showAddMember = ref(false)
const showDeleteConfirm = ref(false)
const showMaterialLibrary = ref(false)
const showMemberSettings = ref(false)

// 表单数据
const newGroupName = ref('')
const newGroupDesc = ref('')
const selectedEditorType = ref<EditorType | null>(null)
const newMemberName = ref('')

// 删除相关
const deleteTarget = ref<{ type: 'group' | 'record', data: any } | null>(null)

// 自动保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// 计算属性
const editorContainerStyle = computed(() => {
  if (!currentMember.value) return {}
  const config = currentMember.value.editorConfig
  return {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    lineHeight: config.lineHeight,
    padding: config.padding,
    borderRadius: config.borderRadius
  }
})

const saveStatusText = computed(() => {
  if (saveStatus.value === 'saving') return '保存中...'
  if (saveStatus.value === 'saved') return '已保存'
  return '自动保存'
})

const availableEditorTypes = computed(() => {
  return Object.values(EDITOR_CONFIGS)
})

const deleteConfirmTitle = computed(() => {
  if (!deleteTarget.value) return ''
  return deleteTarget.value.type === 'group' ? '删除记录本' : '删除记录'
})

const deleteConfirmMessage = computed(() => {
  if (!deleteTarget.value) return ''
  if (deleteTarget.value.type === 'group') {
    return `确定要删除 "${deleteTarget.value.data.name}" 吗？其中的所有记录都将被删除。`
  }
  return '确定要删除这条记录吗？删除后无法恢复。'
})

// 方法
async function loadGroups() {
  groups.value = await listChatGroups()
}

function selectGroup(group: ChatGroup) {
  currentGroup.value = group
  currentMember.value = null
  currentRecord.value = null
  memberRecords.value = []
  editorContent.value = ''
}

async function selectMember(member: ChatMember) {
  currentMember.value = member
  currentRecord.value = null
  editorContent.value = ''
  
  // 加载该成员的记录
  memberRecords.value = await getChatRecordsByMember(member.id)
  
  // 如果有记录，默认选中第一条
  if (memberRecords.value.length > 0) {
    selectRecord(memberRecords.value[0])
  } else {
    // 没有记录则创建新记录
    createNewRecord()
  }
}

async function selectRecord(record: ChatRecord) {
  currentRecord.value = record
  editorContent.value = record.content
  saveStatus.value = 'idle'
}

async function createNewRecord() {
  if (!currentGroup.value || !currentMember.value) return
  
  const record = await createChatRecord({
    groupId: currentGroup.value.id,
    memberId: currentMember.value.id,
    content: '',
    title: '',
    tags: []
  })
  
  memberRecords.value.unshift(record)
  selectRecord(record)
}

async function createGroup() {
  if (!newGroupName.value.trim()) return
  
  const group = await createChatGroup(newGroupName.value.trim(), newGroupDesc.value.trim())
  groups.value.push(group)
  selectGroup(group)
  
  showCreateGroup.value = false
  newGroupName.value = ''
  newGroupDesc.value = ''
}

async function addMember() {
  if (!currentGroup.value || !selectedEditorType.value || !newMemberName.value.trim()) return
  
  const config = EDITOR_CONFIGS[selectedEditorType.value]
  const member = await addChatMember(currentGroup.value.id, {
    name: newMemberName.value.trim(),
    editorType: selectedEditorType.value,
    editorConfig: config,
    isDefault: false,
    order: currentGroup.value.members.length + 1
  })
  
  currentGroup.value.members.push(member)
  selectMember(member)
  
  showAddMember.value = false
  selectedEditorType.value = null
  newMemberName.value = ''
}

async function togglePin(group: ChatGroup) {
  await updateChatGroup(group.id, { isPinned: !group.isPinned })
  group.isPinned = !group.isPinned
  // 重新排序
  groups.value.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return (a.order || 0) - (b.order || 0)
  })
}

function confirmDeleteGroup(group: ChatGroup) {
  deleteTarget.value = { type: 'group', data: group }
  showDeleteConfirm.value = true
}

function confirmDeleteRecord(record: ChatRecord) {
  deleteTarget.value = { type: 'record', data: record }
  showDeleteConfirm.value = true
}

async function executeDelete() {
  if (!deleteTarget.value) return
  
  if (deleteTarget.value.type === 'group') {
    await deleteChatGroup(deleteTarget.value.data.id)
    groups.value = groups.value.filter(g => g.id !== deleteTarget.value.data.id)
    if (currentGroup.value?.id === deleteTarget.value.data.id) {
      currentGroup.value = null
      currentMember.value = null
      currentRecord.value = null
    }
  } else {
    await deleteChatRecord(deleteTarget.value.data.id)
    memberRecords.value = memberRecords.value.filter(r => r.id !== deleteTarget.value.data.id)
    if (currentRecord.value?.id === deleteTarget.value.data.id) {
      createNewRecord()
    }
  }
  
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

function onContentChange() {
  saveStatus.value = 'idle'
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    saveRecord()
  }, 1500)
}

async function saveRecord() {
  if (!currentRecord.value) return
  
  saveStatus.value = 'saving'
  
  await updateChatRecord(currentRecord.value.id, {
    content: editorContent.value,
    title: currentRecord.value.title
  })
  
  saveStatus.value = 'saved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveStatus.value = 'idle'
  }, 2000)
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

function getEditorDesc(type: EditorType): string {
  const descs: Record<EditorType, string> = {
    [EditorType.TEXT]: '首行缩进的文本编辑器，适合写日记、文章',
    [EditorType.CODE]: '代码编辑器，支持语法高亮和行号',
    [EditorType.MARKDOWN]: 'Markdown编辑器，支持预览',
    [EditorType.ENGLISH]: '英语作文格式，带横线',
    [EditorType.MATH]: '数学公式编辑器',
    [EditorType.DRAWING]: '手写/画图板',
    [EditorType.CUSTOM]: '自定义配置编辑器'
  }
  return descs[type]
}

function getDefaultMemberName(type: EditorType): string {
  const names: Record<EditorType, string> = {
    [EditorType.TEXT]: '我的日记',
    [EditorType.CODE]: '代码片段',
    [EditorType.MARKDOWN]: 'Markdown笔记',
    [EditorType.ENGLISH]: '英语作文',
    [EditorType.MATH]: '数学笔记',
    [EditorType.DRAWING]: '手绘板',
    [EditorType.CUSTOM]: '自定义笔记'
  }
  return names[type]
}

function insertMaterial(material: any) {
  // 根据素材类型插入内容
  if (material.type === 'text' || material.type === 'code') {
    editorContent.value += '\n' + material.content + '\n'
  } else if (material.type === 'link') {
    editorContent.value += `\n[${material.title}](${material.content})\n`
  }
  onContentChange()
}

onMounted(() => {
  loadGroups()
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

.group-item.pinned::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
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

.group-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: var(--transition-normal);
}

.group-item:hover .group-actions {
  opacity: 1;
}

.action-btn {
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
  transition: var(--transition-normal);
}

.action-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.action-btn.pin.pinned {
  color: var(--accent-primary);
}

.action-btn.delete:hover {
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

.material-library-entry {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.material-library-entry:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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

.editor-container {
  flex: 1;
  overflow: auto;
  padding: var(--space-4);
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
</style>
