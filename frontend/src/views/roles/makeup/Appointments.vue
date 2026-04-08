<template>
  <div class="appointments-page">
    <div class="page-header">
      <h1>预约管理</h1>
      <button class="btn-primary" @click="showAddModal = true">+ 新建预约</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ todayCount }}</div>
        <div class="stat-label">今日预约</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ weekCount }}</div>
        <div class="stat-label">本周预约</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ pendingCount }}</div>
        <div class="stat-label">待确认</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">¥{{ todayIncome }}</div>
        <div class="stat-label">今日预计收入</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="filter-tab"
          :class="{ active: currentTab === tab.value }"
          @click="currentTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索客户姓名或电话..."
        class="search-input"
      />
    </div>

    <!-- 预约列表 -->
    <div class="appointments-list">
      <div
        v-for="apt in filteredAppointments"
        :key="apt.id"
        class="appointment-card"
        :class="apt.status"
      >
        <div class="apt-header">
          <div class="apt-time">
            <span class="time">{{ apt.time }}</span>
            <span class="date">{{ apt.date }}</span>
          </div>
          <span class="apt-status" :class="apt.status">{{ statusText[apt.status] }}</span>
        </div>
        <div class="apt-body">
          <div class="client-info">
            <div class="client-name">{{ apt.clientName }}</div>
            <div class="client-phone">{{ apt.clientPhone }}</div>
          </div>
          <div class="service-info">
            <div class="service-name">{{ apt.service }}</div>
            <div class="service-price">¥{{ apt.price }}</div>
          </div>
        </div>
        <div class="apt-footer">
          <span class="apt-notes" v-if="apt.notes">📝 {{ apt.notes }}</span>
          <div class="apt-actions">
            <button
              v-if="apt.status === 'pending'"
              class="btn-confirm"
              @click="confirmAppointment(apt.id)"
            >
              确认
            </button>
            <button
              v-if="apt.status === 'confirmed'"
              class="btn-complete"
              @click="completeAppointment(apt.id)"
            >
              完成
            </button>
            <button class="btn-edit" @click="editAppointment(apt)">编辑</button>
            <button class="btn-delete" @click="deleteAppointment(apt.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingId ? '编辑预约' : '新建预约' }}</h2>
        <form @submit.prevent="saveAppointment">
          <div class="form-group">
            <label>客户姓名</label>
            <input v-model="form.clientName" type="text" required placeholder="输入客户姓名" />
          </div>
          <div class="form-group">
            <label>联系电话</label>
            <input v-model="form.clientPhone" type="tel" required placeholder="输入联系电话" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>日期</label>
              <input v-model="form.date" type="date" required />
            </div>
            <div class="form-group">
              <label>时间</label>
              <input v-model="form.time" type="time" required />
            </div>
          </div>
          <div class="form-group">
            <label>服务项目</label>
            <select v-model="form.service" required>
              <option value="">请选择服务</option>
              <option value="日常妆">日常妆</option>
              <option value="晚宴妆">晚宴妆</option>
              <option value="新娘妆">新娘妆</option>
              <option value="舞台妆">舞台妆</option>
              <option value="摄影妆">摄影妆</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格 (¥)</label>
            <input v-model.number="form.price" type="number" required placeholder="输入价格" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="form.notes" rows="2" placeholder="添加备注信息..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Appointment {
  id: string
  clientName: string
  clientPhone: string
  date: string
  time: string
  service: string
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string
}

// 标签页
const tabs = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' }
]
const currentTab = ref('all')
const searchQuery = ref('')
const showAddModal = ref(false)
const editingId = ref<string | null>(null)

// 表单数据
const form = ref({
  clientName: '',
  clientPhone: '',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  service: '',
  price: 0,
  notes: ''
})

// 状态文本映射
const statusText: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

// 从 localStorage 加载预约数据
const appointments = ref<Appointment[]>([])

onMounted(() => {
  const saved = localStorage.getItem('makeup_appointments')
  if (saved) {
    appointments.value = JSON.parse(saved)
  } else {
    // 初始化示例数据
    appointments.value = [
      {
        id: '1',
        clientName: '张女士',
        clientPhone: '138****1234',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        service: '新娘妆',
        price: 888,
        status: 'confirmed',
        notes: '需要提前试妆'
      },
      {
        id: '2',
        clientName: '李小姐',
        clientPhone: '139****5678',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        service: '日常妆',
        price: 128,
        status: 'pending',
        notes: ''
      }
    ]
    saveToStorage()
  }
})

// 保存到 localStorage
function saveToStorage() {
  localStorage.setItem('makeup_appointments', JSON.stringify(appointments.value))
}

// 统计计算
const today = new Date().toISOString().split('T')[0]
const todayCount = computed(() => appointments.value.filter(a => a.date === today && a.status !== 'cancelled').length)
const todayIncome = computed(() => appointments.value
  .filter(a => a.date === today && (a.status === 'confirmed' || a.status === 'completed'))
  .reduce((sum, a) => sum + a.price, 0))
const weekCount = computed(() => {
  const weekLater = new Date()
  weekLater.setDate(weekLater.getDate() + 7)
  return appointments.value.filter(a => {
    const aptDate = new Date(a.date)
    return aptDate >= new Date() && aptDate <= weekLater && a.status !== 'cancelled'
  }).length
})
const pendingCount = computed(() => appointments.value.filter(a => a.status === 'pending').length)

// 筛选后的预约列表
const filteredAppointments = computed(() => {
  let result = appointments.value

  // 按状态筛选
  if (currentTab.value !== 'all') {
    result = result.filter(a => a.status === currentTab.value)
  }

  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      a.clientName.toLowerCase().includes(query) ||
      a.clientPhone.includes(query)
    )
  }

  // 按日期时间排序
  return result.sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time)
    const dateB = new Date(b.date + ' ' + b.time)
    return dateB.getTime() - dateA.getTime()
  })
})

// 操作方法
function confirmAppointment(id: string) {
  const apt = appointments.value.find(a => a.id === id)
  if (apt) {
    apt.status = 'confirmed'
    saveToStorage()
  }
}

function completeAppointment(id: string) {
  const apt = appointments.value.find(a => a.id === id)
  if (apt) {
    apt.status = 'completed'
    saveToStorage()
  }
}

function deleteAppointment(id: string) {
  if (confirm('确定要删除这个预约吗？')) {
    appointments.value = appointments.value.filter(a => a.id !== id)
    saveToStorage()
  }
}

function editAppointment(apt: Appointment) {
  editingId.value = apt.id
  form.value = { ...apt }
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  editingId.value = null
  form.value = {
    clientName: '',
    clientPhone: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    service: '',
    price: 0,
    notes: ''
  }
}

function saveAppointment() {
  if (editingId.value) {
    const index = appointments.value.findIndex(a => a.id === editingId.value)
    if (index !== -1) {
      appointments.value[index] = { ...form.value, id: editingId.value, status: appointments.value[index].status }
    }
  } else {
    const newAppointment: Appointment = {
      ...form.value,
      id: Date.now().toString(),
      status: 'pending'
    }
    appointments.value.push(newAppointment)
  }
  saveToStorage()
  closeModal()
}
</script>

<style scoped>
.appointments-page {
  padding: var(--space-4);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  text-align: center;
  border: 1px solid var(--border-light);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.filter-tabs {
  display: flex;
  gap: var(--space-2);
}

.filter-tab {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.filter-tab.active {
  background: var(--accent-primary);
  color: white;
}

.search-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  min-width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

/* 预约列表 */
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.appointment-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  border: 1px solid var(--border-light);
  transition: var(--transition-normal);
}

.appointment-card:hover {
  box-shadow: var(--shadow-md);
}

.appointment-card.pending {
  border-left: 4px solid #f59e0b;
}

.appointment-card.confirmed {
  border-left: 4px solid var(--accent-primary);
}

.appointment-card.completed {
  border-left: 4px solid #10b981;
}

.apt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.apt-time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.apt-time .time {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.apt-time .date {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.apt-status {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.apt-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.apt-status.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.apt-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.apt-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.client-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.client-phone {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.service-name {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  text-align: right;
}

.service-price {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  text-align: right;
}

.apt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-light);
}

.apt-notes {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.apt-actions {
  display: flex;
  gap: var(--space-2);
}

.apt-actions button {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-confirm {
  background: #dbeafe;
  color: #1e40af;
}

.btn-complete {
  background: #d1fae5;
  color: #065f46;
}

.btn-edit {
  background: var(--bg-primary);
  color: var(--text-secondary);
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .apt-body {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .service-info {
    text-align: left;
  }

  .apt-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .apt-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
