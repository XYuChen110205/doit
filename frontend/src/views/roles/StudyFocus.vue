<template>
  <div class="study-focus">
    <div class="focus-layout">
      <!-- 左侧：任务选择 -->
      <div class="task-panel">
        <h3>当前任务</h3>
        <div class="task-input-wrapper">
          <input
            v-model="currentTask"
            type="text"
            placeholder="输入专注任务..."
            class="task-input"
          />
        </div>
        <div class="quick-tasks">
          <h4>快速选择</h4>
          <div class="task-tags">
            <button
              v-for="task in quickTasks"
              :key="task"
              class="task-tag"
              :class="{ active: currentTask === task }"
              @click="currentTask = task"
            >
              {{ task }}
            </button>
          </div>
        </div>
      </div>

      <!-- 中间：计时器 -->
      <div class="timer-panel">
        <div class="timer-container">
          <div class="mode-selector">
            <button
              v-for="mode in timerModes"
              :key="mode.value"
              class="mode-btn"
              :class="{ active: currentMode === mode.value }"
              @click="switchMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>

          <div class="timer-display" :class="{ running: isRunning }">
            {{ formattedTime }}
          </div>

          <div class="timer-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              {{ Math.round(progressPercent) }}%
            </div>
          </div>

          <div class="timer-status">
            <span v-if="isRunning" class="status-running">专注中...</span>
            <span v-else-if="isPaused" class="status-paused">已暂停</span>
            <span v-else class="status-ready">准备开始</span>
          </div>

          <div class="timer-controls">
            <button
              v-if="!isRunning && !isPaused"
              class="control-btn primary"
              @click="startTimer"
            >
              开始专注
            </button>
            <button
              v-else-if="isRunning"
              class="control-btn warning"
              @click="pauseTimer"
            >
              暂停
            </button>
            <button
              v-else
              class="control-btn primary"
              @click="resumeTimer"
            >
              继续
            </button>
            <button class="control-btn secondary" @click="resetTimer">
              重置
            </button>
          </div>
        </div>

        <!-- 今日统计 -->
        <div class="today-stats">
          <div class="stat-card">
            <div class="stat-icon sessions"></div>
            <div class="stat-info">
              <div class="stat-value">{{ todaySessions }}</div>
              <div class="stat-label">专注次数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon minutes"></div>
            <div class="stat-info">
              <div class="stat-value">{{ todayMinutes }}</div>
              <div class="stat-label">专注分钟</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon tasks"></div>
            <div class="stat-info">
              <div class="stat-value">{{ todayTasks }}</div>
              <div class="stat-label">完成任务</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：白噪音 -->
      <div class="sound-panel">
        <h3>白噪音</h3>
        <div class="sound-list">
          <div
            v-for="sound in whiteNoises"
            :key="sound.id"
            class="sound-item"
            :class="{ active: currentSound === sound.id }"
            @click="toggleSound(sound.id)"
          >
            <div class="sound-icon" :class="sound.icon"></div>
            <div class="sound-name">{{ sound.name }}</div>
            <div class="sound-status">
              {{ currentSound === sound.id ? '播放中' : '点击播放' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 专注记录 -->
    <div class="session-history">
      <h3>今日专注记录</h3>
      <div v-if="sessions.length === 0" class="empty-history">
        还没有专注记录，开始你的第一次专注吧！
      </div>
      <div v-else class="session-list">
        <div
          v-for="(session, index) in sessions"
          :key="index"
          class="session-item"
        >
          <div class="session-time">{{ session.time }}</div>
          <div class="session-task">{{ session.task || '未命名任务' }}</div>
          <div class="session-duration">{{ session.duration }}分钟</div>
          <div
            class="session-status"
            :class="session.completed ? 'completed' : 'abandoned'"
          >
            {{ session.completed ? '已完成' : '已放弃' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'

// 计时器模式
const timerModes = [
  { label: '专注', value: 'focus', minutes: 25 },
  { label: '短休', value: 'shortBreak', minutes: 5 },
  { label: '长休', value: 'longBreak', minutes: 15 }
]

const currentMode = ref('focus')
const time = ref(25 * 60)
const totalTime = ref(25 * 60)
const isRunning = ref(false)
const isPaused = ref(false)
const currentTask = ref('')

// 统计数据
const todaySessions = ref(0)
const todayMinutes = ref(0)
const todayTasks = ref(0)
const sessions = ref<Array<{
  time: string
  task: string
  duration: number
  completed: boolean
}>>([])

// 快速任务
const quickTasks = ['阅读', '写作', '编程', '学习', '思考', '规划']

// 白噪音
const whiteNoises = [
  { id: 'rain', name: '雨声', icon: 'rain' },
  { id: 'forest', name: '森林', icon: 'forest' },
  { id: 'cafe', name: '咖啡馆', icon: 'cafe' },
  { id: 'fire', name: '篝火', icon: 'fire' },
  { id: 'waves', name: '海浪', icon: 'waves' }
]
const currentSound = ref('')

let timer: ReturnType<typeof setInterval> | null = null

// 计算属性
const formattedTime = computed(() => {
  const minutes = Math.floor(time.value / 60)
  const seconds = time.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const progressPercent = computed(() => {
  return ((totalTime.value - time.value) / totalTime.value) * 100
})

// 方法
function switchMode(mode: string) {
  currentMode.value = mode
  const modeConfig = timerModes.find(m => m.value === mode)
  if (modeConfig) {
    time.value = modeConfig.minutes * 60
    totalTime.value = modeConfig.minutes * 60
  }
  resetTimer()
}

function startTimer() {
  if (!currentTask.value) {
    currentTask.value = '专注学习'
  }
  isRunning.value = true
  isPaused.value = false
  timer = setInterval(() => {
    if (time.value > 0) {
      time.value--
    } else {
      completeTimer()
    }
  }, 1000)
}

function pauseTimer() {
  isRunning.value = false
  isPaused.value = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function resumeTimer() {
  startTimer()
}

function resetTimer() {
  pauseTimer()
  isPaused.value = false
  const modeConfig = timerModes.find(m => m.value === currentMode.value)
  if (modeConfig) {
    time.value = modeConfig.minutes * 60
  }
}

function completeTimer() {
  pauseTimer()
  const modeConfig = timerModes.find(m => m.value === currentMode.value)
  if (modeConfig && currentMode.value === 'focus') {
    todaySessions.value++
    todayMinutes.value += modeConfig.minutes
    todayTasks.value++

    const now = new Date()
    sessions.value.unshift({
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      task: currentTask.value,
      duration: modeConfig.minutes,
      completed: true
    })

    saveData()

    // 播放提示音
    playNotificationSound()
  }
}

function playNotificationSound() {
  const audio = new Audio()
  audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanu8LdnHgU2kNbxz4AzBB9uwfDhlE' // 简化的提示音
  audio.play().catch(() => {})
}

function toggleSound(soundId: string) {
  if (currentSound.value === soundId) {
    currentSound.value = ''
  } else {
    currentSound.value = soundId
  }
}

function saveData() {
  localStorage.setItem('studyFocusData', JSON.stringify({
    todaySessions: todaySessions.value,
    todayMinutes: todayMinutes.value,
    todayTasks: todayTasks.value,
    sessions: sessions.value,
    date: new Date().toDateString()
  }))
}

function loadData() {
  const saved = localStorage.getItem('studyFocusData')
  if (saved) {
    const data = JSON.parse(saved)
    // 检查是否是今天的数据
    if (data.date === new Date().toDateString()) {
      todaySessions.value = data.todaySessions || 0
      todayMinutes.value = data.todayMinutes || 0
      todayTasks.value = data.todayTasks || 0
      sessions.value = data.sessions || []
    }
  }
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  saveData()
})
</script>

<style scoped>
.study-focus {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

.focus-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

/* 任务面板 */
.task-panel {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.task-panel h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.task-input-wrapper {
  margin-bottom: var(--space-4);
}

.task-input {
  width: 100%;
  padding: var(--space-3);
  font-size: var(--font-size-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition-fast);
}

.task-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.quick-tasks h4 {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.task-tag {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-fast);
}

.task-tag:hover,
.task-tag.active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  background: var(--accent-primary-bg);
}

/* 计时器面板 */
.timer-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.timer-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.mode-selector {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.mode-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.active {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.timer-display {
  font-size: 96px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  letter-spacing: 8px;
  margin-bottom: var(--space-4);
  transition: var(--transition-normal);
}

.timer-display.running {
  color: var(--accent-primary);
}

.timer-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: 0 var(--space-8);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--radius-full);
  transition: width 1s linear;
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

.timer-status {
  margin-bottom: var(--space-6);
}

.timer-status span {
  font-size: var(--font-size-lg);
  letter-spacing: var(--letter-spacing-wide);
}

.status-running {
  color: var(--accent-primary);
}

.status-paused {
  color: var(--warning);
}

.status-ready {
  color: var(--text-secondary);
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

.control-btn {
  padding: var(--space-3) var(--space-8);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  border: none;
}

.control-btn.primary {
  color: var(--text-inverse);
  background: var(--accent-primary);
}

.control-btn.primary:hover {
  background: var(--accent-primary-hover);
}

.control-btn.warning {
  color: var(--text-inverse);
  background: var(--warning);
}

.control-btn.warning:hover {
  background: #d97706;
}

.control-btn.secondary {
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
}

.control-btn.secondary:hover {
  background: var(--bg-hover);
}

/* 今日统计 */
.today-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
}

.stat-icon.sessions {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.minutes {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 白噪音面板 */
.sound-panel {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.sound-panel h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.sound-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sound-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid transparent;
}

.sound-item:hover {
  background: var(--bg-hover);
}

.sound-item.active {
  background: var(--accent-primary-bg);
  border-color: var(--accent-primary);
}

.sound-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
}

.sound-icon.rain {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sound-icon.forest {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.sound-icon.cafe {
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
}

.sound-icon.fire {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.sound-icon.waves {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.sound-name {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.sound-status {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.sound-item.active .sound-status {
  color: var(--accent-primary);
}

/* 专注记录 */
.session-history {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.session-history h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.empty-history {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.session-item {
  display: grid;
  grid-template-columns: 80px 1fr 80px 80px;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.session-time {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-family: var(--font-family-mono);
}

.session-task {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.session-duration {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
}

.session-status {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-align: center;
}

.session-status.completed {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.session-status.abandoned {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

@media (max-width: 1200px) {
  .focus-layout {
    grid-template-columns: 1fr;
  }

  .task-panel,
  .sound-panel {
    order: 1;
  }

  .timer-panel {
    order: 0;
  }
}
</style>
