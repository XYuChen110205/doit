<template>
  <div class="settings-view">
    <div class="settings-container">
      <!-- 标题 -->
      <h1 class="settings-title">设置</h1>

      <!-- 字体设置 -->
      <div class="settings-section">
        <FontSelector />
      </div>

      <!-- 角色选择 -->
      <div class="settings-section">
        <h2 class="section-title">角色模式</h2>
        <p class="section-desc">选择适合你的工作/学习模式，系统将为你定制专属功能</p>
        <div class="role-grid">
          <button
            v-for="role in roles"
            :key="role.id"
            class="role-card"
            :class="{ active: currentRole === role.id }"
            @click="selectRole(role.id)"
          >
            <span class="role-icon">{{ role.icon }}</span>
            <span class="role-name">{{ role.name }}</span>
            <span class="role-desc">{{ role.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 标签管理 -->
      <div class="settings-section">
        <h2 class="section-title">标签管理</h2>
        <div class="tags-list">
          <div v-for="tag in tags" :key="tag.id" class="tag-item">
            <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
            <span class="tag-name">{{ tag.name }}</span>
            <button class="tag-delete" @click="removeTag(tag.id)">×</button>
          </div>
        </div>
        <div class="add-tag">
          <input
            v-model="newTagName"
            type="text"
            class="tag-input"
            placeholder="新标签名称"
            @keyup.enter="addTag"
          />
          <button class="add-btn" @click="addTag">添加</button>
        </div>
      </div>

      <!-- 数据导出 -->
      <div class="settings-section">
        <h2 class="section-title">数据导出</h2>
        <p class="section-desc">将所有任务、笔记和收集箱数据导出为 JSON 文件</p>
        <button class="export-btn" @click="exportData">导出 JSON</button>
      </div>

      <!-- 关于 -->
      <div class="settings-section">
        <h2 class="section-title">关于</h2>
        <div class="about-info">
          <p class="about-item">
            <span class="about-label">应用名称</span>
            <span class="about-value">Todo System v1.0</span>
          </p>
          <p class="about-item">
            <span class="about-label">数据存储</span>
            <span class="about-value">本地 SQLite 数据库</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Tag } from '../types'
import { listTags, createTag, deleteTag } from '../api/tags'
import { exportData as exportDataApi } from '../api/settings'
import FontSelector from '../components/FontSelector.vue'

// 角色列表
const roles = [
  { id: 'default', name: '默认模式', icon: '📋', desc: '通用任务管理' },
  { id: 'makeup', name: '化妆师', icon: '💄', desc: '预约排班管理' },
  { id: 'student', name: '学生', icon: '📚', desc: '课程作业管理' },
  { id: 'study', name: '自习', icon: '🧘', desc: '专注学习计时' },
  { id: 'manager', name: '店长', icon: '🏪', desc: '店铺运营管理' },
  { id: 'cs_student', name: '计算机学生', icon: '💻', desc: '项目学习管理' },
  { id: 'custom', name: '个人专属', icon: '⭐', desc: '完全自定义' }
]

// 当前角色
const currentRole = ref('default')

// 标签列表
const tags = ref<Tag[]>([])
const newTagName = ref('')

// 选择角色
function selectRole(roleId: string) {
  currentRole.value = roleId
  localStorage.setItem('userRole', roleId)
  // 刷新页面以应用新角色
  window.location.reload()
}

// 加载角色
function loadRole() {
  const savedRole = localStorage.getItem('userRole')
  if (savedRole) {
    currentRole.value = savedRole
  }
}

// 加载标签
async function loadTags() {
  try {
    tags.value = await listTags()
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

// 添加标签
async function addTag() {
  const name = newTagName.value.trim()
  if (!name) return

  try {
    await createTag(name)
    newTagName.value = ''
    await loadTags()
  } catch (error) {
    console.error('创建标签失败:', error)
  }
}

// 删除标签
async function removeTag(id: number) {
  try {
    await deleteTag(id)
    await loadTags()
  } catch (error) {
    console.error('删除标签失败:', error)
  }
}

// 导出数据
function exportData() {
  exportDataApi()
}

// 初始化
onMounted(() => {
  loadRole()
  loadTags()
})
</script>

<style scoped>
.settings-view {
  min-height: calc(100vh - 64px - var(--space-8) * 2);
  padding: var(--space-8);
}

.settings-container {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* 标题 */
.settings-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-wide);
  text-align: center;
}

/* 设置区块 */
.settings-section {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: var(--letter-spacing-wide);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  letter-spacing: var(--letter-spacing-wide);
}

/* 角色网格 */
.role-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background-color: var(--bg-primary);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.role-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
}

.role-card.active {
  border-color: var(--accent-primary);
  background-color: var(--accent-primary-light);
}

.role-icon {
  font-size: 24px;
}

.role-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.role-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-align: center;
}

/* 标签列表 */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.tag-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
}

.tag-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.tag-delete {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition-normal);
}

.tag-delete:hover {
  color: var(--accent-danger);
  background-color: rgba(204, 139, 139, 0.1);
}

/* 添加标签 */
.add-tag {
  display: flex;
  gap: var(--space-2);
}

.tag-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: var(--transition-normal);
  outline: none;
}

.tag-input::placeholder {
  color: var(--text-muted);
}

.tag-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.add-btn {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-inverse);
  background-color: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.add-btn:hover {
  background-color: var(--accent-primary-hover);
}

/* 导出按钮 */
.export-btn {
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
  background-color: var(--accent-primary-light);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.export-btn:hover {
  background-color: var(--accent-primary);
  color: var(--text-inverse);
}

/* 关于信息 */
.about-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-light);
}

.about-item:last-child {
  border-bottom: none;
}

.about-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  letter-spacing: var(--letter-spacing-wide);
}

.about-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .settings-view {
    padding: var(--space-5);
  }

  .settings-container {
    max-width: 100%;
  }

  .role-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .settings-view {
    padding: var(--space-4);
  }

  .settings-title {
    font-size: var(--font-size-xl);
  }

  .add-tag {
    flex-direction: column;
  }

  .add-btn {
    width: 100%;
  }
}
</style>
