<template>
  <div class="countdown-widget">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="countdown-preview" @click="openDetail">
      <div class="preview-header">
        <SvgIcon name="Timer" :size="20" />
        <span>倒计时</span>
      </div>
      <div v-if="nearestEvent" class="countdown-display">
        <div class="event-name">{{ nearestEvent.name }}</div>
        <div class="days-left">
          <span class="days">{{ daysUntil(nearestEvent.date) }}</span>
          <span class="label">天</span>
        </div>
        <div class="event-date">{{ formatDate(nearestEvent.date) }}</div>
      </div>
      <div v-else class="no-events">
        <p>暂无倒计时</p>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="countdown-detail">
      <div class="detail-header">
        <button class="back-btn" @click="closeDetail">
          <SvgIcon name="ChevronLeft" :size="20" />
          返回
        </button>
        <h2>倒计时</h2>
        <button class="add-btn" @click="showAddEvent = true">
          <SvgIcon name="Plus" :size="18" />
          添加
        </button>
      </div>

      <div class="events-list">
        <div
          v-for="(event, index) in sortedEvents"
          :key="index"
          class="event-card"
          :class="{ 'is-past': isPast(event.date) }"
        >
          <div class="event-info">
            <h4 class="event-title">{{ event.name }}</h4>
            <p class="event-date-full">{{ formatDate(event.date) }}</p>
          </div>
          <div class="countdown-info">
            <div v-if="!isPast(event.date)" class="countdown-days">
              <span class="days-number">{{ daysUntil(event.date) }}</span>
              <span class="days-text">天</span>
            </div>
            <div v-else class="past-badge">已过期</div>
          </div>
          <button class="delete-event" @click="deleteEvent(index)">
            <SvgIcon name="Trash" :size="16" />
          </button>
        </div>

        <div v-if="events.length === 0" class="empty-events">
          <SvgIcon name="Timer" :size="48" />
          <p>还没有倒计时事件</p>
          <button class="add-event-btn" @click="showAddEvent = true">
            添加第一个倒计时
          </button>
        </div>
      </div>
    </div>

    <!-- 添加事件弹窗 -->
    <BaseModal
      v-if="showAddEvent"
      :is-open="showAddEvent"
      title="添加倒计时"
      @close="showAddEvent = false"
    >
      <div class="form-group">
        <label>事件名称</label>
        <input v-model="newEvent.name" placeholder="如：期末考试、生日..." />
      </div>
      <div class="form-group">
        <label>目标日期</label>
        <input v-model="newEvent.date" type="date" />
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAddEvent = false">取消</button>
        <button class="btn-primary" @click="addEvent" :disabled="!newEvent.name || !newEvent.date">
          添加
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'
import BaseModal from '../base/BaseModal.vue'

interface CountdownEvent {
  name: string
  date: string
}

const props = defineProps<{
  instanceId: string
  initialData?: { events?: CountdownEvent[] }
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: any]
  openDetail: []
  closeDetail: []
}>()

const events = ref<CountdownEvent[]>([])
const showAddEvent = ref(false)
const newEvent = ref<CountdownEvent>({ name: '', date: '' })

// 计算属性
const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
})

const nearestEvent = computed(() => {
  const futureEvents = events.value.filter(e => !isPast(e.date))
  if (futureEvents.length === 0) return null
  return futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
})

// 方法
function loadData() {
  if (props.initialData?.events) {
    events.value = props.initialData.events
  }
}

function saveData() {
  emit('update', { events: events.value })
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function isPast(dateStr: string): boolean {
  return daysUntil(dateStr) < 0
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function addEvent() {
  if (!newEvent.value.name || !newEvent.value.date) return
  
  events.value.push({ ...newEvent.value })
  saveData()
  
  newEvent.value = { name: '', date: '' }
  showAddEvent.value = false
}

function deleteEvent(index: number) {
  events.value.splice(index, 1)
  saveData()
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  emit('closeDetail')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.countdown-widget {
  height: 100%;
}

/* 缩略图预览 */
.countdown-preview {
  padding: 16px;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.countdown-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.event-name {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.days-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.days {
  font-size: 42px;
  font-weight: 700;
  color: var(--accent-primary);
  line-height: 1;
}

.label {
  font-size: 16px;
  color: var(--text-secondary);
}

.event-date {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

.no-events {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
}

/* 详情页 */
.countdown-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  color: var(--text-primary);
}

.detail-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.events-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.event-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: var(--transition-normal);
}

.event-card.is-past {
  opacity: 0.6;
}

.event-info {
  flex: 1;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.event-date-full {
  font-size: 13px;
  color: var(--text-secondary);
}

.countdown-info {
  text-align: center;
  min-width: 60px;
}

.countdown-days {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.days-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-primary);
  line-height: 1;
}

.days-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.past-badge {
  padding: 4px 8px;
  background: var(--text-muted);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.delete-event {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.event-card:hover .delete-event {
  opacity: 1;
}

.delete-event:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.empty-events {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-events p {
  font-size: 16px;
}

.add-event-btn {
  padding: 10px 24px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent-primary);
  border: none;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
