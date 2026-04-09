<template>
  <div class="boss-tasks">
    <div class="page-header">
      <div class="header-title">
        <h1>📝 老板交代的任务</h1>
        <p class="subtitle">记录老板临时交代的任务和重要信息</p>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <span class="icon">+</span>
        记录新任务
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-bar">
      <div class="stat-card urgent">
        <div class="stat-num">{{ urgentCount }}</div>
        <div class="stat-label">紧急任务</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-num">{{ pendingCount }}</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-num">{{ completedCount }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card total">
        <div class="stat-num">{{ tasks.length }}</div>
        <div class="stat-label">总计</div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button 
        v-for="tab in filterTabs" 
        :key="tab.value"
        class="tab-btn"
        :class="{ active: currentFilter === tab.value }"
        @click="currentFilter = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-list">
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无{{ currentFilter === 'all' ? '' : filterTabs.find(t => t.value === currentFilter)?.label }}任务</p>
        <button class="btn-secondary" @click="showAddModal = true">记录第一个任务</button>
      </div>

      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        class="task-card"
        :class="[task.priority, task.status]"
      >
        <div class="task-header">
          <div class="task-badges">
            <span class="badge priority" :class="task.priority">
              {{ priorityText[task.priority] }}
            </span>
            <span class="badge status" :class="task.status">
              {{ statusText[task.status] }}
            </span>
            <span v-if="isOverdue(task)" class="badge overdue">已逾期</span>
          </div>
          <div class="task-actions">
            <button 
              v-if="task.status !== 'completed'"
              class="btn-icon complete"
              @click="completeTask(task)"
              title="标记完成"
            >
              ✓
            </button>
            <button 
              v-else
              class="btn-icon undo"
              @click="reopenTask(task)"
              title="重新打开"
            >
              ↺
            </button>
            <button class="btn-icon edit" @click="editTask(task)" title="编辑">
              ✎
            </button>
            <button class="btn-icon delete" @click="deleteTask(task.id)" title="删除">
              🗑
            </button>
          </div>
        </div>

        <div class="task-content">
          <h3 class="task-title">{{ task.title }}</h3>
          <p v-if="task.description" class="task-desc">{{ task.description }}</p>
          
          <div class="task-meta">
            <div class="meta-item">
              <span class="meta-label">👤 交代人：</span>
              <span class="meta-value">{{ task.assigner || '老板' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">⏰ 交代时间：</span>
              <span class="meta-value">{{ formatTime(task.createdAt) }}</span>
            </div>
            <div v-if="task.deadline" class="meta-item">
              <span class="meta-label">📅 截止日期：</span>
              <span class="meta-value" :class="{ overdue: isOverdue(task) }">
                {{ formatDate(task.deadline) }}
              </span>
            </div>
            <div v-if="task.completedAt" class="meta-item">
              <span class="meta-label">✅ 完成时间：</span>
              <span class="meta-value completed">{{ formatTime(task.completedAt) }}</span>
            </div>
          </div>

          <div v-if="task.tags && task.tags.length > 0" class="task-tags">
            <span v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingTask ? '编辑任务' : '记录老板交代的任务' }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="saveTask">
          <div class="form-group">
            <label>任务内容 <span class="required">*</span></label>
            <input 
              v-model="form.title" 
              type="text" 
              required
              placeholder="老板交代了什么任务？"
            />
          </div>

          <div class="form-group">
            <label>详细说明</label>
            <textarea 
              v-model="form.description" 
              rows="3"
              placeholder="补充说明、注意事项等..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>交代人</label>
              <input 
                v-model="form.assigner" 
                type="text"
                placeholder="如：老板、经理"
              />
            </div>
            <div class="form-group">
              <label>紧急程度</label>
              <select v-model="form.priority">
                <option value="urgent">🔴 紧急 - 立即处理</option>
                <option value="high">🟠 重要 - 今天完成</option>
                <option value="normal">🟡 普通 - 近期完成</option>
                <option value="low">🟢 低优先级 - 有空再做</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>截止日期（可选）</label>
            <input 
              v-model="form.deadline" 
              type="datetime-local"
            />
          </div>

          <div class="form-group">
            <label>标签（用逗号分隔）</label>
            <input 
              v-model="form.tagsInput" 
              type="text"
              placeholder="如：财务,人事,紧急,日常"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary">
              {{ editingTask ? '保存修改' : '记录任务' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Task {
  id: number
  title: string
  description: string
  assigner: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'completed'
  deadline: string
  createdAt: string
  completedAt: string | null
  tags: string[]
}

const tasks = ref<Task[]>([])
const showAddModal = ref(false)
const editingTask = ref<Task | null>(null)
const currentFilter = ref('all')

const form = ref({
  title: '',
  description: '',
  assigner: '老板',
  priority: 'normal' as Task['priority'],
  deadline: '',
  tagsInput: ''
})

const priorityText = {
  urgent: '紧急',
  high: '重要',
  normal: '普通',
  low: '低优先级'
}

const statusText = {
  pending: '待处理',
  completed: '已完成'
}

// 统计数据
const urgentCount = computed(() => tasks.value.filter(t => t.priority === 'urgent' && t.status === 'pending').length)
const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length)

// 筛选标签
const filterTabs = computed(() => [
  { label: '全部', value: 'all', count: tasks.value.length },
  { label: '待处理', value: 'pending', count: pendingCount.value },
  { label: '紧急', value: 'urgent', count: urgentCount.value },
  { label: '已完成', value: 'completed', count: completedCount.value }
])

// 筛选后的任务
const filteredTasks = computed(() => {
  let result = tasks.value
  
  switch (currentFilter.value) {
    case 'pending':
      result = result.filter(t => t.status === 'pending')
      break
    case 'completed':
      result = result.filter(t => t.status === 'completed')
      break
    case 'urgent':
      result = result.filter(t => t.priority === 'urgent' && t.status === 'pending')
      break
  }
  
  // 排序：未完成的在前，按优先级和时间排序
  return result.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1
    }
    if (a.priority !== b.priority) {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// 检查是否逾期
function isOverdue(task: Task): boolean {
  if (!task.deadline || task.status === 'completed') return false
  return new Date(task.deadline) < new Date()
}

// 格式化时间
function formatTime(time: string): string {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期
function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 完成任务
function completeTask(task: Task) {
  task.status = 'completed'
  task.completedAt = new Date().toISOString()
  saveToStorage()
}

// 重新打开任务
function reopenTask(task: Task) {
  task.status = 'pending'
  task.completedAt = null
  saveToStorage()
}

// 删除任务
function deleteTask(id: number) {
  if (confirm('确定要删除这个任务吗？')) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    saveToStorage()
  }
}

// 编辑任务
function editTask(task: Task) {
  editingTask.value = task
  form.value = {
    title: task.title,
    description: task.description,
    assigner: task.assigner,
    priority: task.priority,
    deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
    tagsInput: task.tags.join(',')
  }
  showAddModal.value = true
}

// 保存任务
function saveTask() {
  const tags = form.value.tagsInput
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(t => t)

  if (editingTask.value) {
    // 更新现有任务
    editingTask.value.title = form.value.title
    editingTask.value.description = form.value.description
    editingTask.value.assigner = form.value.assigner
    editingTask.value.priority = form.value.priority
    editingTask.value.deadline = form.value.deadline
    editingTask.value.tags = tags
  } else {
    // 创建新任务
    const newTask: Task = {
      id: Date.now(),
      title: form.value.title,
      description: form.value.description,
      assigner: form.value.assigner || '老板',
      priority: form.value.priority,
      status: 'pending',
      deadline: form.value.deadline,
      createdAt: new Date().toISOString(),
      completedAt: null,
      tags
    }
    tasks.value.unshift(newTask)
  }

  saveToStorage()
  closeModal()
}

// 关闭弹窗
function closeModal() {
  showAddModal.value = false
  editingTask.value = null
  form.value = {
    title: '',
    description: '',
    assigner: '老板',
    priority: 'normal',
    deadline: '',
    tagsInput: ''
  }
}

// 保存到本地存储
function saveToStorage() {
  localStorage.setItem('boss_tasks', JSON.stringify(tasks.value))
}

// 从本地存储加载
function loadFromStorage() {
  const saved = localStorage.getItem('boss_tasks')
  if (saved) {
    tasks.value = JSON.parse(saved)
  }
}

onMounted(() => {
  loadFromStorage()
  
  // 添加一些示例数据（如果没有数据）
  if (tasks.value.length === 0) {
    tasks.value = [
      {
        id: 1,
        title: '整理上个月的销售报表',
        description: '需要汇总各品类的销售数据，做成PPT发给老板',
        assigner: '老板',
        priority: 'high',
        status: 'pending',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        completedAt: null,
        tags: ['财务', '报表']
      },
      {
        id: 2,
        title: '联系供应商补货咖啡豆',
        description: '意式咖啡豆只剩5袋了，需要紧急补货',
        assigner: '老板',
        priority: 'urgent',
        status: 'pending',
        deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: null,
        tags: ['库存', '紧急']
      },
      {
        id: 3,
        title: '安排新员工培训',
        description: '下周一开始，需要准备培训材料',
        assigner: '经理',
        priority: 'normal',
        status: 'completed',
        deadline: '',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ['人事', '培训']
      }
    ]
    saveToStorage()
  }
})
</script>

<style scoped>
.boss-tasks {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.header-title h1 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
  transform: translateY(-1px);
}

.icon {
  font-size: 20px;
}

/* 统计栏 */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
  box-shadow: var(--shadow-card);
  border-left: 4px solid var(--border);
}

.stat-card.urgent {
  border-left-color: #ef4444;
}

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.completed {
  border-left-color: #22c55e;
}

.stat-card.total {
  border-left-color: var(--accent-primary);
}

.stat-num {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-4);
}

.tab-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
}

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.empty-state {
  text-align: center;
  padding: var(--space-12);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
}

/* 任务卡片 */
.task-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  border-left: 4px solid var(--border);
  transition: var(--transition-fast);
}

.task-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.task-card.urgent {
  border-left-color: #ef4444;
}

.task-card.high {
  border-left-color: #f97316;
}

.task-card.normal {
  border-left-color: #eab308;
}

.task-card.low {
  border-left-color: #22c55e;
}

.task-card.completed {
  opacity: 0.7;
}

.task-card.completed .task-title {
  text-decoration: line-through;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.task-badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.badge {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.badge.priority.urgent {
  background: #fef2f2;
  color: #dc2626;
}

.badge.priority.high {
  background: #fff7ed;
  color: #ea580c;
}

.badge.priority.normal {
  background: #fefce8;
  color: #ca8a04;
}

.badge.priority.low {
  background: #f0fdf4;
  color: #16a34a;
}

.badge.status.pending {
  background: #eff6ff;
  color: #2563eb;
}

.badge.status.completed {
  background: #f0fdf4;
  color: #16a34a;
}

.badge.overdue {
  background: #fef2f2;
  color: #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.task-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition-fast);
}

.btn-icon.complete {
  background: #dcfce7;
  color: #16a34a;
}

.btn-icon.undo {
  background: #dbeafe;
  color: #2563eb;
}

.btn-icon.edit {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon.delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.task-content {
  margin-top: var(--space-3);
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.task-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-3);
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.meta-item {
  font-size: var(--font-size-sm);
}

.meta-label {
  color: var(--text-secondary);
}

.meta-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.meta-value.overdue {
  color: #dc2626;
  font-weight: var(--font-weight-bold);
}

.meta-value.completed {
  color: #16a34a;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  padding: var(--space-1) var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
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
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
}

.close-btn:hover {
  background: var(--bg-hover);
}

form {
  padding: var(--space-6);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.required {
  color: var(--error);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
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
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

/* 响应式 */
@media (max-width: 768px) {
  .boss-tasks {
    padding: var(--space-4);
  }

  .page-header {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .task-meta {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
