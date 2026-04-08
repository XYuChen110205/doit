<template>
  <div class="exams-page">
    <div class="page-header">
      <h1>考试管理</h1>
      <button class="btn-primary" @click="showAddModal = true">+ 添加考试</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ upcomingCount }}</div>
        <div class="stat-label">即将考试</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ thisWeekCount }}</div>
        <div class="stat-label">本周考试</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ completedCount }}</div>
        <div class="stat-label">已结束</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgScore }}</div>
        <div class="stat-label">平均分</div>
      </div>
    </div>

    <!-- 考试列表 -->
    <div class="exams-list">
      <div class="list-section">
        <h3>即将考试</h3>
        <div class="exam-cards">
          <div
            v-for="exam in upcomingExams"
            :key="exam.id"
            class="exam-card"
            :class="{ urgent: isUrgent(exam) }"
          >
            <div class="exam-date">
              <div class="date-day">{{ formatDay(exam.date) }}</div>
              <div class="date-month">{{ formatMonth(exam.date) }}</div>
            </div>
            <div class="exam-info">
              <h4 class="exam-name">{{ exam.name }}</h4>
              <div class="exam-meta">
                <span class="meta-tag" :style="{ backgroundColor: getSubjectColor(exam.subject) }">
                  {{ exam.subject }}
                </span>
                <span class="meta-time">{{ exam.time }}</span>
                <span class="meta-location">{{ exam.location }}</span>
              </div>
              <div class="exam-countdown" v-if="!exam.isCompleted">
                {{ getCountdown(exam.date) }}
              </div>
            </div>
            <div class="exam-actions">
              <button v-if="!exam.isCompleted" class="btn-enter" @click="enterExam(exam)">
                进入倒计时
              </button>
              <button class="btn-edit" @click="editExam(exam)">编辑</button>
              <button class="btn-delete" @click="deleteExam(exam.id)">删除</button>
            </div>
          </div>
          <div v-if="upcomingExams.length === 0" class="empty-state">暂无即将开始的考试</div>
        </div>
      </div>

      <div class="list-section">
        <h3>已结束</h3>
        <div class="exam-cards completed">
          <div
            v-for="exam in completedExams"
            :key="exam.id"
            class="exam-card completed"
          >
            <div class="exam-date">
              <div class="date-day">{{ formatDay(exam.date) }}</div>
              <div class="date-month">{{ formatMonth(exam.date) }}</div>
            </div>
            <div class="exam-info">
              <h4 class="exam-name">{{ exam.name }}</h4>
              <div class="exam-meta">
                <span class="meta-tag" :style="{ backgroundColor: getSubjectColor(exam.subject) }">
                  {{ exam.subject }}
                </span>
              </div>
              <div class="exam-score" v-if="exam.score">
                成绩: <span class="score-value">{{ exam.score }}分</span>
              </div>
            </div>
            <div class="exam-actions">
              <button class="btn-edit" @click="editExam(exam)">编辑</button>
              <button class="btn-delete" @click="deleteExam(exam.id)">删除</button>
            </div>
          </div>
          <div v-if="completedExams.length === 0" class="empty-state">暂无已结束的考试</div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑考试弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editingId ? '编辑考试' : '添加考试' }}</h3>
        <form @submit.prevent="saveExam">
          <div class="form-group">
            <label>考试名称</label>
            <input v-model="form.name" type="text" required placeholder="如：期中考试" />
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
              <label>考试类型</label>
              <select v-model="form.type" required>
                <option value="期中考试">期中考试</option>
                <option value="期末考试">期末考试</option>
                <option value="月考">月考</option>
                <option value="模拟考">模拟考</option>
                <option value="补考">补考</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>考试日期</label>
              <input v-model="form.date" type="date" required />
            </div>
            <div class="form-group">
              <label>考试时间</label>
              <input v-model="form.time" type="time" required />
            </div>
          </div>
          <div class="form-group">
            <label>考试地点</label>
            <input v-model="form.location" type="text" placeholder="如：第一教学楼 301" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="form.notes" rows="2" placeholder="考试范围、注意事项等..."></textarea>
          </div>
          <div class="form-group" v-if="editingId">
            <label>
              <input v-model="form.isCompleted" type="checkbox" />
              已结束
            </label>
          </div>
          <div class="form-group" v-if="form.isCompleted">
            <label>成绩</label>
            <input v-model="form.score" type="number" placeholder="输入成绩" min="0" max="100" />
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

interface Exam {
  id: string
  name: string
  subject: string
  type: string
  date: string
  time: string
  location: string
  notes: string
  isCompleted: boolean
  score?: number
}

const subjects = [
  { name: '高等数学', color: '#ff6b6b' },
  { name: '大学英语', color: '#4ecdc4' },
  { name: '计算机基础', color: '#45b7d1' },
  { name: '线性代数', color: '#96ceb4' },
  { name: '大学物理', color: '#ffeaa7' },
  { name: '程序设计', color: '#fd79a8' },
  { name: '数据结构', color: '#a29bfe' }
]

const exams = ref<Exam[]>([])
const showAddModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  name: '',
  subject: subjects[0].name,
  type: '期中考试',
  date: '',
  time: '09:00',
  location: '',
  notes: '',
  isCompleted: false,
  score: ''
})

// 统计
const upcomingCount = computed(() => exams.value.filter(e => !e.isCompleted).length)
const completedCount = computed(() => exams.value.filter(e => e.isCompleted).length)

const thisWeekCount = computed(() => {
  const now = new Date()
  const weekLater = new Date(now)
  weekLater.setDate(weekLater.getDate() + 7)
  return exams.value.filter(e => {
    if (e.isCompleted) return false
    const examDate = new Date(e.date)
    return examDate >= now && examDate <= weekLater
  }).length
})

const avgScore = computed(() => {
  const completed = exams.value.filter(e => e.isCompleted && e.score)
  if (completed.length === 0) return '-'
  const total = completed.reduce((sum, e) => sum + (e.score || 0), 0)
  return Math.round(total / completed.length)
})

// 筛选
const upcomingExams = computed(() => {
  return exams.value
    .filter(e => !e.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const completedExams = computed(() => {
  return exams.value
    .filter(e => e.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function getSubjectColor(subjectName: string): string {
  const subject = subjects.find(s => s.name === subjectName)
  return subject?.color || '#dfe6e9'
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString().padStart(2, '0')
}

function formatMonth(dateStr: string): string {
  return (new Date(dateStr).getMonth() + 1) + '月'
}

function getCountdown(dateStr: string): string {
  const examDate = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天考试'
  if (diffDays === 1) return '明天考试'
  if (diffDays < 0) return '已结束'
  return `还有 ${diffDays} 天`
}

function isUrgent(exam: Exam): boolean {
  const examDate = new Date(exam.date)
  const now = new Date()
  const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 3 && diffDays > 0
}

function enterExam(exam: Exam) {
  alert(`进入 ${exam.name} 倒计时模式`)
}

function editExam(exam: Exam) {
  editingId.value = exam.id
  form.value = {
    name: exam.name,
    subject: exam.subject,
    type: exam.type,
    date: exam.date,
    time: exam.time,
    location: exam.location,
    notes: exam.notes,
    isCompleted: exam.isCompleted,
    score: exam.score?.toString() || ''
  }
  showAddModal.value = true
}

function deleteExam(id: string) {
  if (confirm('确定要删除这个考试吗？')) {
    exams.value = exams.value.filter(e => e.id !== id)
    saveExams()
  }
}

function closeModal() {
  showAddModal.value = false
  editingId.value = null
  form.value = {
    name: '',
    subject: subjects[0].name,
    type: '期中考试',
    date: '',
    time: '09:00',
    location: '',
    notes: '',
    isCompleted: false,
    score: ''
  }
}

function saveExam() {
  const examData = {
    name: form.value.name,
    subject: form.value.subject,
    type: form.value.type,
    date: form.value.date,
    time: form.value.time,
    location: form.value.location,
    notes: form.value.notes,
    isCompleted: form.value.isCompleted,
    score: form.value.score ? Number(form.value.score) : undefined
  }

  if (editingId.value) {
    const index = exams.value.findIndex(e => e.id === editingId.value)
    if (index !== -1) {
      exams.value[index] = { ...exams.value[index], ...examData }
    }
  } else {
    const newExam: Exam = {
      id: Date.now().toString(),
      ...examData
    }
    exams.value.push(newExam)
  }

  saveExams()
  closeModal()
}

function saveExams() {
  localStorage.setItem('student_exams', JSON.stringify(exams.value))
}

function loadExams() {
  const saved = localStorage.getItem('student_exams')
  if (saved) {
    exams.value = JSON.parse(saved)
  } else {
    // 初始化示例数据
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const lastWeek = new Date(now)
    lastWeek.setDate(lastWeek.getDate() - 7)

    exams.value = [
      {
        id: '1',
        name: '高等数学期中考试',
        subject: '高等数学',
        type: '期中考试',
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00',
        location: '第一教学楼 301',
        notes: '范围：第1-5章',
        isCompleted: false
      },
      {
        id: '2',
        name: '大学英语期末考试',
        subject: '大学英语',
        type: '期末考试',
        date: nextWeek.toISOString().split('T')[0],
        time: '14:00',
        location: '外语楼 205',
        notes: '听力+笔试',
        isCompleted: false
      },
      {
        id: '3',
        name: '程序设计月考',
        subject: '程序设计',
        type: '月考',
        date: lastWeek.toISOString().split('T')[0],
        time: '10:00',
        location: '计算机楼 Lab-2',
        notes: '上机考试',
        isCompleted: true,
        score: 88
      }
    ]
    saveExams()
  }
}

onMounted(() => {
  loadExams()
})
</script>

<style scoped>
.exams-page {
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

/* 考试列表 */
.exams-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.list-section h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  padding-left: var(--space-2);
  border-left: 4px solid var(--accent-primary);
}

.exam-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.exam-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.exam-card:hover {
  box-shadow: var(--shadow-hover);
}

.exam-card.urgent {
  border-left: 4px solid #ff4757;
}

.exam-card.completed {
  opacity: 0.7;
}

.exam-date {
  width: 60px;
  height: 60px;
  background: var(--accent-primary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.exam-card.completed .exam-date {
  background: var(--text-muted);
}

.date-day {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.date-month {
  font-size: var(--font-size-xs);
}

.exam-info {
  flex: 1;
}

.exam-name {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.exam-meta {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-2);
}

.meta-tag {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: white;
}

.meta-time,
.meta-location {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.exam-countdown {
  font-size: var(--font-size-sm);
  color: #ff4757;
  font-weight: var(--font-weight-medium);
}

.exam-score {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.score-value {
  color: var(--accent-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

.exam-actions {
  display: flex;
  gap: var(--space-2);
}

.exam-actions button {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-enter {
  background: var(--accent-primary);
  color: white;
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

  .exam-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .exam-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
