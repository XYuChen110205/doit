<template>
  <div class="homework-page">
    <div class="page-header">
      <h1>作业管理</h1>
      <BaseButton @click="showAddModal = true">
        <SvgIcon name="Plus" :size="16" />
        添加作业
      </BaseButton>
    </div>

    <div class="stats-grid">
      <BaseCard>
        <div class="stat-content">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待完成</div>
        </div>
      </BaseCard>
      <BaseCard>
        <div class="stat-content">
          <div class="stat-value">{{ todayCount }}</div>
          <div class="stat-label">今日截止</div>
        </div>
      </BaseCard>
      <BaseCard>
        <div class="stat-content">
          <div class="stat-value">{{ weekCount }}</div>
          <div class="stat-label">本周截止</div>
        </div>
      </BaseCard>
      <BaseCard>
        <div class="stat-content">
          <div class="stat-value">{{ completedCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </BaseCard>
    </div>

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

    <div class="homework-list">
      <BaseCard
        v-for="hw in filteredHomework"
        :key="hw.id"
        hoverable
        :border-color="getBorderColor(hw)"
        :class="{ 'is-completed': hw.status === 'completed' }"
      >
        <div class="hw-header">
          <div class="hw-subject" :style="{ backgroundColor: hw.color }">
            {{ hw.subject }}
          </div>
          <div class="hw-deadline" :class="{ overdue: isOverdue(hw) }">
            {{ formatDeadline(hw.deadline) }}
          </div>
        </div>
        <div class="hw-content">
          <h3 class="hw-title">{{ hw.title }}</h3>
          <p v-if="hw.description" class="hw-desc">{{ hw.description }}</p>
        </div>
        <div class="hw-footer">
          <div class="hw-meta">
            <span class="meta-item">{{ hw.type }}</span>
            <span v-if="hw.grade" class="meta-item grade">
              {{ hw.grade }}
            </span>
          </div>
          <div class="hw-actions">
            <BaseButton
              v-if="hw.status !== 'completed'"
              variant="primary"
              size="sm"
              @click="completeHomework(hw.id)"
            >
              <SvgIcon name="Check" :size="14" />
              完成
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="editHomework(hw)">
              <SvgIcon name="Edit" :size="14" />
            </BaseButton>
            <BaseButton variant="danger" size="sm" @click="deleteHomework(hw.id)">
              <SvgIcon name="Trash" :size="14" />
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <div v-if="filteredHomework.length === 0" class="empty-state">
        <SvgIcon name="Task" :size="48" />
        <p>暂无作业</p>
      </div>
    </div>

    <BaseModal v-model="showAddModal" :title="editingId ? '编辑作业' : '添加作业'">
      <form @submit.prevent="saveHomework">
        <BaseInput
          v-model="form.title"
          label="作业标题"
          placeholder="输入作业标题"
          required
        />

        <div class="form-row">
          <div class="form-group">
            <label class="input-label">科目</label>
            <select v-model="form.subject" class="base-input">
              <option v-for="subject in subjects" :key="subject.name" :value="subject.name">
                {{ subject.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="input-label">类型</label>
            <select v-model="form.type" class="base-input">
              <option value="个人作业">个人作业</option>
              <option value="小组作业">小组作业</option>
              <option value="实验报告">实验报告</option>
              <option value="论文">论文</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        <BaseInput
          v-model="form.deadline"
          type="datetime-local"
          label="截止时间"
          required
        />

        <div class="form-group">
          <label class="input-label">作业描述</label>
          <textarea
            v-model="form.description"
            class="base-input textarea"
            rows="3"
            placeholder="作业要求、注意事项等..."
          ></textarea>
        </div>

        <BaseInput
          v-if="editingId && form.status === 'completed'"
          v-model="form.grade"
          label="成绩"
          placeholder="如：95分、A+"
        />

        <div class="form-actions">
          <BaseButton variant="secondary" type="button" @click="closeModal">
            取消
          </BaseButton>
          <BaseButton type="submit">
            保存
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BaseButton, BaseCard, BaseInput, BaseModal } from '@/components/base'
import SvgIcon from '@/components/icons/SvgIcon.vue'

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

  return result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
})

function getSubjectColor(subjectName: string): string {
  const subject = subjects.find(s => s.name === subjectName)
  return subject?.color || '#dfe6e9'
}

function getBorderColor(hw: Homework): string | undefined {
  if (hw.status === 'completed') return undefined
  if (isOverdue(hw)) return '#ff4757'
  if (isUrgent(hw)) return '#ffa502'
  return undefined
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-content {
  text-align: center;
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

.homework-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.is-completed {
  opacity: 0.7;
}

.is-completed .hw-title {
  text-decoration: line-through;
  color: var(--text-muted);
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
  margin: 0 0 var(--space-2);
}

.hw-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
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

.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.empty-state p {
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.form-group {
  margin-bottom: var(--space-3);
}

.input-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.base-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.base-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

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
