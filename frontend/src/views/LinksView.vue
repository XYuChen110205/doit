<template>
  <div class="links-view">
    <!-- 头部 -->
    <div class="page-header">
      <h1>🔗 链接与任务库</h1>
      <div class="header-actions">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索链接、任务..."
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>
        <button class="add-btn" @click="showAddModal = true">+ 新增</button>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button 
        v-for="cat in categories" 
        :key="cat.value"
        class="tab-btn"
        :class="{ active: currentCategory === cat.value }"
        @click="currentCategory = cat.value"
      >
        {{ cat.label }}
        <span class="count">{{ getCategoryCount(cat.value) }}</span>
      </button>
    </div>

    <!-- 内容列表 -->
    <div class="content-list">
      <div 
        v-for="item in filteredItems" 
        :key="item.id"
        class="content-card"
        :class="{ 'is-task': item.type === 'task' }"
      >
        <!-- 类型标识 -->
        <div class="type-badge" :class="item.type">
          {{ item.type === 'link' ? '🔗' : '📋' }}
        </div>

        <!-- 内容主体 -->
        <div class="card-content">
          <!-- 链接类型 -->
          <template v-if="item.type === 'link'">
            <a :href="item.url" target="_blank" class="item-title link-title">
              {{ item.title || item.url }}
              <span class="external-icon">↗</span>
            </a>
            <p v-if="item.description" class="item-desc">{{ item.description }}</p>
            <a :href="item.url" target="_blank" class="item-url">{{ truncateUrl(item.url) }}</a>
          </template>

          <!-- 任务类型 -->
          <template v-else>
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-desc">{{ item.description }}</p>
            <div v-if="item.deadline" class="deadline">
              <span class="deadline-label">截止:</span>
              <span class="deadline-date" :class="{ overdue: isOverdue(item.deadline) }">
                {{ formatDate(item.deadline) }}
              </span>
            </div>
          </template>

          <!-- 图片展示 -->
          <div v-if="item.images && item.images.length" class="image-gallery">
            <div 
              v-for="(img, idx) in item.images.slice(0, 3)" 
              :key="idx"
              class="image-thumb"
              @click="previewImage(img)"
            >
              <img :src="img" :alt="`图片${idx + 1}`" />
            </div>
            <div v-if="item.images.length > 3" class="more-images">
              +{{ item.images.length - 3 }}
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="item.tags && item.tags.length" class="item-tags">
            <span 
              v-for="tag in item.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions">
          <button class="action-btn" @click="editItem(item)" title="编辑">✏️</button>
          <button class="action-btn" @click="copyItem(item)" title="复制">📋</button>
          <button class="action-btn delete" @click="deleteItem(item.id)" title="删除">🗑️</button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>{{ searchQuery ? '没有找到匹配的内容' : '暂无内容，点击右上角添加' }}</p>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editingItem ? '编辑' : '新增' }}</h3>
        
        <!-- 类型选择 -->
        <div class="form-group">
          <label>类型</label>
          <div class="type-selector">
            <button 
              class="type-btn"
              :class="{ active: formData.type === 'link' }"
              @click="formData.type = 'link'"
            >
              🔗 链接
            </button>
            <button 
              class="type-btn"
              :class="{ active: formData.type === 'task' }"
              @click="formData.type = 'task'"
            >
              📋 任务/要求
            </button>
          </div>
        </div>

        <!-- 链接表单 -->
        <template v-if="formData.type === 'link'">
          <div class="form-group">
            <label>URL <span class="required">*</span></label>
            <input 
              v-model="formData.url" 
              type="url" 
              placeholder="https://..."
              @blur="fetchLinkInfo"
            />
          </div>
          <div class="form-group">
            <label>标题</label>
            <input v-model="formData.title" type="text" placeholder="链接标题（自动获取或手动输入）" />
          </div>
        </template>

        <!-- 任务表单 -->
        <template v-else>
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input v-model="formData.title" type="text" placeholder="任务/要求标题" />
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input v-model="formData.deadline" type="date" />
          </div>
        </template>

        <!-- 公共字段 -->
        <div class="form-group">
          <label>描述</label>
          <textarea v-model="formData.description" rows="3" placeholder="详细描述..." />
        </div>

        <div class="form-group">
          <label>标签（用逗号分隔）</label>
          <input 
            v-model="formData.tagsInput" 
            type="text" 
            placeholder="老板, 紧急, 参考..."
          />
        </div>

        <!-- 图片上传 -->
        <div class="form-group">
          <label>图片</label>
          <div class="image-upload">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              @change="handleImageUpload"
              ref="fileInput"
              class="file-input"
            />
            <button class="upload-btn" @click="$refs.fileInput.click()">
              📷 选择图片
            </button>
            <span class="upload-hint">支持多张图片</span>
          </div>
          <div v-if="formData.images.length" class="image-preview-list">
            <div 
              v-for="(img, idx) in formData.images" 
              :key="idx"
              class="preview-item"
            >
              <img :src="img" />
              <button class="remove-img" @click="removeImage(idx)">×</button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" :disabled="!canSubmit" @click="saveItem">
            {{ editingItem ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImageUrl" class="image-preview-modal" @click.self="previewImageUrl = null">
      <img :src="previewImageUrl" />
      <button class="close-preview" @click="previewImageUrl = null">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface LinkItem {
  id: string
  type: 'link' | 'task'
  title: string
  url?: string
  description: string
  tags: string[]
  images: string[]
  deadline?: string
  createdAt: string
}

// 分类
const categories = [
  { label: '全部', value: 'all' },
  { label: '链接', value: 'link' },
  { label: '任务', value: 'task' },
  { label: '老板要求', value: 'boss' }
]

// 状态
const items = ref<LinkItem[]>([])
const currentCategory = ref('all')
const searchQuery = ref('')
const showAddModal = ref(false)
const editingItem = ref<LinkItem | null>(null)
const previewImageUrl = ref<string | null>(null)

// 表单数据
const formData = ref({
  type: 'link' as 'link' | 'task',
  title: '',
  url: '',
  description: '',
  tagsInput: '',
  images: [] as string[],
  deadline: ''
})

// 从 localStorage 加载
function loadItems() {
  const saved = localStorage.getItem('links_and_tasks')
  if (saved) {
    items.value = JSON.parse(saved)
  }
}

// 保存到 localStorage
function saveItems() {
  localStorage.setItem('links_and_tasks', JSON.stringify(items.value))
}

// 筛选后的项目
const filteredItems = computed(() => {
  let result = items.value
  
  // 按分类筛选
  if (currentCategory.value !== 'all') {
    if (currentCategory.value === 'boss') {
      result = result.filter(item => 
        item.tags.some(tag => tag.includes('老板') || tag.includes('boss'))
      )
    } else {
      result = result.filter(item => item.type === currentCategory.value)
    }
  }
  
  // 按搜索词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (item.url && item.url.toLowerCase().includes(query))
    )
  }
  
  // 按时间倒序
  return result.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

// 获取分类数量
function getCategoryCount(category: string) {
  if (category === 'all') return items.value.length
  if (category === 'boss') {
    return items.value.filter(item => 
      item.tags.some(tag => tag.includes('老板') || tag.includes('boss'))
    ).length
  }
  return items.value.filter(item => item.type === category).length
}

// 是否可以提交
const canSubmit = computed(() => {
  if (formData.value.type === 'link') {
    return formData.value.url.trim()
  }
  return formData.value.title.trim()
})

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout>
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    // 搜索逻辑已在 computed 中处理
  }, 300)
}

// 截断 URL
function truncateUrl(url: string) {
  return url.length > 50 ? url.slice(0, 50) + '...' : url
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 是否逾期
function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date()
}

// 获取链接信息（模拟）
async function fetchLinkInfo() {
  if (!formData.value.url) return
  // 这里可以调用后端 API 获取链接标题
  // 暂时用 URL 作为标题
  if (!formData.value.title) {
    formData.value.title = formData.value.url
  }
}

// 图片上传处理
function handleImageUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return
  
  Array.from(files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.images.push(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

// 移除图片
function removeImage(index: number) {
  formData.value.images.splice(index, 1)
}

// 预览图片
function previewImage(url: string) {
  previewImageUrl.value = url
}

// 编辑项目
function editItem(item: LinkItem) {
  editingItem.value = item
  formData.value = {
    type: item.type,
    title: item.title,
    url: item.url || '',
    description: item.description,
    tagsInput: item.tags.join(', '),
    images: [...item.images],
    deadline: item.deadline || ''
  }
  showAddModal.value = true
}

// 复制项目
function copyItem(item: LinkItem) {
  const newItem: LinkItem = {
    ...item,
    id: Date.now().toString(),
    title: item.title + ' (复制)',
    createdAt: new Date().toISOString()
  }
  items.value.unshift(newItem)
  saveItems()
}

// 删除项目
function deleteItem(id: string) {
  if (!confirm('确定要删除吗？')) return
  items.value = items.value.filter(item => item.id !== id)
  saveItems()
}

// 保存项目
function saveItem() {
  const tags = formData.value.tagsInput
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(t => t)
  
  const itemData: LinkItem = {
    id: editingItem.value?.id || Date.now().toString(),
    type: formData.value.type,
    title: formData.value.title || formData.value.url,
    url: formData.value.type === 'link' ? formData.value.url : undefined,
    description: formData.value.description,
    tags,
    images: formData.value.images,
    deadline: formData.value.type === 'task' ? formData.value.deadline : undefined,
    createdAt: editingItem.value?.createdAt || new Date().toISOString()
  }
  
  if (editingItem.value) {
    const index = items.value.findIndex(i => i.id === editingItem.value!.id)
    if (index !== -1) {
      items.value[index] = itemData
    }
  } else {
    items.value.unshift(itemData)
  }
  
  saveItems()
  closeModal()
}

// 关闭弹窗
function closeModal() {
  showAddModal.value = false
  editingItem.value = null
  formData.value = {
    type: 'link',
    title: '',
    url: '',
    description: '',
    tagsInput: '',
    images: [],
    deadline: ''
  }
}

// 初始化
onMounted(() => {
  loadItems()
})

// 监听变化自动保存
watch(items, saveItems, { deep: true })
</script>

<style scoped>
.links-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 280px;
  padding: var(--space-3) var(--space-4);
  padding-left: 40px;
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-md);
  background: var(--bg-card);
  transition: var(--transition-normal);
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-lg);
}

.add-btn {
  padding: var(--space-3) var(--space-5);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-btn:hover {
  background: var(--accent-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.tab-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.tab-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.count {
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.tab-btn.active .count {
  background: rgba(255, 255, 255, 0.2);
}

/* 内容列表 */
.content-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.content-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
  position: relative;
}

.content-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.content-card.is-task {
  border-left: 4px solid var(--accent-warning);
}

.type-badge {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  word-break: break-word;
}

.link-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--accent-primary);
  text-decoration: none;
}

.link-title:hover {
  text-decoration: underline;
}

.external-icon {
  font-size: var(--font-size-sm);
  opacity: 0.6;
}

.item-desc {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-2);
}

.item-url {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  word-break: break-all;
}

.deadline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.deadline-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.deadline-date {
  padding: var(--space-1) var(--space-3);
  background: var(--accent-primary-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
}

.deadline-date.overdue {
  background: rgba(229, 115, 115, 0.15);
  color: var(--accent-danger);
}

/* 图片画廊 */
.image-gallery {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.image-thumb {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-normal);
}

.image-thumb:hover {
  transform: scale(1.05);
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-images {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
}

/* 标签 */
.item-tags {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.tag {
  padding: var(--space-1) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 操作按钮 */
.card-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  font-size: var(--font-size-md);
}

.action-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.action-btn.delete:hover {
  background: rgba(229, 115, 115, 0.15);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-12);
  color: var(--text-muted);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--space-4);
}

.empty-state p {
  font-size: var(--font-size-lg);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-float);
}

.modal h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.required {
  color: var(--accent-danger);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition-normal);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* 类型选择器 */
.type-selector {
  display: flex;
  gap: var(--space-3);
}

.type-btn {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.type-btn:hover {
  border-color: var(--accent-primary);
}

.type-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

/* 图片上传 */
.image-upload {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.file-input {
  display: none;
}

.upload-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.upload-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.upload-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.image-preview-list {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  flex-wrap: wrap;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-md);
}

/* 表单操作 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

.btn-secondary {
  padding: var(--space-3) var(--space-5);
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  padding: var(--space-3) var(--space-5);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 图片预览弹窗 */
.image-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-modal) + 1);
}

.image-preview-modal img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.close-preview {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-full);
  color: white;
  font-size: var(--font-size-xl);
  cursor: pointer;
  transition: var(--transition-normal);
}

.close-preview:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .links-view {
    padding: var(--space-4);
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box input {
    width: 100%;
  }

  .content-card {
    flex-direction: column;
  }

  .card-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .type-selector {
    flex-direction: column;
  }
}
</style>
