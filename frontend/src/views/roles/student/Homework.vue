<template>
  <div class="homework-page">
    <div class="page-header">
      <h1>作业管理</h1>
      <button class="btn-primary" @click="showAddModal = true">+ 添加作业</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ pendingCount }}</div>
        <div class="stat-label">待完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ todayCount }}</div>
        <div class="stat-label">今日截止</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ weekCount }}</div>
        <div class="stat-label">本周截止</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ completedCount }}</div>
        <div class="stat-label">已完成</div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-bar">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="filter-btn"
        :class="{ active: currentFilter === filter.value }"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- 作业列表 -->
    <div class="homework-list">
      <div
        v-for="hw in filteredHomework"
        :key="hw.id"
        class="homework-card"
        :class="{ completed: hw.status === 'completed', urgent: isUrgent(hw) }"
      >
        <div class="hw-header">
          <div class="hw-subject" :style="{ backgroundColor: hw.color }">{{ hw.subject }}</div>
          <div class="hw-deadline" :class="{ overdue: isOverdue(hw) }">
            {{ formatDeadline(hw.deadline) }}
          </div>
        </div>
        <div class="hw-content">
          <h3 class="hw-title">{{ hw.title }}</h3>
          <p class="hw-desc">{{ hw.description }}</p>
        </div>
        <div class="hw-footer">
          <div class="hw-meta">
            <span class="meta-item">{{ hw.type }}</span>
            <span v-if="hw.grade" class="meta-item grade">成绩: {{ hw.grade }}</span>
          </div>
          <div class="hw-actions">
            <button
              v-if="hw.status !== 'completed'"
              class="btn-complete"
              @click="completeHomework(hw.id)"
            >
              完成
            </button>
            <button class="btn-edit" @click="editHomework(hw)">编辑</button>
            <button class="btn-delete" @click="deleteHomework(hw.id)">删除</button>
          </div>
        </div>
      </div>
      <div v-if="filteredHomework.length === 0" class="empty-state">
        暂无作业
      </div>
    </div>

    <!-- 添加/编辑作业弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editingId ? '编辑作业' : '添加作业' }}</h3>
        <form @submit.prevent="saveHomework">
          <div class="form-group">
            <label>作业标题</label>
            <input v-model="form.title" type="text" required placeholder="输入作业标题" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>科目</label>
              <select v-model="form.subject" required>
                <option v-for="subject in subjects" :key="subject.name" :value="subject.name">
                  {{ subject.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>类型</label>
              <select v-model="form.type" required>
                <option value="个人作业">个人作业</option>
                <option value="小组作业">小组作业</option>
                <option value="实验报告">实验报告</option>
                <option value="论文">论文</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>截止时间</label>
            <input v-model="form.deadline" type="datetime-local" required />
          </div>
          <div class="form-group">
            <label>作业描述</label>
            <textarea v-model="form.description" rows="3" placeholder="作业要求、注意事项等..."></textarea>
          </div>
          <div class="form-group" v-if="editingId && form.status === 'completed'">
            <label>成绩</label>
            <input v-model="form.grade" type="text" placeholder="如：95分、A+" />
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

interface Homework {
  id: string
  title: string
  subject: string
  type: string
  description: string
  deadline: string
  status: 'pending' | 'completed'
  grade?: string
  color: string
  createdAt: string
}

const subjects = [
  { name: '高等数学', color: '#ff6b6b' },
  { name: '大学英语', color: '#4ecdc4' },
  { name: '计算机基础', color: '#45b7d1' },
  { name: '线性代数', color: '#96ceb4' },
  { name: '大学物理', color: '#ffeaa7' },
  { name: '程序设计', color: '#fd79a8' },
  { name: '数据结构', color: '#a29bfe' },
  { name: '其他', color: '#dfe6e9' }
]

const filters = [
  { label: '全部', value: 'all' },
  { label: '待完成', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '今日截止', value: 'today' },
  { label: '本周截止', value: 'week' }
]

const homework = ref<Homework[]>([])
const currentFilter = ref('all')
const showAddModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  title: '',
  subject: subjects[0].name,
  type: '个人作业',
  description: '',
  deadline: '',
  status: 'pending' as const,
  grade: ''
})

// 统计
const pendingCount = computed(() => homework.value.filter(h => h.status === 'pending').length)
const completedCount = computed(() => homework.value.filter(h => h.status === 'completed').length)

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return homework.value.filter(h => {
    if (h.status === 'completed') return false
    return h.deadline.startsWith(today)
  }).length
})

const weekCount = computed(() => {
  const now = new Date()
  const weekLater = new Date(now)
  weekLater.setDate(weekLater.getDate() + 7)
  return homework.value.filter(h => {
    if (h.status === 'completed') return false
    const deadline = new Date(h.deadline)
    return deadline >= now && deadline <= weekLater
  }).length
})

// 筛选
const filteredHomework = computed(() => {
  let result = homework.value

  switch (currentFilter.value) {
    case 'pending':
      result = result.filter(h => h.status === 'pending')
      break
    case 'completed':
      result = result.filter(h => h.status === 'completed')
      break
    case 'today':
      const today = new Date().toISOString().split('T')[0]
      result = result.filter(h => h.deadline.startsWith(today))
      break
    case 'week':
      const now = new Date()
      const weekLater = new Date(now)
      weekLater.setDate(weekLater.getDate() + 7)
      result = result.filter(h => {
        const deadline = new Date(h.deadline)
        return deadline >= now && deadline <= weekLater
      })
      break
  }

  // 按截止时间排序
  return result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
})

function getSubjectColor(subjectName: string): string {
  const subject = subjects.find(s => s.name === subjectName)
  return subject?.color || '#dfe6e9'
}

function isOverdue(hw: Homework): boolean {
  if (hw.status === 'completed') return false
  return new Date(hw.deadline) < new Date()
}

function isUrgent(hw: Homework): boolean {
  if (hw.status === 'completed') return false
  const deadline = new Date(hw.deadline)
  const now = new Date()
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursLeft <= 24 && hoursLeft > 0
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const deadlineDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `今天 ${timeStr}`
  if (diffDays === 1) return `明天 ${timeStr}`
  if (diffDays === -1) return `昨天 ${timeStr}`
  if (diffDays > 0) return `${diffDays}天后 ${timeStr}`
  return `${Math.abs(diffDays)}天前 ${timeStr}`
}

function completeHomework(id: string) {
  const hw = homework.value.find(h => h.id === id)
  if (hw) {
    hw.status = 'completed'
    saveHomework()
  }
}

function editHomework(hw: Homework) {
  editingId.value = hw.id
  form.value = {
    title: hw.title,
    subject: hw.subject,
    type: hw.type,
    description: hw.description,
    deadline: hw.deadline,
    status: hw.status,
    grade: hw.grade || ''
  }
  showAddModal.value = true
}

function deleteHomework(id: string) {
  if (confirm('确定要删除这个作业吗？')) {
    homework.value = homework.value.filter(h => h.id !== id)
    saveHomework()
  }
}

function closeModal() {
  showAddModal.value = false
  editingId.value = null
  form.value = {
    title: '',
    subject: subjects[0].name,
    type: '个人作业',
    description: '',
    deadline: '',
    status: 'pending',
    grade: ''
  }
}

function saveHomework() {
  const color = getSubjectColor(form.value.subject)

  if (editingId.value) {
    const index = homework.value.findIndex(h => h.id === editingId.value)
    if (index !== -1) {
      homework.value[index] = {
        ...homework.value[index],
        ...form.value,
        color
      }
    }
  } else {
    const newHomework: Homework = {
      id: Date.now().toString(),
      ...form.value,
      color,
      createdAt: new Date().toISOString()
    }
    homework.value.push(newHomework)
  }

  localStorage.setItem('student_homework', JSON.stringify(homework.value))
  closeModal()
}

function loadHomework() {
  const saved = localStorage.getItem('student_homework')
  if (saved) {
    homework.value = JSON.parse(saved)
  } else {
    // 初始化示例数据
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const threeDaysLater = new Date(now)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    homework.value = [
      {
        id: '1',
        title: '微积分习题集第3章',
        subject: '高等数学',
        type: '个人作业',
        description: '完成第3章所有习题，重点练习导数计算',
        deadline: tomorrow.toISOString().slice(0, 16),
        status: 'pending',
        color: '#ff6b6b',
        createdAt: now.toISOString()
      },
      {
        id: '2',
        title: '英语阅读理解',
        subject: '大学英语',
        type: '个人作业',
        description: '阅读Unit 4文章并完成课后练习',
        deadline: threeDaysLater.toISOString().slice(0, 16),
        status: 'pending',
        color: '#4ecdc4',
        createdAt: now.toISOString()
      },
      {
        id: '3',
        title: 'Python程序设计实验',
        subject: '程序设计',
        type: '实验报告',
        description: '完成实验3：函数与模块',
        deadline: now.toISOString().slice(0, 16),
        status: 'completed',
        grade: '95分',
        color: '#fd79a8',
        createdAt: now.toISOString()
      }
    ]
    localStorage.setItem('student_homework', JSON.stringify(homework.value))
  }
}

onMounted(() => {
  loadHomework()
})
</script>

<style scoped>
.homework-page {
  padding: var(--space-4);
  max-width: 900px;
  margin: 0 auto;
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
  cursor: pointer;
  font-weight: var(--font-weight-medium);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  text-align: center;
  box-shadow: var(--shadow-card);
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
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition-normal);
}

.filter-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 作业列表 */
.homework-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.homework-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.homework-card:hover {
  box-shadow: var(--shadow-hover);
}

.homework-card.completed {
  opacity: 0.7;
}

.homework-card.completed .hw-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.homework-card.urgent {
  border-left: 4px solid #ff4757;
}

.hw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.hw-subject {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: white;
  font-weight: var(--font-weight-medium);
}

.hw-deadline {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.hw-deadline.overdue {
  color: #ff4757;
  font-weight: var(--font-weight-bold);
}

.hw-content {
  margin-bottom: var(--space-3);
}

.hw-title {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.hw-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.hw-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-light);
}

.hw-meta {
  display: flex;
  gap: var(--space-3);
}

.meta-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.meta-item.grade {
  background: #d1fae5;
  color: #065f46;
}

.hw-actions {
  display: flex;
  gap: var(--space-2);
}

.hw-actions button {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-complete {
  background: #d1fae5;
  color: #065f46;
}

.btn-edit {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
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
}

.modal h3 {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--space-3);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.btn-secondary {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .hw-footer {
    flex-direction: column;
    gap: var(--space-2);
    align-items: flex-start;
  }
}
</style>
