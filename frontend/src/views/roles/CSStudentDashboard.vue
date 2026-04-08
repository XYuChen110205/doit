<template>
  <div class="cs-dashboard">
    <div class="stats-row">
      <div class="stat-card"><div class="stat-icon projects"></div><div class="stat-info"><div class="stat-value">{{ activeProjects }}</div><div class="stat-label">进行中项目</div></div></div>
      <div class="stat-card"><div class="stat-icon commits"></div><div class="stat-info"><div class="stat-value">{{ githubCommits }}</div><div class="stat-label">本周提交</div></div></div>
      <div class="stat-card"><div class="stat-icon leetcode"></div><div class="stat-info"><div class="stat-value">{{ leetcodeSolved }}</div><div class="stat-label">已刷题目</div></div></div>
      <div class="stat-card"><div class="stat-icon streak"></div><div class="stat-info"><div class="stat-value">{{ streakDays }}天</div><div class="stat-label">连续学习</div></div></div>
    </div>
    <div class="dashboard-grid">
      <div class="projects-section">
        <div class="section-header"><h3>进行中的项目</h3><button class="add-btn" @click="showAddProject = true">+ 新建</button></div>
        <div class="project-list">
          <div v-for="project in projects" :key="project.id" class="project-card">
            <div class="project-header"><span class="project-name">{{ project.name }}</span><span class="project-tech">{{ project.tech }}</span></div>
            <div class="project-desc">{{ project.description }}</div>
            <div class="project-progress"><div class="progress-bar"><div class="progress-fill" :style="{ width: project.progress + '%' }"></div></div><span class="progress-text">{{ project.progress }}%</span></div>
            <div class="project-footer"><span class="last-update">更新于 {{ project.lastUpdate }}</span><button class="view-btn">查看</button></div>
          </div>
        </div>
      </div>
      <div class="side-section">
        <div class="quick-actions">
          <h3>快速入口</h3>
          <div class="action-grid">
            <div class="action-item" @click="$router.push('/cs/learning')"><div class="action-icon learning"></div><span>学习进度</span></div>
            <div class="action-item" @click="$router.push('/cs/github')"><div class="action-icon github"></div><span>GitHub</span></div>
            <div class="action-item" @click="$router.push('/cs/leetcode')"><div class="action-icon leetcode"></div><span>刷题</span></div>
            <div class="action-item" @click="$router.push('/cs/notes')"><div class="action-icon notes"></div><span>笔记</span></div>
          </div>
        </div>
        <div class="recent-activity">
          <h3>最近动态</h3>
          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item"><div class="activity-dot" :class="activity.type"></div><div class="activity-content"><div class="activity-text">{{ activity.text }}</div><div class="activity-time">{{ activity.time }}</div></div></div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAddProject" class="modal-overlay" @click.self="showAddProject = false">
      <div class="modal-content">
        <div class="modal-header"><h3>新建项目</h3><button class="close-btn" @click="showAddProject = false">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>项目名称</label><input v-model="newProject.name" type="text" placeholder="输入项目名称" /></div>
          <div class="form-group"><label>技术栈</label><input v-model="newProject.tech" type="text" placeholder="如: Vue + Node.js" /></div>
          <div class="form-group"><label>项目描述</label><textarea v-model="newProject.description" placeholder="输入项目描述"></textarea></div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showAddProject = false">取消</button><button class="btn-primary" @click="addProject">创建</button></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const activeProjects = ref(3)
const githubCommits = ref(42)
const leetcodeSolved = ref(156)
const streakDays = ref(12)
const projects = ref([
  { id: 1, name: '个人博客系统', tech: 'Vue + Node.js', description: '基于Vue3和Express的全栈博客系统', progress: 75, lastUpdate: '2小时前' },
  { id: 2, name: '爬虫工具', tech: 'Python', description: '自动化数据采集工具', progress: 40, lastUpdate: '昨天' },
  { id: 3, name: '算法可视化', tech: 'React + D3', description: '常见算法可视化演示', progress: 20, lastUpdate: '3天前' }
])
const recentActivities = ref([
  { id: 1, type: 'commit', text: '提交了代码到 blog-system', time: '2小时前' },
  { id: 2, type: 'leetcode', text: '完成了 LeetCode #215', time: '5小时前' },
  { id: 3, type: 'note', text: '更新了学习笔记', time: '昨天' },
  { id: 4, type: 'commit', text: '提交了代码到 crawler', time: '昨天' }
])
const showAddProject = ref(false)
const newProject = ref({ name: '', tech: '', description: '' })
function addProject() { if (newProject.value.name) { projects.value.push({ id: Date.now(), ...newProject.value, progress: 0, lastUpdate: '刚刚' }); showAddProject.value = false; newProject.value = { name: '', tech: '', description: '' } } }
</script>
<style scoped>
.cs-dashboard { padding: var(--space-6); max-width: 1400px; margin: 0 auto; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-4); box-shadow: var(--shadow-card); display: flex; align-items: center; gap: var(--space-3); }
.stat-icon { width: 48px; height: 48px; border-radius: var(--radius-md); }
.stat-icon.projects { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.commits { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.leetcode { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.streak { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.stat-value { font-size: 24px; font-weight: var(--font-weight-bold); color: var(--text-primary); }
.stat-label { font-size: var(--font-size-xs); color: var(--text-secondary); }
.dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); }
.projects-section, .quick-actions, .recent-activity { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-card); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.section-header h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.add-btn { padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); color: var(--text-inverse); background: var(--accent-primary); border: none; border-radius: var(--radius-md); cursor: pointer; }
.project-list { display: flex; flex-direction: column; gap: var(--space-3); }
.project-card { background: var(--bg-primary); border-radius: var(--radius-md); padding: var(--space-4); }
.project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
.project-name { font-weight: var(--font-weight-bold); color: var(--text-primary); }
.project-tech { font-size: var(--font-size-xs); color: var(--accent-primary); background: var(--accent-primary-bg); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); }
.project-desc { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-3); }
.project-progress { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.progress-bar { flex: 1; height: 6px; background: var(--bg-hover); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); border-radius: var(--radius-full); }
.progress-text { font-size: var(--font-size-sm); color: var(--text-secondary); }
.project-footer { display: flex; justify-content: space-between; align-items: center; }
.last-update { font-size: var(--font-size-xs); color: var(--text-secondary); }
.view-btn { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); color: var(--accent-primary); background: var(--accent-primary-bg); border: none; border-radius: var(--radius-sm); cursor: pointer; }
.side-section { display: flex; flex-direction: column; gap: var(--space-4); }
.quick-actions h3, .recent-activity h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); margin-bottom: var(--space-4); }
.action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.action-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-4); background: var(--bg-primary); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition-fast); }
.action-item:hover { background: var(--bg-hover); }
.action-icon { width: 40px; height: 40px; border-radius: var(--radius-md); }
.action-icon.learning { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.action-icon.github { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.action-icon.leetcode { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.action-icon.notes { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.action-item span { font-size: var(--font-size-sm); color: var(--text-primary); }
.activity-list { display: flex; flex-direction: column; gap: var(--space-3); }
.activity-item { display: flex; gap: var(--space-3); }
.activity-dot { width: 8px; height: 8px; border-radius: var(--radius-full); margin-top: var(--space-1); }
.activity-dot.commit { background: var(--accent-primary); }
.activity-dot.leetcode { background: var(--success); }
.activity-dot.note { background: var(--warning); }
.activity-content { flex: 1; }
.activity-text { font-size: var(--font-size-sm); color: var(--text-primary); margin-bottom: var(--space-1); }
.activity-time { font-size: var(--font-size-xs); color: var(--text-secondary); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--bg-card); border-radius: var(--radius-lg); width: 100%; max-width: 480px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--border); }
.modal-header h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.close-btn { font-size: 24px; color: var(--text-secondary); background: none; border: none; cursor: pointer; }
.modal-body { padding: var(--space-4); }
.form-group { margin-bottom: var(--space-4); }
.form-group label { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); margin-bottom: var(--space-2); }
.form-group input, .form-group textarea { width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); }
.form-group textarea { min-height: 80px; resize: vertical; }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4); border-top: 1px solid var(--border); }
.btn-secondary { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; }
.btn-primary { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-inverse); background: var(--accent-primary); border: none; border-radius: var(--radius-md); cursor: pointer; }
@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .dashboard-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .stats-row { grid-template-columns: 1fr; } }
</style>
