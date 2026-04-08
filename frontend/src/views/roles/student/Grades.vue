<template>
  <div class="grades-page">
    <div class="page-header">
      <h1>成绩管理</h1>
      <button class="btn-primary" @click="showAddModal = true">+ 添加成绩</button>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card gpa">
        <div class="stat-label">当前GPA</div>
        <div class="stat-value">{{ gpa }}</div>
        <div class="stat-sub">满分 4.0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均分</div>
        <div class="stat-value">{{ avgScore }}</div>
        <div class="stat-sub">{{ grades.length }} 门课程</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">最高分</div>
        <div class="stat-value">{{ maxScore }}</div>
        <div class="stat-sub">{{ maxScoreSubject }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">最低分</div>
        <div class="stat-value">{{ minScore }}</div>
        <div class="stat-sub">{{ minScoreSubject }}</div>
      </div>
    </div>

    <!-- 成绩图表 -->
    <div class="charts-section">
      <div class="chart-card">
        <h3>成绩分布</h3>
        <div class="grade-bars">
          <div v-for="range in scoreRanges" :key="range.label" class="grade-bar-item">
            <span class="bar-label">{{ range.label }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: range.percentage + '%', backgroundColor: range.color }"></div>
            </div>
            <span class="bar-count">{{ range.count }}</span>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <h3>科目成绩</h3>
        <div class="subject-scores">
          <div v-for="grade in grades" :key="grade.id" class="subject-item">
            <span class="subject-name">{{ grade.subject }}</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: grade.score + '%', backgroundColor: getScoreColor(grade.score) }"></div>
            </div>
            <span class="subject-score" :style="{ color: getScoreColor(grade.score) }">{{ grade.score }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成绩列表 -->
    <div class="grades-list">
      <h3>成绩明细</h3>
      <div class="list-header">
        <span>科目</span>
        <span>类型</span>
        <span>成绩</span>
        <span>绩点</span>
        <span>学期</span>
        <span>操作</span>
      </div>
      <div class="list-body">
        <div v-for="grade in sortedGrades" :key="grade.id" class="list-row">
          <span class="col-subject">{{ grade.subject }}</span>
          <span class="col-type">{{ grade.type }}</span>
          <span class="col-score" :style="{ color: getScoreColor(grade.score) }">{{ grade.score }}</span>
          <span class="col-gpa">{{ calculateGPA(grade.score) }}</span>
          <span class="col-term">{{ grade.term }}</span>
          <span class="col-actions">
            <button class="btn-edit" @click="editGrade(grade)">编辑</button>
            <button class="btn-delete" @click="deleteGrade(grade.id)">删除</button>
          </span>
        </div>
        <div v-if="grades.length === 0" class="empty-state">暂无成绩记录</div>
      </div>
    </div>

    <!-- 添加/编辑成绩弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editingId ? '编辑成绩' : '添加成绩' }}</h3>
        <form @submit.prevent="saveGrade">
          <div class="form-row">
            <div class="form-group">
              <label>科目</label>
              <select v-model="form.subject" required>
                <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>考试类型</label>
              <select v-model="form.type" required>
                <option value="期中考试">期中考试</option>
                <option value="期末考试">期末考试</option>
                <option value="平时成绩">平时成绩</option>
                <option value="总评成绩">总评成绩</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>成绩</label>
              <input v-model.number="form.score" type="number" required min="0" max="100" placeholder="0-100" />
            </div>
            <div class="form-group">
              <label>学分</label>
              <input v-model.number="form.credits" type="number" required min="0.5" max="10" step="0.5" placeholder="学分" />
            </div>
          </div>
          <div class="form-group">
            <label>学期</label>
            <select v-model="form.term" required>
              <option value="2024-2025-1">2024-2025学年 第一学期</option>
              <option value="2024-2025-2">2024-2025学年 第二学期</option>
              <option value="2023-2024-1">2023-2024学年 第一学期</option>
              <option value="2023-2024-2">2023-2024学年 第二学期</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <input v-model="form.notes" type="text" placeholder="可选" />
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

interface Grade {
  id: string
  subject: string
  type: string
  score: number
  credits: number
  term: string
  notes: string
}

const subjects = ['高等数学', '大学英语', '计算机基础', '线性代数', '大学物理', '程序设计', '数据结构', '操作系统', '计算机网络']

const grades = ref<Grade[]>([])
const showAddModal = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  subject: subjects[0],
  type: '期末考试',
  score: 85,
  credits: 3,
  term: '2024-2025-1',
  notes: ''
})

// 计算GPA (4.0制)
function calculateGPA(score: number): number {
  if (score >= 90) return 4.0
  if (score >= 85) return 3.7
  if (score >= 82) return 3.3
  if (score >= 78) return 3.0
  if (score >= 75) return 2.7
  if (score >= 72) return 2.3
  if (score >= 68) return 2.0
  if (score >= 64) return 1.5
  if (score >= 60) return 1.0
  return 0.0
}

// 统计
const gpa = computed(() => {
  if (grades.value.length === 0) return '0.00'
  const totalGPA = grades.value.reduce((sum, g) => sum + calculateGPA(g.score) * g.credits, 0)
  const totalCredits = grades.value.reduce((sum, g) => sum + g.credits, 0)
  return (totalGPA / totalCredits).toFixed(2)
})

const avgScore = computed(() => {
  if (grades.value.length === 0) return '-'
  const total = grades.value.reduce((sum, g) => sum + g.score, 0)
  return Math.round(total / grades.value.length)
})

const maxScore = computed(() => {
  if (grades.value.length === 0) return '-'
  return Math.max(...grades.value.map(g => g.score))
})

const maxScoreSubject = computed(() => {
  if (grades.value.length === 0) return ''
  const max = grades.value.reduce((prev, current) => (prev.score > current.score) ? prev : current)
  return max.subject
})

const minScore = computed(() => {
  if (grades.value.length === 0) return '-'
  return Math.min(...grades.value.map(g => g.score))
})

const minScoreSubject = computed(() => {
  if (grades.value.length === 0) return ''
  const min = grades.value.reduce((prev, current) => (prev.score < current.score) ? prev : current)
  return min.subject
})

// 成绩分布
const scoreRanges = computed(() => {
  const ranges = [
    { label: '90-100', min: 90, max: 100, count: 0, color: '#10b981' },
    { label: '80-89', min: 80, max: 89, count: 0, color: '#3b82f6' },
    { label: '70-79', min: 70, max: 79, count: 0, color: '#f59e0b' },
    { label: '60-69', min: 60, max: 69, count: 0, color: '#f97316' },
    { label: '0-59', min: 0, max: 59, count: 0, color: '#ef4444' }
  ]

  grades.value.forEach(g => {
    const range = ranges.find(r => g.score >= r.min && g.score <= r.max)
    if (range) range.count++
  })

  const maxCount = Math.max(...ranges.map(r => r.count), 1)
  ranges.forEach(r => {
    r.percentage = (r.count / maxCount) * 100
  })

  return ranges
})

const sortedGrades = computed(() => {
  return [...grades.value].sort((a, b) => b.score - a.score)
})

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 80) return '#3b82f6'
  if (score >= 70) return '#f59e0b'
  if (score >= 60) return '#f97316'
  return '#ef4444'
}

function editGrade(grade: Grade) {
  editingId.value = grade.id
  form.value = {
    subject: grade.subject,
    type: grade.type,
    score: grade.score,
    credits: grade.credits,
    term: grade.term,
    notes: grade.notes
  }
  showAddModal.value = true
}

function deleteGrade(id: string) {
  if (confirm('确定要删除这个成绩吗？')) {
    grades.value = grades.value.filter(g => g.id !== id)
    saveGrades()
  }
}

function closeModal() {
  showAddModal.value = false
  editingId.value = null
  form.value = {
    subject: subjects[0],
    type: '期末考试',
    score: 85,
    credits: 3,
    term: '2024-2025-1',
    notes: ''
  }
}

function saveGrade() {
  if (editingId.value) {
    const index = grades.value.findIndex(g => g.id === editingId.value)
    if (index !== -1) {
      grades.value[index] = { ...grades.value[index], ...form.value }
    }
  } else {
    const newGrade: Grade = {
      id: Date.now().toString(),
      ...form.value
    }
    grades.value.push(newGrade)
  }
  saveGrades()
  closeModal()
}

function saveGrades() {
  localStorage.setItem('student_grades', JSON.stringify(grades.value))
}

function loadGrades() {
  const saved = localStorage.getItem('student_grades')
  if (saved) {
    grades.value = JSON.parse(saved)
  } else {
    // 初始化示例数据
    grades.value = [
      { id: '1', subject: '高等数学', type: '期末考试', score: 92, credits: 4, term: '2024-2025-1', notes: '' },
      { id: '2', subject: '大学英语', type: '期末考试', score: 85, credits: 3, term: '2024-2025-1', notes: '' },
      { id: '3', subject: '计算机基础', type: '期末考试', score: 78, credits: 3, term: '2024-2025-1', notes: '' },
      { id: '4', subject: '线性代数', type: '期末考试', score: 88, credits: 3, term: '2024-2025-1', notes: '' },
      { id: '5', subject: '程序设计', type: '期末考试', score: 95, credits: 4, term: '2024-2025-1', notes: '' },
      { id: '6', subject: '大学物理', type: '期末考试', score: 72, credits: 3, term: '2024-2025-1', notes: '' }
    ]
    saveGrades()
  }
}

onMounted(() => {
  loadGrades()
})
</script>

<style scoped>
.grades-page {
  padding: var(--space-4);
  max-width: 1000px;
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

/* 统计概览 */
.stats-overview {
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

.stat-card.gpa {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
}

.stat-card.gpa .stat-label,
.stat-card.gpa .stat-sub {
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin: var(--space-2) 0;
}

.stat-card.gpa .stat-value {
  color: white;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.stat-sub {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.chart-card h3 {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

/* 成绩分布 */
.grade-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.grade-bar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bar-label {
  width: 60px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.bar-track {
  flex: 1;
  height: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.bar-count {
  width: 30px;
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 科目成绩 */
.subject-scores {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.subject-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.subject-name {
  width: 100px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-bar {
  flex: 1;
  height: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.subject-score {
  width: 40px;
  text-align: right;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

/* 成绩列表 */
.grades-list {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.grades-list h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr 120px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.list-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 2fr 120px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  align-items: center;
  font-size: var(--font-size-sm);
}

.col-subject {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.col-type,
.col-term {
  color: var(--text-secondary);
}

.col-score {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

.col-gpa {
  color: var(--text-secondary);
}

.col-actions {
  display: flex;
  gap: var(--space-2);
}

.col-actions button {
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
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
  max-width: 450px;
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
.form-group select {
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
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .list-header,
  .list-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-2);
  }

  .col-term,
  .col-gpa {
    display: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
