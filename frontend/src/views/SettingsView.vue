<template>
  <div class="settings-view">
    <div class="settings-layout">
      <!-- 左侧设置菜单 -->
      <aside class="settings-sidebar">
        <h2 class="sidebar-title">设置</h2>
        <nav class="settings-nav">
          <button
            v-for="section in sections"
            :key="section.id"
            class="nav-item"
            :class="{ active: currentSection === section.id }"
            @click="currentSection = section.id"
          >
            <SvgIcon :name="section.icon" :size="18" />
            <span>{{ section.name }}</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧设置内容 -->
      <main class="settings-content">
        <!-- 外观设置 -->
        <section v-if="currentSection === 'appearance'" class="settings-section">
          <h3 class="section-title">外观</h3>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">主题</span>
              <span class="setting-desc">选择浅色或深色主题</span>
            </div>
            <ThemeSwitcher />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">字体</span>
              <span class="setting-desc">选择你喜欢的字体</span>
            </div>
            <FontSelector />
          </div>
        </section>

        <!-- 工作模式设置 -->
        <section v-if="currentSection === 'mode'" class="settings-section">
          <h3 class="section-title">工作模式</h3>
          <p class="section-desc">选择适合你的工作/学习模式，启用专属功能</p>

          <div class="mode-list">
            <label
              v-for="mode in modes"
              :key="mode.id"
              class="mode-card"
              :class="{ active: currentMode === mode.id }"
            >
              <input
                type="radio"
                name="workMode"
                :value="mode.id"
                :checked="currentMode === mode.id"
                @change="selectMode(mode.id)"
              />
              <div class="mode-icon">
                <SvgIcon :name="mode.icon" :size="24" />
              </div>
              <div class="mode-info">
                <span class="mode-name">{{ mode.name }}</span>
                <span class="mode-desc">{{ mode.desc }}</span>
              </div>
              <div v-if="currentMode === mode.id" class="mode-check">
                <SvgIcon name="Check" :size="16" />
              </div>
            </label>
          </div>

          <div v-if="currentMode !== 'standard'" class="mode-preview">
            <h4>当前模式功能</h4>
            <ul class="feature-list">
              <li v-for="feature in currentModeFeatures" :key="feature">
                <SvgIcon name="Check" :size="14" />
                {{ feature }}
              </li>
            </ul>
          </div>
        </section>

        <!-- 数据管理 -->
        <section v-if="currentSection === 'data'" class="settings-section">
          <h3 class="section-title">数据管理</h3>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">导出数据</span>
              <span class="setting-desc">将所有数据导出为 JSON 文件备份</span>
            </div>
            <button class="btn-secondary" @click="exportData">
              <SvgIcon name="Download" :size="16" />
              导出
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">导入数据</span>
              <span class="setting-desc">从 JSON 文件恢复数据</span>
            </div>
            <button class="btn-secondary" @click="showImportDialog = true">
              <SvgIcon name="Upload" :size="16" />
              导入
            </button>
          </div>

          <div class="setting-item danger">
            <div class="setting-info">
              <span class="setting-name">清除所有数据</span>
              <span class="setting-desc">删除所有本地数据，此操作不可恢复</span>
            </div>
            <button class="btn-danger" @click="showClearConfirm = true">
              <SvgIcon name="Trash" :size="16" />
              清除
            </button>
          </div>
        </section>

        <!-- 关于 -->
        <section v-if="currentSection === 'about'" class="settings-section">
          <h3 class="section-title">关于</h3>

          <div class="about-card">
            <div class="app-logo">
              <SvgIcon name="Sparkle" :size="48" />
            </div>
            <h4 class="app-name">Do It</h4>
            <p class="app-version">版本 1.0.0</p>
            <p class="app-desc">简洁高效的任务管理系统</p>
          </div>

          <div class="info-list">
            <div class="info-item">
              <span class="info-label">数据存储</span>
              <span class="info-value">本地浏览器存储</span>
            </div>
            <div class="info-item">
              <span class="info-label">技术栈</span>
              <span class="info-value">Vue 3 + TypeScript</span>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- 导入对话框 -->
    <BaseModal v-if="showImportDialog" @close="showImportDialog = false">
      <template #title>导入数据</template>
      <template #default>
        <div class="import-dialog">
          <p class="dialog-desc">选择之前导出的 JSON 文件进行恢复</p>
          <input
            type="file"
            accept=".json"
            @change="handleFileSelect"
            class="file-input"
          />
          <p v-if="importError" class="error-text">{{ importError }}</p>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showImportDialog = false">取消</button>
        <button class="btn-primary" @click="confirmImport" :disabled="!selectedFile">导入</button>
      </template>
    </BaseModal>

    <!-- 清除确认对话框 -->
    <BaseModal v-if="showClearConfirm" @close="showClearConfirm = false">
      <template #title>确认清除</template>
      <template #default>
        <div class="confirm-dialog">
          <p class="warning-text">确定要清除所有数据吗？此操作不可恢复。</p>
          <label class="confirm-checkbox">
            <input type="checkbox" v-model="confirmClear" />
            我确认要删除所有数据
          </label>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showClearConfirm = false">取消</button>
        <button class="btn-danger" @click="clearAllData" :disabled="!confirmClear">确认清除</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '../components/icons/SvgIcon.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import FontSelector from '../components/FontSelector.vue'
import BaseModal from '../components/base/BaseModal.vue'

const router = useRouter()

// 当前设置区块
const currentSection = ref('appearance')

// 设置菜单
const sections = [
  { id: 'appearance', name: '外观', icon: 'Palette' },
  { id: 'mode', name: '工作模式', icon: 'Layout' },
  { id: 'data', name: '数据管理', icon: 'Database' },
  { id: 'about', name: '关于', icon: 'Info' }
]

// 工作模式
const modes = [
  {
    id: 'standard',
    name: '标准模式',
    icon: 'Home',
    desc: '通用任务管理，适合日常使用',
    features: ['今日待办', '收集箱', '日历视图', '笔记系统', '数据统计']
  },
  {
    id: 'student',
    name: '学生模式',
    icon: 'Student',
    desc: '课程作业管理，学生专属功能',
    features: ['作业管理', '课程表', '考试倒计时', '成绩追踪', '自习统计']
  },
  {
    id: 'focus',
    name: '专注模式',
    icon: 'Clock',
    desc: '番茄钟计时，提升专注力',
    features: ['番茄钟', '专注统计', '白噪音', '专注挑战']
  }
]

// 当前模式
const currentMode = ref(localStorage.getItem('workMode') || 'standard')

// 当前模式功能
const currentModeFeatures = computed(() => {
  const mode = modes.find(m => m.id === currentMode.value)
  return mode?.features || []
})

// 对话框状态
const showImportDialog = ref(false)
const showClearConfirm = ref(false)
const selectedFile = ref<File | null>(null)
const importError = ref('')
const confirmClear = ref(false)

// 选择工作模式
function selectMode(modeId: string) {
  currentMode.value = modeId
  localStorage.setItem('workMode', modeId)
  // 刷新页面以应用新模式
  window.location.reload()
}

// 导出数据
function exportData() {
  const data = {
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
    notes: JSON.parse(localStorage.getItem('notes') || '[]'),
    chatGroups: JSON.parse(localStorage.getItem('chatGroups') || '[]'),
    inboxItems: JSON.parse(localStorage.getItem('inboxItems') || '[]'),
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `doit-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 选择文件
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
    importError.value = ''
  }
}

// 确认导入
async function confirmImport() {
  if (!selectedFile.value) return

  try {
    const text = await selectedFile.value.text()
    const data = JSON.parse(text)

    // 验证数据格式
    if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks))
    if (data.notes) localStorage.setItem('notes', JSON.stringify(data.notes))
    if (data.chatGroups) localStorage.setItem('chatGroups', JSON.stringify(data.chatGroups))
    if (data.inboxItems) localStorage.setItem('inboxItems', JSON.stringify(data.inboxItems))

    showImportDialog.value = false
    selectedFile.value = null
    alert('数据导入成功')
    window.location.reload()
  } catch (error) {
    importError.value = '文件格式错误，请检查文件内容'
  }
}

// 清除所有数据
function clearAllData() {
  localStorage.clear()
  showClearConfirm.value = false
  confirmClear.value = false
  alert('所有数据已清除')
  router.push('/login')
}
</script>

<style scoped>
.settings-view {
  min-height: calc(100vh - 64px - var(--space-6) * 2);
}

.settings-layout {
  display: flex;
  gap: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

/* 左侧侧边栏 */
.settings-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  height: fit-content;
  position: sticky;
  top: var(--space-6);
}

.sidebar-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
}

/* 右侧内容区 */
.settings-content {
  flex: 1;
  min-width: 0;
}

.settings-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger {
  border-top: 1px solid var(--border-light);
  margin-top: var(--space-4);
  padding-top: var(--space-5);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.setting-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.setting-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 按钮 */
.btn-primary,
.btn-secondary,
.btn-danger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-danger {
  background: rgba(229, 115, 115, 0.1);
  color: var(--accent-danger);
  border: 1px solid var(--accent-danger);
}

.btn-danger:hover {
  background: var(--accent-danger);
  color: white;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 工作模式 */
.mode-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.mode-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-primary);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.mode-card:hover {
  border-color: var(--accent-primary);
}

.mode-card.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary-light);
}

.mode-card input[type="radio"] {
  display: none;
}

.mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  color: var(--accent-primary);
}

.mode-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mode-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.mode-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.mode-check {
  color: var(--accent-primary);
}

/* 模式预览 */
.mode-preview {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.mode-preview h4 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.feature-list li svg {
  color: var(--accent-success);
}

/* 关于卡片 */
.about-card {
  text-align: center;
  padding: var(--space-8) var(--space-6);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.app-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--accent-primary-light);
  border-radius: var(--radius-xl);
  color: var(--accent-primary);
  margin-bottom: var(--space-4);
}

.app-name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.app-version {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.app-desc {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

/* 信息列表 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

/* 对话框 */
.import-dialog,
.confirm-dialog {
  padding: var(--space-4) 0;
}

.dialog-desc {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.file-input {
  width: 100%;
  padding: var(--space-3);
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  cursor: pointer;
}

.error-text {
  color: var(--accent-danger);
  font-size: var(--font-size-sm);
  margin-top: var(--space-2);
}

.warning-text {
  color: var(--accent-danger);
  font-size: var(--font-size-md);
  margin-bottom: var(--space-4);
}

.confirm-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.confirm-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    position: static;
  }

  .settings-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .nav-item {
    flex: 1;
    min-width: 100px;
    justify-content: center;
  }

  .feature-list {
    grid-template-columns: 1fr;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .setting-item > button {
    width: 100%;
    justify-content: center;
  }
}
</style>
