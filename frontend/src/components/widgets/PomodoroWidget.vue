<template>
  <div class="pomodoro-widget">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="pomodoro-preview" @click="openDetail">
      <div class="preview-header">
        <SvgIcon name="Clock" :size="20" />
        <span>番茄钟</span>
      </div>
      <div class="timer-display">
        <div class="time">{{ formatTime(timeLeft) }}</div>
        <div class="status">{{ isRunning ? '专注中...' : '已暂停' }}</div>
      </div>
      <div class="stats-preview">
        <span>今日: {{ todayCompleted }} 个番茄</span>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="pomodoro-detail">
      <div class="detail-header">
        <button class="back-btn" @click="closeDetail">
          <SvgIcon name="ChevronLeft" :size="20" />
          返回
        </button>
        <h2>番茄钟</h2>
        <button class="settings-btn" @click="showSettings = true">
          <SvgIcon name="Settings" :size="18" />
        </button>
      </div>

      <div class="timer-container">
        <div class="timer-circle" :class="{ running: isRunning }">
          <div class="time-main">{{ formatTime(timeLeft) }}</div>
          <div class="timer-status">{{ currentMode === 'work' ? '专注时间' : '休息时间' }}</div>
        </div>

        <div class="timer-controls">
          <button v-if="!isRunning" class="control-btn start" @click="startTimer">
            <SvgIcon name="Play" :size="24" />
            开始
          </button>
          <button v-else class="control-btn pause" @click="pauseTimer">
            <SvgIcon name="Pause" :size="24" />
            暂停
          </button>
          <button class="control-btn reset" @click="resetTimer">
            <SvgIcon name="Refresh" :size="20" />
            重置
          </button>
        </div>

        <div class="mode-switcher">
          <button
            v-for="mode in modes"
            :key="mode.value"
            class="mode-btn"
            :class="{ active: currentMode === mode.value }"
            @click="switchMode(mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <div class="stats-section">
        <h3>今日统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ todayCompleted }}</span>
            <span class="stat-label">完成番茄</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatDuration(todayFocusTime) }}</span>
            <span class="stat-label">专注时长</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalCompleted }}</span>
            <span class="stat-label">累计番茄</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <BaseModal
      v-if="showSettings"
      :is-open="showSettings"
      title="番茄钟设置"
      @close="showSettings = false"
    >
      <div class="form-group">
        <label>专注时长（分钟）</label>
        <input v-model.number="settings.workDuration" type="number" min="1" max="60" />
      </div>
      <div class="form-group">
        <label>短休息时长（分钟）</label>
        <input v-model.number="settings.shortBreak" type="number" min="1" max="30" />
      </div>
      <div class="form-group">
        <label>长休息时长（分钟）</label>
        <input v-model.number="settings.longBreak" type="number" min="1" max="60" />
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showSettings = false">取消</button>
        <button class="btn-primary" @click="saveSettings">保存</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'
import BaseModal from '../base/BaseModal.vue'

interface PomodoroSettings {
  workDuration: number
  shortBreak: number
  longBreak: number
}

interface PomodoroStats {
  todayCompleted: number
  todayFocusTime: number
  totalCompleted: number
  lastDate: string
}

const props = defineProps<{
  instanceId: string
  initialData?: {
    settings?: PomodoroSettings
    stats?: PomodoroStats
  }
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: any]
  openDetail: []
  closeDetail: []
}>()

// 模式配置
const modes = [
  { value: 'work', label: '专注' },
  { value: 'shortBreak', label: '短休息' },
  { value: 'longBreak', label: '长休息' }
]

// 状态
const currentMode = ref<'work' | 'shortBreak' | 'longBreak'>('work')
const timeLeft = ref(25 * 60)
const isRunning = ref(false)
const showSettings = ref(false)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

const settings = ref<PomodoroSettings>({
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15
})

const stats = ref<PomodoroStats>({
  todayCompleted: 0,
  todayFocusTime: 0,
  totalCompleted: 0,
  lastDate: new Date().toDateString()
})

// 计算属性
const todayCompleted = computed(() => stats.value.todayCompleted)
const todayFocusTime = computed(() => stats.value.todayFocusTime)
const totalCompleted = computed(() => stats.value.totalCompleted)

const durationMap = computed(() => ({
  work: settings.value.workDuration * 60,
  shortBreak: settings.value.shortBreak * 60,
  longBreak: settings.value.longBreak * 60
}))

// 方法
function loadData() {
  if (props.initialData?.settings) {
    settings.value = { ...settings.value, ...props.initialData.settings }
  }
  if (props.initialData?.stats) {
    stats.value = { ...stats.value, ...props.initialData.stats }
    // 检查是否是新的一天
    const today = new Date().toDateString()
    if (stats.value.lastDate !== today) {
      stats.value.todayCompleted = 0
      stats.value.todayFocusTime = 0
      stats.value.lastDate = today
      saveData()
    }
  }
  // 初始化时间
  timeLeft.value = durationMap.value[currentMode.value]
}

function saveData() {
  emit('update', {
    settings: settings.value,
    stats: stats.value
  })
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`
}

function startTimer() {
  if (isRunning.value) return
  isRunning.value = true
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      // 更新专注时长统计
      if (currentMode.value === 'work') {
        stats.value.todayFocusTime++
        saveData()
      }
    } else {
      completeTimer()
    }
  }, 1000)
}

function pauseTimer() {
  isRunning.value = false
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function resetTimer() {
  pauseTimer()
  timeLeft.value = durationMap.value[currentMode.value]
}

function completeTimer() {
  pauseTimer()
  if (currentMode.value === 'work') {
    stats.value.todayCompleted++
    stats.value.totalCompleted++
    saveData()
    // 自动切换到休息模式
    switchMode('shortBreak')
  } else {
    // 休息结束，切换回专注模式
    switchMode('work')
  }
}

function switchMode(mode: 'work' | 'shortBreak' | 'longBreak') {
  pauseTimer()
  currentMode.value = mode
  timeLeft.value = durationMap.value[mode]
}

function saveSettings() {
  timeLeft.value = durationMap.value[currentMode.value]
  saveData()
  showSettings.value = false
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

onUnmounted(() => {
  pauseTimer()
})
</script>

<style scoped>
.pomodoro-widget {
  height: 100%;
}

/* 缩略图预览 */
.pomodoro-preview {
  padding: 16px;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
}

.timer-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.time {
  font-size: 36px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.status {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.stats-preview {
  text-align: center;
  font-size: 12px;
  opacity: 0.9;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

/* 详情页 */
.pomodoro-detail {
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

.settings-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
}

.settings-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.timer-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  transition: transform 0.3s ease;
}

.timer-circle.running {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.time-main {
  font-size: 48px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.timer-status {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
}

.timer-controls {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition-normal);
}

.control-btn.start {
  background: var(--accent-success);
  color: white;
}

.control-btn.pause {
  background: var(--accent-warning);
  color: white;
}

.control-btn.reset {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.mode-switcher {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.mode-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: var(--transition-normal);
}

.mode-btn:hover {
  background: var(--bg-hover);
}

.mode-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.stats-section {
  padding: 20px;
  border-top: 1px solid var(--border);
}

.stats-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
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
</style>
