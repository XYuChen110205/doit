<template>
  <div class="schedule-widget">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="schedule-preview" @click="openDetail">
      <div class="preview-header">
        <SvgIcon name="Calendar" :size="20" />
        <span>课程表</span>
      </div>
      <div class="today-classes">
        <div v-if="todayClasses.length > 0" class="class-list">
          <div
            v-for="(cls, index) in todayClasses.slice(0, 3)"
            :key="index"
            class="class-item"
            :style="{ borderLeftColor: cls.color }"
          >
            <span class="class-time">{{ cls.startTime }}</span>
            <span class="class-name">{{ cls.name }}</span>
          </div>
        </div>
        <div v-else class="no-class">
          <p>今日无课</p>
        </div>
        <div v-if="todayClasses.length > 3" class="more-classes">
          +{{ todayClasses.length - 3 }} 节课
        </div>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="schedule-detail">
      <div class="detail-header">
        <button class="back-btn" @click="closeDetail">
          <SvgIcon name="ChevronLeft" :size="20" />
          返回
        </button>
        <h2>课程表</h2>
        <button class="add-btn" @click="showAddClass = true">
          <SvgIcon name="Plus" :size="18" />
          添加课程
        </button>
      </div>

      <div class="week-tabs">
        <button
          v-for="(day, index) in weekdays"
          :key="index"
          class="day-tab"
          :class="{ active: currentDay === index, today: isToday(index) }"
          @click="currentDay = index"
        >
          <span class="day-name">{{ day }}</span>
          <span v-if="getDayClasses(index).length > 0" class="class-count">
            {{ getDayClasses(index).length }}
          </span>
        </button>
      </div>

      <div class="day-schedule">
        <div
          v-for="(cls, index) in getDayClasses(currentDay)"
          :key="index"
          class="schedule-item"
          :style="{ backgroundColor: cls.color + '20', borderLeftColor: cls.color }"
        >
          <div class="time-slot">
            <span class="start-time">{{ cls.startTime }}</span>
            <span class="end-time">{{ cls.endTime }}</span>
          </div>
          <div class="class-info">
            <h4 class="class-title">{{ cls.name }}</h4>
            <p class="class-location">
              <SvgIcon name="Pin" :size="14" />
              {{ cls.location }}
            </p>
            <p v-if="cls.teacher" class="class-teacher">
              <SvgIcon name="User" :size="14" />
              {{ cls.teacher }}
            </p>
          </div>
          <button class="delete-class" @click="deleteClass(index)">
            <SvgIcon name="Trash" :size="16" />
          </button>
        </div>

        <div v-if="getDayClasses(currentDay).length === 0" class="empty-day">
          <SvgIcon name="Calendar" :size="48" />
          <p>今天没有课程</p>
          <button class="add-class-btn" @click="showAddClass = true">
            添加课程
          </button>
        </div>
      </div>
    </div>

    <!-- 添加课程弹窗 -->
    <BaseModal
      v-if="showAddClass"
      :is-open="showAddClass"
      title="添加课程"
      @close="showAddClass = false"
    >
      <div class="form-group">
        <label>课程名称</label>
        <input v-model="newClass.name" placeholder="如：高等数学" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>星期</label>
          <select v-model="newClass.day">
            <option v-for="(day, index) in weekdays" :key="index" :value="index">
              {{ day }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>颜色</label>
          <div class="color-picker">
            <button
              v-for="color in classColors"
              :key="color"
              class="color-option"
              :style="{ backgroundColor: color }"
              :class="{ selected: newClass.color === color }"
              @click="newClass.color = color"
            />
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>开始时间</label>
          <input v-model="newClass.startTime" type="time" />
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <input v-model="newClass.endTime" type="time" />
        </div>
      </div>
      <div class="form-group">
        <label>地点</label>
        <input v-model="newClass.location" placeholder="如：教学楼 A301" />
      </div>
      <div class="form-group">
        <label>教师（可选）</label>
        <input v-model="newClass.teacher" placeholder="如：张教授" />
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAddClass = false">取消</button>
        <button class="btn-primary" @click="addClass" :disabled="!newClass.name">添加</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'
import BaseModal from '../base/BaseModal.vue'

interface ClassItem {
  name: string
  day: number
  startTime: string
  endTime: string
  location: string
  teacher?: string
  color: string
}

const props = defineProps<{
  instanceId: string
  initialData?: { classes?: ClassItem[] }
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: any]
  openDetail: []
  closeDetail: []
}>()

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const classColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8']

const classes = ref<ClassItem[]>([])
const currentDay = ref(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
const showAddClass = ref(false)

const newClass = ref<ClassItem>({
  name: '',
  day: 0,
  startTime: '08:00',
  endTime: '09:40',
  location: '',
  teacher: '',
  color: classColors[0]
})

// 计算属性
const todayClasses = computed(() => {
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  return getDayClasses(today)
})

// 方法
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function loadData() {
  if (props.initialData?.classes) {
    classes.value = props.initialData.classes
  }
}

function saveData() {
  emit('update', { classes: classes.value })
}

function getDayClasses(day: number): ClassItem[] {
  return classes.value
    .filter(c => c.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function isToday(day: number): boolean {
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  return day === today
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  emit('closeDetail')
}

function addClass() {
  if (!newClass.value.name) return
  
  classes.value.push({ ...newClass.value })
  saveData()
  
  // 重置表单
  newClass.value = {
    name: '',
    day: newClass.value.day,
    startTime: '08:00',
    endTime: '09:40',
    location: '',
    teacher: '',
    color: classColors[0]
  }
  showAddClass.value = false
}

function deleteClass(index: number) {
  const dayClasses = getDayClasses(currentDay.value)
  const classToDelete = dayClasses[index]
  classes.value = classes.value.filter(c => c !== classToDelete)
  saveData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.schedule-widget {
  height: 100%;
}

/* 缩略图预览 */
.schedule-preview {
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

.today-classes {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.class-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 8px;
  border-left: 3px solid;
}

.class-time {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.class-name {
  font-size: 14px;
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-class {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
}

.more-classes {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

/* 详情页 */
.schedule-detail {
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

.week-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-normal);
  min-width: 60px;
}

.day-tab:hover {
  background: var(--bg-hover);
}

.day-tab.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.day-tab.today {
  border-color: var(--accent-primary);
}

.day-name {
  font-size: 14px;
  font-weight: 500;
}

.class-count {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
}

.day-schedule {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  margin-bottom: 12px;
  border-left: 4px solid;
}

.time-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.start-time {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.end-time {
  font-size: 12px;
  color: var(--text-muted);
}

.class-info {
  flex: 1;
}

.class-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.class-location,
.class-teacher {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.delete-class {
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

.schedule-item:hover .delete-class {
  opacity: 1;
}

.delete-class:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.empty-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-day p {
  font-size: 16px;
}

.add-class-btn {
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--transition-normal);
}

.color-option.selected {
  border-color: var(--text-primary);
  transform: scale(1.1);
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
