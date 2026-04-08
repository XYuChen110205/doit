<template>
  <div class="clients-page">
    <div class="page-header">
      <h1>客户管理</h1>
      <button class="btn-primary" @click="showAddModal = true">+ 添加客户</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ clients.length }}</div>
        <div class="stat-label">总客户数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ vipCount }}</div>
        <div class="stat-label">VIP客户</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ newThisMonth }}</div>
        <div class="stat-label">本月新增</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgConsumption }}</div>
        <div class="stat-label">平均消费</div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索客户姓名、电话或备注..."
        class="search-input"
      />
      <select v-model="filterLevel" class="filter-select">
        <option value="">全部等级</option>
        <option value="普通">普通</option>
        <option value="VIP">VIP</option>
        <option value="SVIP">SVIP</option>
      </select>
    </div>

    <!-- 客户列表 -->
    <div class="clients-list">
      <div
        v-for="client in filteredClients"
        :key="client.id"
        class="client-card"
        @click="viewClientDetail(client)"
      >
        <div class="client-avatar">
          {{ client.name.charAt(0) }}
        </div>
        <div class="client-info">
          <div class="client-header">
            <span class="client-name">{{ client.name }}</span>
            <span class="client-level" :class="client.level">{{ client.level }}</span>
          </div>
          <div class="client-phone">{{ client.phone }}</div>
          <div class="client-stats">
            <span>消费 {{ client.totalVisits }} 次</span>
            <span>¥{{ client.totalSpent }}</span>
          </div>
          <div class="client-tags" v-if="client.tags.length">
            <span v-for="tag in client.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        <div class="client-actions" @click.stop>
          <button class="btn-icon" @click="editClient(client)">✏️</button>
          <button class="btn-icon" @click="deleteClient(client.id)">🗑️</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑客户弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingId ? '编辑客户' : '添加客户' }}</h2>
        <form @submit.prevent="saveClient">
          <div class="form-group">
            <label>客户姓名</label>
            <input v-model="form.name" type="text" required placeholder="输入客户姓名" />
          </div>
          <div class="form-group">
            <label>联系电话</label>
            <input v-model="form.phone" type="tel" required placeholder="输入联系电话" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>客户等级</label>
              <select v-model="form.level" required>
                <option value="普通">普通</option>
                <option value="VIP">VIP</option>
                <option value="SVIP">SVIP</option>
              </select>
            </div>
            <div class="form-group">
              <label>生日</label>
              <input v-model="form.birthday" type="date" />
            </div>
          </div>
          <div class="form-group">
            <label>标签（用逗号分隔）</label>
            <input v-model="form.tagsInput" type="text" placeholder="例如：敏感肌,喜欢自然妆" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="form.notes" rows="3" placeholder="客户偏好、过敏史等..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 客户详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal detail-modal">
        <div class="detail-header">
          <div class="detail-avatar">{{ selectedClient?.name.charAt(0) }}</div>
          <div class="detail-title">
            <h2>{{ selectedClient?.name }}</h2>
            <span class="detail-level" :class="selectedClient?.level">{{ selectedClient?.level }}</span>
          </div>
          <button class="btn-close" @click="closeDetailModal">×</button>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-info">
              <div class="info-item">
                <span class="label">电话</span>
                <span class="value">{{ selectedClient?.phone }}</span>
              </div>
              <div class="info-item">
                <span class="label">生日</span>
                <span class="value">{{ selectedClient?.birthday || '未设置' }}</span>
              </div>
              <div class="info-item">
                <span class="label">注册时间</span>
                <span class="value">{{ selectedClient?.createdAt }}</span>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <h3>消费记录</h3>
            <div class="consumption-stats">
              <div class="stat-item">
                <span class="stat-num">{{ selectedClient?.totalVisits }}</span>
                <span class="stat-label">消费次数</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">¥{{ selectedClient?.totalSpent }}</span>
                <span class="stat-label">累计消费</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">¥{{ selectedClient?.avgSpent }}</span>
                <span class="stat-label">平均客单价</span>
              </div>
            </div>
          </div>
          <div class="detail-section" v-if="selectedClient?.tags.length">
            <h3>标签</h3>
            <div class="detail-tags">
              <span v-for="tag in selectedClient?.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="detail-section" v-if="selectedClient?.notes">
            <h3>备注</h3>
            <p class="detail-notes">{{ selectedClient?.notes }}</p>
          </div>
          <div class="detail-section">
            <h3>最近预约</h3>
            <div class="recent-appointments">
              <div v-for="apt in clientAppointments" :key="apt.id" class="apt-item">
                <span class="apt-date">{{ apt.date }} {{ apt.time }}</span>
                <span class="apt-service">{{ apt.service }}</span>
                <span class="apt-price">¥{{ apt.price }}</span>
              </div>
              <div v-if="!clientAppointments.length" class="empty-text">暂无预约记录</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Client {
  id: string
  name: string
  phone: string
  level: '普通' | 'VIP' | 'SVIP'
  birthday: string
  tags: string[]
  notes: string
  totalVisits: number
  totalSpent: number
  avgSpent: number
  createdAt: string
}

interface Appointment {
  id: string
  clientName: string
  date: string
  time: string
  service: string
  price: number
  status: string
}

const clients = ref<Client[]>([])
const appointments = ref<Appointment[]>([])
const searchQuery = ref('')
const filterLevel = ref('')
const showAddModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref<string | null>(null)
const selectedClient = ref<Client | null>(null)

const form = ref({
  name: '',
  phone: '',
  level: '普通' as const,
  birthday: '',
  tagsInput: '',
  notes: ''
})

// 从 localStorage 加载数据
onMounted(() => {
  const savedClients = localStorage.getItem('makeup_clients')
  const savedAppointments = localStorage.getItem('makeup_appointments')

  if (savedClients) {
    clients.value = JSON.parse(savedClients)
  } else {
    // 初始化示例数据
    clients.value = [
      {
        id: '1',
        name: '张女士',
        phone: '138****1234',
        level: 'VIP',
        birthday: '1990-05-20',
        tags: ['新娘妆', '敏感肌'],
        notes: '喜欢自然妆容，对粉底液过敏',
        totalVisits: 8,
        totalSpent: 3520,
        avgSpent: 440,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        name: '李小姐',
        phone: '139****5678',
        level: '普通',
        birthday: '',
        tags: ['日常妆'],
        notes: '',
        totalVisits: 3,
        totalSpent: 384,
        avgSpent: 128,
        createdAt: '2024-03-10'
      },
      {
        id: '3',
        name: '王女士',
        phone: '136****9012',
        level: 'SVIP',
        birthday: '1985-12-08',
        tags: ['晚宴妆', '舞台妆'],
        notes: '经常参加晚会，需要浓妆',
        totalVisits: 15,
        totalSpent: 8750,
        avgSpent: 583,
        createdAt: '2023-08-20'
      }
    ]
    saveClients()
  }

  if (savedAppointments) {
    appointments.value = JSON.parse(savedAppointments)
  }
})

// 保存客户数据
function saveClients() {
  localStorage.setItem('makeup_clients', JSON.stringify(clients.value))
}

// 统计计算
const vipCount = computed(() => clients.value.filter(c => c.level === 'VIP' || c.level === 'SVIP').length)
const newThisMonth = computed(() => {
  const thisMonth = new Date().toISOString().slice(0, 7)
  return clients.value.filter(c => c.createdAt.startsWith(thisMonth)).length
})
const avgConsumption = computed(() => {
  if (clients.value.length === 0) return 0
  const total = clients.value.reduce((sum, c) => sum + c.totalSpent, 0)
  return Math.round(total / clients.value.length)
})

// 筛选后的客户列表
const filteredClients = computed(() => {
  let result = clients.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.notes.toLowerCase().includes(query)
    )
  }

  if (filterLevel.value) {
    result = result.filter(c => c.level === filterLevel.value)
  }

  return result.sort((a, b) => b.totalSpent - a.totalSpent)
})

// 客户的预约记录
const clientAppointments = computed(() => {
  if (!selectedClient.value) return []
  return appointments.value
    .filter(a => a.clientName === selectedClient.value?.name)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

// 操作方法
function viewClientDetail(client: Client) {
  selectedClient.value = client
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedClient.value = null
}

function editClient(client: Client) {
  editingId.value = client.id
  form.value = {
    name: client.name,
    phone: client.phone,
    level: client.level,
    birthday: client.birthday,
    tagsInput: client.tags.join(','),
    notes: client.notes
  }
  showAddModal.value = true
}

function deleteClient(id: string) {
  if (confirm('确定要删除这个客户吗？')) {
    clients.value = clients.value.filter(c => c.id !== id)
    saveClients()
  }
}

function closeModal() {
  showAddModal.value = false
  editingId.value = null
  form.value = {
    name: '',
    phone: '',
    level: '普通',
    birthday: '',
    tagsInput: '',
    notes: ''
  }
}

function saveClient() {
  const tags = form.value.tagsInput.split(',').map(t => t.trim()).filter(Boolean)

  if (editingId.value) {
    const index = clients.value.findIndex(c => c.id === editingId.value)
    if (index !== -1) {
      clients.value[index] = {
        ...clients.value[index],
        name: form.value.name,
        phone: form.value.phone,
        level: form.value.level,
        birthday: form.value.birthday,
        tags,
        notes: form.value.notes
      }
    }
  } else {
    const newClient: Client = {
      id: Date.now().toString(),
      name: form.value.name,
      phone: form.value.phone,
      level: form.value.level,
      birthday: form.value.birthday,
      tags,
      notes: form.value.notes,
      totalVisits: 0,
      totalSpent: 0,
      avgSpent: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    clients.value.push(newClient)
  }
  saveClients()
  closeModal()
}
</script>

<style scoped>
.clients-page {
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

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.search-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.filter-select {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  min-width: 120px;
}

/* 客户列表 */
.clients-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.client-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: var(--transition-normal);
}

.client-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.client-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.client-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.client-level {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.client-level.普通 {
  background: #e5e7eb;
  color: #374151;
}

.client-level.VIP {
  background: #dbeafe;
  color: #1e40af;
}

.client-level.SVIP {
  background: #fef3c7;
  color: #92400e;
}

.client-phone {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.client-stats {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.client-tags {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
  flex-wrap: wrap;
}

.tag {
  padding: var(--space-1) var(--space-2);
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.client-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-icon:hover {
  background: var(--bg-primary);
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
  padding: var(--space-4);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
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

/* 详情弹窗 */
.detail-modal {
  max-width: 600px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.detail-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.detail-title {
  flex: 1;
}

.detail-title h2 {
  margin: 0 0 var(--space-2) 0;
}

.detail-level {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.detail-level.普通 {
  background: #e5e7eb;
  color: #374151;
}

.detail-level.VIP {
  background: #dbeafe;
  color: #1e40af;
}

.detail-level.SVIP {
  background: #fef3c7;
  color: #92400e;
}

.btn-close {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-lg);
}

.btn-close:hover {
  background: var(--bg-secondary);
}

.detail-section {
  margin-bottom: var(--space-6);
}

.detail-section h3 {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-item .label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.info-item .value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.consumption-stats {
  display: flex;
  gap: var(--space-6);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stat-item .stat-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
}

.stat-item .stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.detail-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.detail-notes {
  color: var(--text-primary);
  line-height: 1.6;
}

.recent-appointments {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.apt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.apt-date {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.apt-service {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.apt-price {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
}

.empty-text {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--space-4);
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .client-card {
    flex-wrap: wrap;
  }

  .client-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .detail-info {
    grid-template-columns: 1fr;
  }

  .consumption-stats {
    flex-direction: column;
    gap: var(--space-3);
  }

  .apt-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>
