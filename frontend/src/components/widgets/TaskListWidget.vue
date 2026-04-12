<template>
  <div class="task-list-widget">
    <!-- 添加任务 -->
    <div class="add-task-row">
      <input
        v-model="newTaskTitle"
        type="text"
        placeholder="添加新任务..."
        @keyup.enter="addTask"
      />
      <button @click="addTask" :disabled="!newTaskTitle.trim()">
        <SvgIcon name="Plus" :size="16" />
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-container">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        :class="{ done: task.status === 'done' }"
      >
        <button class="checkbox" @click="toggleTask(task)">
          <SvgIcon v-if="task.status === 'done'" name="Check" :size="12" />
        </button>
        <span class="task-title">{{ task.title }}</span>
        <button class="delete-btn" @click="deleteTask(task.id)">
          <SvgIcon name="Trash" :size="14" />
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="tasks.length === 0" class="empty-tasks">
        <p>暂无任务</p>
      </div>
    </div>

    <!-- 统计 -->
    <div class="task-stats">
      <span>{{ completedCount }}/{{ tasks.length }} 完成</span>
      <button v-if="completedCount > 0" class="clear-completed" @click="clearCompleted">
        清除已完成
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'

interface Task {
  id: string
  title: string
  status: 'pending' | 'done'
  createdAt: string
}

const props = defineProps<{
  instanceId: string
  initialData?: { tasks?: Task[] }
}>()

const emit = defineEmits<{
  update: [data: any]
}>()

const tasks = ref<Task[]>([])
const newTaskTitle = ref('')

const completedCount = computed(() => {
  return tasks.value.filter(t => t.status === 'done').length
})

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function addTask() {
  const title = newTaskTitle.value.trim()
  if (!title) return

  const newTask: Task = {
    id: generateId(),
    title,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  tasks.value.push(newTask)
  newTaskTitle.value = ''
  saveData()
}

function toggleTask(task: Task) {
  task.status = task.status === 'done' ? 'pending' : 'done'
  saveData()
}

function deleteTask(id: string) {
  tasks.value = tasks.value.filter(t => t.id !== id)
  saveData()
}

function clearCompleted() {
  tasks.value = tasks.value.filter(t => t.status !== 'done')
  saveData()
}

function saveData() {
  emit('update', { tasks: tasks.value })
}

// 初始化数据
onMounted(() => {
  if (props.initialData?.tasks) {
    tasks.value = props.initialData.tasks
  }
})

// 监听外部数据变化
watch(() => props.initialData, (newData) => {
  if (newData?.tasks) {
    tasks.value = newData.tasks
  }
}, { deep: true })
</script>

<style scoped>
.task-list-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.add-task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.add-task-row input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.add-task-row input:focus {
  border-color: var(--accent-primary);
}

.add-task-row button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-task-row button:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.add-task-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tasks-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: var(--transition-normal);
}

.task-item:hover {
  background: var(--bg-hover);
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition-normal);
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: var(--accent-primary);
}

.task-item.done .checkbox {
  background: var(--accent-success);
  border-color: var(--accent-success);
}

.task-title {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-word;
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.task-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.empty-tasks {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 14px;
}

.task-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
  font-size: 12px;
  color: var(--text-secondary);
}

.clear-completed {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.clear-completed:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
