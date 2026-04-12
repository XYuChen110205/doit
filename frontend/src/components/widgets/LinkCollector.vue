<template>
  <div class="link-collector">
    <!-- 缩略图预览 -->
    <div v-if="!isDetailView" class="link-preview" @click="openDetail">
      <div class="preview-header">
        <SvgIcon name="Link" :size="20" />
        <span>链接收藏</span>
        <span class="link-count">{{ links.length }}</span>
      </div>
      <div class="preview-list">
        <div
          v-for="(link, index) in previewLinks"
          :key="index"
          class="preview-item"
        >
          <div class="preview-favicon" :style="{ backgroundColor: link.color }">
            {{ getFaviconText(link.title) }}
          </div>
          <span class="preview-title">{{ link.title }}</span>
        </div>
        <div v-if="links.length === 0" class="empty-preview">
          暂无收藏链接
        </div>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="link-detail">
      <div class="detail-toolbar">
        <button class="back-btn" @click="closeDetail">
          <SvgIcon name="ChevronLeft" :size="18" />
          返回
        </button>
        <h2>链接收藏</h2>
        <button class="add-btn" @click="showAddDialog = true">
          <SvgIcon name="Plus" :size="16" />
          添加
        </button>
      </div>

      <div class="detail-content">
        <div class="links-grid">
          <div
            v-for="(link, index) in links"
            :key="index"
            class="link-card"
            :style="{ borderLeftColor: link.color }"
          >
            <div class="card-main" @click="openLink(link.url)">
              <div class="link-favicon" :style="{ backgroundColor: link.color }">
                {{ getFaviconText(link.title) }}
              </div>
              <div class="link-info">
                <h4 class="link-title">{{ link.title }}</h4>
                <p class="link-url">{{ formatUrl(link.url) }}</p>
                <p v-if="link.description" class="link-desc">{{ link.description }}</p>
              </div>
            </div>
            <div class="card-actions">
              <button class="action-btn" @click.stop="copyLink(link.url)" title="复制链接">
                <SvgIcon name="Copy" :size="14" />
              </button>
              <button class="action-btn" @click.stop="editLink(index)" title="编辑">
                <SvgIcon name="Edit" :size="14" />
              </button>
              <button class="action-btn delete" @click.stop="deleteLink(index)" title="删除">
                <SvgIcon name="Trash" :size="14" />
              </button>
            </div>
          </div>

          <div v-if="links.length === 0" class="empty-state">
            <SvgIcon name="Link" :size="48" />
            <p>还没有收藏链接</p>
            <button class="add-link-btn" @click="showAddDialog = true">
              添加第一个链接
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑链接弹窗 -->
    <BaseModal
      v-if="showAddDialog"
      :is-open="showAddDialog"
      :title="editingIndex !== null ? '编辑链接' : '添加链接'"
      @close="closeDialog"
    >
      <div class="form-group">
        <label>标题</label>
        <input v-model="form.title" placeholder="如：GitHub、Vue文档..." />
      </div>
      <div class="form-group">
        <label>链接地址</label>
        <input v-model="form.url" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label>描述（可选）</label>
        <input v-model="form.description" placeholder="简短描述..." />
      </div>
      <div class="form-group">
        <label>标签颜色</label>
        <div class="color-picker">
          <button
            v-for="color in presetColors"
            :key="color"
            class="color-option"
            :class="{ active: form.color === color }"
            :style="{ backgroundColor: color }"
            @click="form.color = color"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="closeDialog">取消</button>
        <button class="btn-primary" @click="saveLink" :disabled="!form.title || !form.url">
          {{ editingIndex !== null ? '保存' : '添加' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../icons/SvgIcon.vue'
import BaseModal from '../base/BaseModal.vue'

interface LinkItem {
  title: string
  url: string
  description?: string
  color: string
  createdAt: string
}

interface LinkData {
  links?: LinkItem[]
}

const props = defineProps<{
  instanceId: string
  initialData?: LinkData
  isDetailView?: boolean
}>()

const emit = defineEmits<{
  update: [data: LinkData]
  openDetail: []
  closeDetail: []
}>()

// 预设颜色
const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
]

// 状态
const links = ref<LinkItem[]>([])
const showAddDialog = ref(false)
const editingIndex = ref<number | null>(null)
const form = ref({
  title: '',
  url: '',
  description: '',
  color: presetColors[6] // 默认蓝色
})

// 计算属性
const previewLinks = computed(() => {
  return links.value.slice(0, 4) // 预览只显示前4个
})

// 方法
function loadData() {
  if (props.initialData?.links) {
    links.value = props.initialData.links
  }
}

function saveData() {
  emit('update', { links: links.value })
}

function getFaviconText(title: string): string {
  return title.charAt(0).toUpperCase()
}

function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

function openLink(url: string) {
  window.open(url, '_blank')
}

function copyLink(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    alert('链接已复制')
  })
}

function openDetail() {
  emit('openDetail')
}

function closeDetail() {
  emit('closeDetail')
}

function closeDialog() {
  showAddDialog.value = false
  editingIndex.value = null
  form.value = {
    title: '',
    url: '',
    description: '',
    color: presetColors[6]
  }
}

function saveLink() {
  if (!form.value.title || !form.value.url) return

  // 确保URL有协议
  let url = form.value.url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  const linkData: LinkItem = {
    title: form.value.title,
    url: url,
    description: form.value.description,
    color: form.value.color,
    createdAt: new Date().toISOString()
  }

  if (editingIndex.value !== null) {
    links.value[editingIndex.value] = linkData
  } else {
    links.value.push(linkData)
  }

  saveData()
  closeDialog()
}

function editLink(index: number) {
  const link = links.value[index]
  form.value = {
    title: link.title,
    url: link.url,
    description: link.description || '',
    color: link.color
  }
  editingIndex.value = index
  showAddDialog.value = true
}

function deleteLink(index: number) {
  if (confirm('确定要删除这个链接吗？')) {
    links.value.splice(index, 1)
    saveData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.link-collector {
  height: 100%;
}

/* 缩略图预览 */
.link-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  cursor: pointer;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.link-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 10px;
}

.preview-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--bg-primary);
  border-radius: 8px;
}

.preview-favicon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.preview-title {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* 详情页 */
.link-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: var(--transition-normal);
}

.back-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.detail-toolbar h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition-normal);
}

.add-btn:hover {
  background: var(--accent-primary-hover);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.link-card {
  background: var(--bg-primary);
  border-radius: 12px;
  border-left: 4px solid;
  overflow: hidden;
  transition: var(--transition-normal);
}

.link-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-main {
  display: flex;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
}

.link-favicon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-url {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.action-btn {
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
  transition: var(--transition-normal);
}

.action-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  color: var(--accent-danger);
  background: rgba(229, 115, 115, 0.1);
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state p {
  font-size: 16px;
}

.add-link-btn {
  padding: 10px 24px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition-normal);
}

.add-link-btn:hover {
  background: var(--accent-primary-hover);
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--transition-normal);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--text-primary);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent-primary);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 640px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>
