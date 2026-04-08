<template>
  <div class="staff-management">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ totalStaff }}</div>
        <div class="stat-label">总员工数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ onDutyStaff }}</div>
        <div class="stat-label">今日在岗</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgAttendance }}%</div>
        <div class="stat-label">出勤率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ newStaff }}</div>
        <div class="stat-label">本月新入职</div>
      </div>
    </div>

    <!-- 员工列表 -->
    <div class="staff-section">
      <div class="section-header">
        <div class="header-left">
          <h3>员工列表</h3>
          <div class="filter-tabs">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              class="tab-btn"
              :class="{ active: currentFilter === tab.value }"
              @click="currentFilter = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <button class="add-btn" @click="showAddModal = true">+ 添加员工</button>
      </div>

      <div class="staff-table">
        <div class="table-header">
          <span>员工信息</span>
          <span>职位</span>
          <span>联系方式</span>
          <span>入职时间</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div
          v-for="staff in filteredStaff"
          :key="staff.id"
          class="table-row"
        >
          <div class="staff-info">
            <div class="staff-avatar" :style="{ background: staff.color }">
              {{ staff.name.charAt(0) }}
            </div>
            <div class="staff-detail">
              <div class="staff-name">{{ staff.name }}</div>
              <div class="staff-id">ID: {{ staff.employeeId }}</div>
            </div>
          </div>
          <span class="staff-role">{{ staff.role }}</span>
          <span class="staff-contact">{{ staff.phone }}</span>
          <span class="staff-date">{{ staff.joinDate }}</span>
          <span class="staff-status" :class="staff.status">{{ staff.statusText }}</span>
          <div class="staff-actions">
            <button class="action-btn" @click="editStaff(staff)">编辑</button>
            <button class="action-btn danger" @click="deleteStaff(staff)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 排班表 -->
    <div class="schedule-section">
      <div class="section-header">
        <h3>本周排班</h3>
        <div class="week-nav">
          <button class="nav-btn" @click="prevWeek">&lt;</button>
          <span>{{ currentWeek }}</span>
          <button class="nav-btn" @click="nextWeek">&gt;</button>
        </div>
      </div>
      <div class="schedule-grid">
        <div class="schedule-header">
          <div class="time-slot">时间</div>
          <div v-for="day in weekDays" :key="day" class="day-header">{{ day }}</div>
        </div>
        <div
          v-for="slot in timeSlots"
          :key="slot"
          class="schedule-row"
        >
          <div class="time-label">{{ slot }}</div>
          <div
            v-for="(day, index) in weekDays"
            :key="day"
            class="schedule-cell"
          >
            <div
              v-for="staff in getScheduledStaff(slot, index)"
              :key="staff.id"
              class="scheduled-staff"
              :style="{ background: staff.color }"
            >
              {{ staff.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑员工弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingStaff ? '编辑员工' : '添加员工' }}</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>姓名</label>
            <input v-model="staffForm.name" type="text" placeholder="输入员工姓名" />
          </div>
          <div class="form-group">
            <label>职位</label>
            <select v-model="staffForm.role">
              <option value="店长">店长</option>
              <option value="副店长">副店长</option>
              <option value="咖啡师">咖啡师</option>
              <option value="服务员">服务员</option>
              <option value="收银员">收银员</option>
              <option value="保洁">保洁</option>
            </select>
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="staffForm.phone" type="text" placeholder="输入手机号" />
          </div>
          <div class="form-group">
            <label>入职日期</label>
            <input v-model="staffForm.joinDate" type="date" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn-primary" @click="saveStaff">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 统计数据
const totalStaff = ref(8)
const onDutyStaff = ref(5)
const avgAttendance = ref(95)
const newStaff = ref(1)

// 筛选
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '在岗', value: 'active' },
  { label: '休息', value: 'rest' },
  { label: '离职', value: 'inactive' }
]
const currentFilter = ref('all')

// 员工列表
const staffList = ref([
  { id: 1, name: '小王', employeeId: 'E001', role: '店长', phone: '138****8888', joinDate: '2023-01-15', status: 'active', statusText: '在岗', color: '#667eea' },
  { id: 2, name: '小李', employeeId: 'E002', role: '咖啡师', phone: '139****6666', joinDate: '2023-03-20', status: 'active', statusText: '在岗', color: '#f093fb' },
  { id: 3, name: '小张', employeeId: 'E003', role: '服务员', phone: '137****5555', joinDate: '2023-06-10', status: 'active', statusText: '在岗', color: '#4facfe' },
  { id: 4, name: '小陈', employeeId: 'E004', role: '咖啡师', phone: '136****4444', joinDate: '2023-08-05', status: 'rest', statusText: '休息', color: '#43e97b' },
  { id: 5, name: '小刘', employeeId: 'E005', role: '服务员', phone: '135****3333', joinDate: '2024-01-10', status: 'rest', statusText: '休息', color: '#fa709a' },
  { id: 6, name: '小赵', employeeId: 'E006', role: '收银员', phone: '134****2222', joinDate: '2024-02-15', status: 'active', statusText: '在岗', color: '#feca57' },
  { id: 7, name: '小钱', employeeId: 'E007', role: '保洁', phone: '133****1111', joinDate: '2024-03-01', status: 'active', statusText: '在岗', color: '#48dbfb' },
  { id: 8, name: '小孙', employeeId: 'E008', role: '服务员', phone: '132****0000', joinDate: '2024-04-01', status: 'inactive', statusText: '离职', color: '#ff9ff3' }
])

const filteredStaff = computed(() => {
  if (currentFilter.value === 'all') return staffList.value
  return staffList.value.filter(s => s.status === currentFilter.value)
})

// 排班
const currentWeek = ref('4月1日 - 4月7日')
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const timeSlots = ['08:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00']

const scheduleData = ref([
  { slot: '08:00-12:00', day: 0, staff: [{ name: '小王', color: '#667eea' }, { name: '小李', color: '#f093fb' }] },
  { slot: '08:00-12:00', day: 1, staff: [{ name: '小王', color: '#667eea' }, { name: '小张', color: '#4facfe' }] },
  { slot: '12:00-16:00', day: 0, staff: [{ name: '小张', color: '#4facfe' }, { name: '小赵', color: '#feca57' }] }
])

function getScheduledStaff(slot: string, day: number) {
  const schedule = scheduleData.value.find(s => s.slot === slot && s.day === day)
  return schedule?.staff || []
}

function prevWeek() {
  alert('切换到上一周')
}

function nextWeek() {
  alert('切换到下一周')
}

// 添加/编辑员工
const showAddModal = ref(false)
const editingStaff = ref<typeof staffList.value[0] | null>(null)
const staffForm = ref({
  name: '',
  role: '服务员',
  phone: '',
  joinDate: ''
})

function editStaff(staff: typeof staffList.value[0]) {
  editingStaff.value = staff
  staffForm.value = {
    name: staff.name,
    role: staff.role,
    phone: staff.phone,
    joinDate: staff.joinDate
  }
  showAddModal.value = true
}

function deleteStaff(staff: typeof staffList.value[0]) {
  if (confirm(`确定要删除员工 ${staff.name} 吗？`)) {
    const index = staffList.value.findIndex(s => s.id === staff.id)
    if (index > -1) {
      staffList.value.splice(index, 1)
    }
  }
}

function saveStaff() {
  if (editingStaff.value) {
    editingStaff.value.name = staffForm.value.name
    editingStaff.value.role = staffForm.value.role
    editingStaff.value.phone = staffForm.value.phone
    editingStaff.value.joinDate = staffForm.value.joinDate
  } else {
    staffList.value.push({
      id: Date.now(),
      name: staffForm.value.name,
      employeeId: `E${String(staffList.value.length + 1).padStart(3, '0')}`,
      role: staffForm.value.role,
      phone: staffForm.value.phone,
      joinDate: staffForm.value.joinDate,
      status: 'active',
      statusText: '在岗',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    })
  }
  showAddModal.value = false
  editingStaff.value = null
  staffForm.value = { name: '', role: '服务员', phone: '', joinDate: '' }
}
</script>

<style scoped>
.staff-management {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 员工列表 */
.staff-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.section-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.filter-tabs {
  display: flex;
  gap: var(--space-1);
}

.tab-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.add-btn {
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

.add-btn:hover {
  background: var(--accent-primary-hover);
}

/* 表格 */
.staff-table {
  display: flex;
  flex-direction: column;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 120px;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
}

.table-header {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.table-row {
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border);
}

.table-row:last-child {
  border-bottom: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.staff-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.staff-avatar {
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

.staff-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.staff-id {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.staff-role,
.staff-contact,
.staff-date {
  color: var(--text-secondary);
}

.staff-status {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-align: center;
  width: fit-content;
}

.staff-status.active {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.staff-status.rest {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
}

.staff-status.inactive {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.staff-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
  background: var(--accent-primary-bg);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.action-btn.danger {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}

/* 排班表 */
.schedule-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.week-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.nav-btn:hover {
  color: var(--text-primary);
}

.schedule-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.schedule-header,
.schedule-row {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
}

.schedule-header {
  background: var(--bg-primary);
}

.time-slot,
.day-header,
.time-label,
.schedule-cell {
  padding: var(--space-3);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.time-slot,
.time-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.day-header {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-align: center;
}

.schedule-cell {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.scheduled-staff {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  color: var(--text-inverse);
  border-radius: var(--radius-sm);
  text-align: center;
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
}

@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-header,
  .table-row {
    grid-template-columns: 2fr 1fr 1fr 80px;
  }

  .table-header span:nth-child(3),
  .table-header span:nth-child(4),
  .staff-contact,
  .staff-date {
    display: none;
  }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .schedule-header,
  .schedule-row {
    grid-template-columns: 80px repeat(7, 1fr);
  }
}
</style>
