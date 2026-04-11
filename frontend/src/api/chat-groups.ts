import type { ChatGroup, ChatMember, ChatRecord } from '../types/wechat-note'
import { DEFAULT_MEMBERS } from '../types/wechat-note'

const STORAGE_KEY = 'wechat_note_groups'
const RECORDS_KEY = 'wechat_note_records'

// 获取当前用户ID
function getCurrentUserId(): string {
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.id || 'local-user'
  }
  return 'local-user'
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取所有群聊
export async function listChatGroups(): Promise<ChatGroup[]> {
  const data = localStorage.getItem(STORAGE_KEY)
  const userId = getCurrentUserId()
  if (!data) return []
  const groups = JSON.parse(data) as ChatGroup[]
  return groups.filter(g => g.userId === userId).sort((a, b) => (a.order || 0) - (b.order || 0))
}

// 创建群聊
export async function createChatGroup(name: string, description?: string): Promise<ChatGroup> {
  const groups = await listChatGroups()
  const userId = getCurrentUserId()
  
  const newGroup: ChatGroup = {
    id: generateId(),
    name,
    description,
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId,
    isPinned: false,
    order: groups.length
  }
  
  // 添加默认成员
  newGroup.members = DEFAULT_MEMBERS.map((member, index) => ({
    ...member,
    id: generateId(),
    groupId: newGroup.id,
    createdAt: new Date().toISOString()
  }))
  
  groups.push(newGroup)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  
  return newGroup
}

// 更新群聊
export async function updateChatGroup(id: string, updates: Partial<ChatGroup>): Promise<ChatGroup> {
  const groups = await listChatGroups()
  const index = groups.findIndex(g => g.id === id)
  if (index === -1) throw new Error('群聊不存在')
  
  groups[index] = { ...groups[index], ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  
  return groups[index]
}

// 删除群聊
export async function deleteChatGroup(id: string): Promise<void> {
  const groups = await listChatGroups()
  const filtered = groups.filter(g => g.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  
  // 同时删除该群聊的所有记录
  const records = await listChatRecords()
  const filteredRecords = records.filter(r => r.groupId !== id)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(filteredRecords))
}

// 添加群成员
export async function addChatMember(groupId: string, member: Omit<ChatMember, 'id' | 'groupId' | 'createdAt'>): Promise<ChatMember> {
  const groups = await listChatGroups()
  const group = groups.find(g => g.id === groupId)
  if (!group) throw new Error('群聊不存在')
  
  const newMember: ChatMember = {
    ...member,
    id: generateId(),
    groupId,
    createdAt: new Date().toISOString()
  }
  
  group.members.push(newMember)
  group.updatedAt = new Date().toISOString()
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  
  return newMember
}

// 更新群成员
export async function updateChatMember(groupId: string, memberId: string, updates: Partial<ChatMember>): Promise<ChatMember> {
  const groups = await listChatGroups()
  const group = groups.find(g => g.id === groupId)
  if (!group) throw new Error('群聊不存在')
  
  const memberIndex = group.members.findIndex(m => m.id === memberId)
  if (memberIndex === -1) throw new Error('成员不存在')
  
  group.members[memberIndex] = { ...group.members[memberIndex], ...updates }
  group.updatedAt = new Date().toISOString()
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  
  return group.members[memberIndex]
}

// 删除群成员
export async function deleteChatMember(groupId: string, memberId: string): Promise<void> {
  const groups = await listChatGroups()
  const group = groups.find(g => g.id === groupId)
  if (!group) throw new Error('群聊不存在')
  
  group.members = group.members.filter(m => m.id !== memberId)
  group.updatedAt = new Date().toISOString()
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

// 获取所有记录
export async function listChatRecords(): Promise<ChatRecord[]> {
  const data = localStorage.getItem(RECORDS_KEY)
  if (!data) return []
  return JSON.parse(data) as ChatRecord[]
}

// 获取指定群聊的记录
export async function getChatRecordsByGroup(groupId: string): Promise<ChatRecord[]> {
  const records = await listChatRecords()
  return records
    .filter(r => r.groupId === groupId && !r.isDeleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 获取指定成员的记录
export async function getChatRecordsByMember(memberId: string): Promise<ChatRecord[]> {
  const records = await listChatRecords()
  return records
    .filter(r => r.memberId === memberId && !r.isDeleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 创建记录
export async function createChatRecord(record: Omit<ChatRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatRecord> {
  const records = await listChatRecords()
  
  const newRecord: ChatRecord = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  records.push(newRecord)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  
  return newRecord
}

// 更新记录
export async function updateChatRecord(id: string, updates: Partial<ChatRecord>): Promise<ChatRecord> {
  const records = await listChatRecords()
  const index = records.findIndex(r => r.id === id)
  if (index === -1) throw new Error('记录不存在')
  
  records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  
  return records[index]
}

// 删除记录（软删除）
export async function deleteChatRecord(id: string): Promise<void> {
  const records = await listChatRecords()
  const index = records.findIndex(r => r.id === id)
  if (index === -1) throw new Error('记录不存在')
  
  records[index] = {
    ...records[index],
    isDeleted: true,
    deletedAt: new Date().toISOString()
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

// 恢复删除的记录
export async function restoreChatRecord(id: string): Promise<void> {
  const records = await listChatRecords()
  const index = records.findIndex(r => r.id === id)
  if (index === -1) throw new Error('记录不存在')
  
  records[index] = {
    ...records[index],
    isDeleted: false,
    deletedAt: undefined
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}
