<template>
  <div class="task-management">
    <div class="task-board">
      <div class="task-column">
        <div class="column-header"><h4>待处理</h4><span class="count">{{ pendingTasks.length }}</span></div>
        <div class="task-list">
          <div v-for="task in pendingTasks" :key="task.id" class="task-card">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta"><span class="assignee">{{ task.assignee }}</span><span class="deadline">{{ task.deadline }}</span></div>
            <div class="task-actions"><button @click="startTask(task)">开始</button></div>
          </div>
        </div>
      </div>
      <div class="task-column">
        <div class="column-header"><h4>进行中</h4><span class="count">{{ progressTasks.length }}</span></div>
        <div class="task-list">
          <div v-for="task in progressTasks" :key="task.id" class="task-card">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta"><span class="assignee">{{ task.assignee }}</span><span class="deadline">{{ task.deadline }}</span></div>
            <div class="task-actions"><button @click="completeTask(task)">完成</button></div>
          </div>
        </div>
      </div>
      <div class="task-column">
        <div class="column-header"><h4>已完成</h4><span class="count">{{ completedTasks.length }}</span></div>
        <div class="task-list">
          <div v-for="task in completedTasks" :key="task.id" class="task-card completed">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta"><span class="assignee">{{ task.assignee }}</span><span class="completed-time">{{ task.completedTime }}</span></div>
          </div>
        </div>
      </div>
    </div>
    <button class="fab" @click="showAddModal = true">+</button>
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header"><h3>新建任务</h3><button class="close-btn" @click="showAddModal = false">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>任务标题</label><input v-model="newTask.title" type="text" placeholder="输入任务标题" /></div>
          <div class="form-group"><label>负责人</label><select v-model="newTask.assignee"><option>小王</option><option>小李</option><option>小张</option></select></div>
          <div class="form-group"><label>截止时间</label><input v-model="newTask.deadline" type="datetime-local" /></div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showAddModal = false">取消</button><button class="btn-primary" @click="addTask">创建</button></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const pendingTasks = ref([{ id: 1, title: '盘点库存', assignee: '小王', deadline: '今天 18:00' }, { id: 2, title: '整理货架', assignee: '小张', deadline: '明天 10:00' }])
const progressTasks = ref([{ id: 3, title: '清洁设备', assignee: '小李', deadline: '今天 20:00' }, { id: 4, title: '培训新员工', assignee: '小王', deadline: '明天 14:00' }])
const completedTasks = ref([{ id: 5, title: '开门准备', assignee: '小李', completedTime: '08:00' }, { id: 6, title: '检查设备', assignee: '小王', completedTime: '08:30' }])
const showAddModal = ref(false)
const newTask = ref({ title: '', assignee: '小王', deadline: '' })
function startTask(task: typeof pendingTasks.value[0]) { pendingTasks.value = pendingTasks.value.filter(t => t.id !== task.id); progressTasks.value.push({ ...task, deadline: '进行中' }) }
function completeTask(task: typeof progressTasks.value[0]) { progressTasks.value = progressTasks.value.filter(t => t.id !== task.id); completedTasks.value.push({ ...task, completedTime: '刚刚' }) }
function addTask() { if (newTask.value.title) { pendingTasks.value.push({ id: Date.now(), ...newTask.value }); showAddModal.value = false; newTask.value = { title: '', assignee: '小王', deadline: '' } } }
</script>
<style scoped>
.task-management { padding: var(--space-6); max-width: 1400px; margin: 0 auto; }
.task-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.task-column { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-4); box-shadow: var(--shadow-card); }
.column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); }
.column-header h4 { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.count { font-size: var(--font-size-sm); color: var(--text-secondary); background: var(--bg-primary); padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); }
.task-list { display: flex; flex-direction: column; gap: var(--space-3); }
.task-card { background: var(--bg-primary); border-radius: var(--radius-md); padding: var(--space-3); border-left: 3px solid var(--accent-primary); }
.task-card.completed { border-left-color: var(--success); opacity: 0.7; }
.task-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); margin-bottom: var(--space-2); }
.task-meta { display: flex; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--space-2); }
.task-actions { display: flex; justify-content: flex-end; }
.task-actions button { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); color: var(--text-inverse); background: var(--accent-primary); border: none; border-radius: var(--radius-sm); cursor: pointer; }
.fab { position: fixed; bottom: var(--space-6); right: var(--space-6); width: 56px; height: 56px; border-radius: var(--radius-full); background: var(--accent-primary); color: var(--text-inverse); font-size: 24px; border: none; cursor: pointer; box-shadow: var(--shadow-lg); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--bg-card); border-radius: var(--radius-lg); width: 100%; max-width: 480px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--border); }
.modal-header h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.close-btn { font-size: 24px; color: var(--text-secondary); background: none; border: none; cursor: pointer; }
.modal-body { padding: var(--space-4); }
.form-group { margin-bottom: var(--space-4); }
.form-group label { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); margin-bottom: var(--space-2); }
.form-group input, .form-group select { width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4); border-top: 1px solid var(--border); }
.btn-secondary { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; }
.btn-primary { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-inverse); background: var(--accent-primary); border: none; border-radius: var(--radius-md); cursor: pointer; }
@media (max-width: 1024px) { .task-board { grid-template-columns: 1fr; } }
</style>
