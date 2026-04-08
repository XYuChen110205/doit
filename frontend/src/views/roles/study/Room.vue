<template>
  <div class="study-room">
    <!-- 房间列表 -->
    <div class="rooms-section">
      <div class="section-header">
        <h3>自习室</h3>
        <button class="create-btn" @click="showCreateModal = true">
          创建房间
        </button>
      </div>

      <div class="rooms-grid">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="room-card"
          :class="{ active: currentRoom?.id === room.id, full: room.users >= room.maxUsers }"
          @click="joinRoom(room)"
        >
          <div class="room-header">
            <div class="room-icon" :style="{ background: room.color }"></div>
            <div class="room-info">
              <div class="room-name">{{ room.name }}</div>
              <div class="room-desc">{{ room.description }}</div>
            </div>
          </div>
          <div class="room-stats">
            <div class="stat">
              <span class="stat-value">{{ room.users }}</span>
              <span class="stat-label">/{{ room.maxUsers }}人</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ room.totalFocusMinutes }}</span>
              <span class="stat-label">分钟</span>
            </div>
          </div>
          <div class="room-tags">
            <span
              v-for="tag in room.tags"
              :key="tag"
              class="room-tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="room-status" :class="room.status">
            {{ room.status === 'active' ? '进行中' : '休息中' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 当前房间 -->
    <div v-if="currentRoom" class="current-room">
      <div class="room-main">
        <div class="room-title-bar">
          <div class="room-title">
            <div class="room-icon" :style="{ background: currentRoom.color }"></div>
            <span>{{ currentRoom.name }}</span>
          </div>
          <button class="leave-btn" @click="leaveRoom">离开房间</button>
        </div>

        <!-- 计时器 -->
        <div class="room-timer">
          <div class="timer-display">{{ formattedTime }}</div>
          <div class="timer-controls">
            <button
              v-if="!isRunning"
              class="control-btn primary"
              @click="startTimer"
            >
              开始专注
            </button>
            <button
              v-else
              class="control-btn warning"
              @click="pauseTimer"
            >
              暂停
            </button>
            <button class="control-btn" @click="resetTimer">重置</button>
          </div>
        </div>

        <!-- 房间成员 -->
        <div class="room-members">
          <h4>房间成员 ({{ roomMembers.length }})</h4>
          <div class="members-list">
            <div
              v-for="member in roomMembers"
              :key="member.id"
              class="member-item"
              :class="{ self: member.isSelf, focusing: member.isFocusing }"
            >
              <div class="member-avatar" :style="{ background: member.color }">
                {{ member.name.charAt(0) }}
              </div>
              <div class="member-info">
                <div class="member-name">
                  {{ member.name }}
                  <span v-if="member.isSelf" class="self-tag">我</span>
                </div>
                <div class="member-status">
                  {{ member.isFocusing ? `专注中 ${member.focusTime}分钟` : '休息中' }}
                </div>
              </div>
              <div class="member-focus">{{ member.todayMinutes }}分钟</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 房间聊天 -->
      <div class="room-chat">
        <div class="chat-header">
          <h4>房间消息</h4>
        </div>
        <div class="chat-messages" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="chat-message"
            :class="{ self: msg.isSelf, system: msg.isSystem }"
          >
            <div v-if="!msg.isSystem" class="message-avatar" :style="{ background: msg.userColor }">
              {{ msg.userName?.charAt(0) }}
            </div>
            <div class="message-content">
              <div v-if="!msg.isSystem" class="message-user">{{ msg.userName }}</div>
              <div class="message-text">{{ msg.text }}</div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            type="text"
            placeholder="发送消息..."
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </div>

    <!-- 创建房间弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>创建自习室</h3>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>房间名称</label>
            <input
              v-model="newRoom.name"
              type="text"
              placeholder="输入房间名称"
            />
          </div>
          <div class="form-group">
            <label>房间描述</label>
            <input
              v-model="newRoom.description"
              type="text"
              placeholder="输入房间描述"
            />
          </div>
          <div class="form-group">
            <label>最大人数</label>
            <select v-model="newRoom.maxUsers">
              <option :value="5">5人</option>
              <option :value="10">10人</option>
              <option :value="20">20人</option>
              <option :value="50">50人</option>
            </select>
          </div>
          <div class="form-group">
            <label>房间标签</label>
            <div class="tag-select">
              <button
                v-for="tag in availableTags"
                :key="tag"
                class="tag-btn"
                :class="{ active: newRoom.tags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn-primary" @click="createRoom">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'

// 房间列表
const rooms = ref([
  {
    id: 1,
    name: '考研自习室',
    description: '专注考研，一起上岸',
    users: 12,
    maxUsers: 20,
    totalFocusMinutes: 2580,
    tags: ['考研', '学习'],
    status: 'active',
    color: '#667eea'
  },
  {
    id: 2,
    name: '编程学习室',
    description: '代码改变世界',
    users: 8,
    maxUsers: 15,
    totalFocusMinutes: 1860,
    tags: ['编程', '技术'],
    status: 'active',
    color: '#f093fb'
  },
  {
    id: 3,
    name: '阅读分享室',
    description: '阅读使人充实',
    users: 5,
    maxUsers: 10,
    totalFocusMinutes: 920,
    tags: ['阅读', '文学'],
    status: 'resting',
    color: '#4facfe'
  },
  {
    id: 4,
    name: '深夜自习室',
    description: '夜猫子的聚集地',
    users: 6,
    maxUsers: 20,
    totalFocusMinutes: 1450,
    tags: ['深夜', '安静'],
    status: 'active',
    color: '#43e97b'
  },
  {
    id: 5,
    name: '早起打卡室',
    description: '早起鸟儿的专属空间',
    users: 15,
    maxUsers: 30,
    totalFocusMinutes: 3200,
    tags: ['早起', '自律'],
    status: 'active',
    color: '#fa709a'
  },
  {
    id: 6,
    name: '写作创作室',
    description: '记录灵感，创作无限',
    users: 4,
    maxUsers: 10,
    totalFocusMinutes: 680,
    tags: ['写作', '创作'],
    status: 'resting',
    color: '#feca57'
  }
])

const currentRoom = ref<typeof rooms.value[0] | null>(null)
const showCreateModal = ref(false)

// 新房间表单
const newRoom = ref({
  name: '',
  description: '',
  maxUsers: 10,
  tags: [] as string[]
})

const availableTags = ['学习', '考研', '编程', '阅读', '写作', '早起', '深夜', '安静', '自律', '技术', '文学', '创作']

function toggleTag(tag: string) {
  const index = newRoom.value.tags.indexOf(tag)
  if (index > -1) {
    newRoom.value.tags.splice(index, 1)
  } else {
    newRoom.value.tags.push(tag)
  }
}

function createRoom() {
  if (!newRoom.value.name) return

  const room = {
    id: Date.now(),
    name: newRoom.value.name,
    description: newRoom.value.description || '一起专注学习',
    users: 1,
    maxUsers: newRoom.value.maxUsers,
    totalFocusMinutes: 0,
    tags: newRoom.value.tags.length > 0 ? newRoom.value.tags : ['学习'],
    status: 'active',
    color: `hsl(${Math.random() * 360}, 70%, 60%)`
  }

  rooms.value.unshift(room)
  showCreateModal.value = false
  joinRoom(room)

  // 重置表单
  newRoom.value = { name: '', description: '', maxUsers: 10, tags: [] }
}

function joinRoom(room: typeof rooms.value[0]) {
  if (room.users >= room.maxUsers) return
  currentRoom.value = room
  addSystemMessage(`你加入了 "${room.name}"`)
}

function leaveRoom() {
  if (currentRoom.value) {
    addSystemMessage(`你离开了 "${currentRoom.value.name}"`)
    currentRoom.value = null
  }
}

// 房间成员
const roomMembers = ref([
  { id: 1, name: '小明', color: '#667eea', isSelf: true, isFocusing: false, focusTime: 0, todayMinutes: 125 },
  { id: 2, name: '小红', color: '#f093fb', isSelf: false, isFocusing: true, focusTime: 15, todayMinutes: 90 },
  { id: 3, name: '小李', color: '#4facfe', isSelf: false, isFocusing: true, focusTime: 32, todayMinutes: 180 },
  { id: 4, name: '小张', color: '#43e97b', isSelf: false, isFocusing: false, focusTime: 0, todayMinutes: 60 }
])

// 计时器
const time = ref(25 * 60)
const isRunning = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const minutes = Math.floor(time.value / 60)
  const seconds = time.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

function startTimer() {
  isRunning.value = true
  const selfMember = roomMembers.value.find(m => m.isSelf)
  if (selfMember) {
    selfMember.isFocusing = true
  }

  timer = setInterval(() => {
    if (time.value > 0) {
      time.value--
      if (selfMember) {
        selfMember.focusTime = Math.floor((25 * 60 - time.value) / 60)
      }
    } else {
      completeTimer()
    }
  }, 1000)
}

function pauseTimer() {
  isRunning.value = false
  const selfMember = roomMembers.value.find(m => m.isSelf)
  if (selfMember) {
    selfMember.isFocusing = false
  }
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function resetTimer() {
  pauseTimer()
  time.value = 25 * 60
  const selfMember = roomMembers.value.find(m => m.isSelf)
  if (selfMember) {
    selfMember.focusTime = 0
  }
}

function completeTimer() {
  pauseTimer()
  addSystemMessage('恭喜！你完成了一次专注！')
}

// 聊天
const messages = ref<Array<{
  userName?: string
  userColor?: string
  text: string
  time: string
  isSelf?: boolean
  isSystem?: boolean
}>>([
  { userName: '小红', userColor: '#f093fb', text: '大家加油！', time: '14:30', isSelf: false },
  { userName: '小李', userColor: '#4facfe', text: '一起努力', time: '14:32', isSelf: false },
  { text: '欢迎来到自习室，请保持安静，专注学习', time: '14:00', isSystem: true }
])

const newMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)

function sendMessage() {
  if (!newMessage.value.trim()) return

  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  messages.value.push({
    userName: '小明',
    userColor: '#667eea',
    text: newMessage.value,
    time: timeStr,
    isSelf: true
  })

  newMessage.value = ''

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function addSystemMessage(text: string) {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  messages.value.push({
    text,
    time: timeStr,
    isSystem: true
  })

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.study-room {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* 房间列表 */
.rooms-section {
  margin-bottom: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.create-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.create-btn:hover {
  background: var(--accent-primary-hover);
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.room-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: var(--transition-normal);
  border: 2px solid transparent;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.room-card.active {
  border-color: var(--accent-primary);
}

.room-card.full {
  opacity: 0.6;
  cursor: not-allowed;
}

.room-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.room-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
}

.room-info {
  flex: 1;
}

.room-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.room-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.room-stats {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.stat {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.room-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.room-tag {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  color: var(--accent-primary);
  background: var(--accent-primary-bg);
  border-radius: var(--radius-sm);
}

.room-status {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-align: center;
}

.room-status.active {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.room-status.resting {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
}

/* 当前房间 */
.current-room {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--space-6);
}

.room-main {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.room-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.room-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.leave-btn {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--error);
  background: transparent;
  border: 1px solid var(--error);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.leave-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* 计时器 */
.room-timer {
  text-align: center;
  padding: var(--space-6);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-5);
}

.timer-display {
  font-size: 72px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  letter-spacing: 8px;
  margin-bottom: var(--space-4);
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

.control-btn {
  padding: var(--space-3) var(--space-6);
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

.control-btn:not(.primary):not(.warning) {
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.control-btn:not(.primary):not(.warning):hover {
  background: var(--bg-hover);
}

/* 房间成员 */
.room-members h4 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.member-item.focusing {
  background: var(--accent-primary-bg);
  border: 1px solid var(--accent-primary);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-inverse);
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.self-tag {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  color: var(--accent-primary);
  background: var(--accent-primary-bg);
  border-radius: var(--radius-sm);
  margin-left: var(--space-2);
}

.member-status {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.member-focus {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
}

/* 聊天 */
.room-chat {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.chat-header h4 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chat-message {
  display: flex;
  gap: var(--space-2);
}

.chat-message.self {
  flex-direction: row-reverse;
}

.chat-message.system {
  justify-content: center;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--text-inverse);
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.chat-message.self .message-content {
  text-align: right;
}

.message-user {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.message-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  display: inline-block;
}

.chat-message.self .message-text {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.chat-message.system .message-text {
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.chat-input {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

.chat-input input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.chat-input input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.chat-input button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.chat-input button:hover {
  background: var(--accent-primary-hover);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  font-size: 24px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.tag-select {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tag-btn:hover {
  color: var(--text-primary);
}

.tag-btn.active {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

@media (max-width: 1024px) {
  .current-room {
    grid-template-columns: 1fr;
  }

  .room-chat {
    height: 400px;
  }
}

@media (max-width: 640px) {
  .rooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>
