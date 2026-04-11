<template>
  <BaseModal :model-value="modelValue" title="素材库" @update:model-value="$emit('update:modelValue', $event)">
    <div class="material-library">
      <!-- 素材分类 -->
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.type"
          class="category-tab"
          :class="{ active: currentCategory === cat.type }"
          @click="currentCategory = cat.type"
        >
          <SvgIcon :name="cat.icon" :size="16" />
          {{ cat.name }}
        </button>
      </div>

      <!-- 添加素材 -->
      <div class="add-material-section">
        <button class="add-btn" @click="showAddForm = true">
          <SvgIcon name="Plus" :size="16" />
          添加素材
        </button>
      </div>

      <!-- 素材列表 -->
      <div class="material-list">
        <div
          v-for="item in filteredMaterials"
          :key="item.id"
          class="material-item"
          @click="selectMaterial(item)"
        >
          <div class="material-preview" :style="getPreviewStyle(item)">
            <img v-if="item.type === 'image' && item.thumbnail" :src="item.thumbnail" :alt="item.title" />
            <span v-else class="preview-icon">
              <SvgIcon :name="getTypeIcon(item.type)" :size="24" />
            </span>
          </div>
          <div class="material-info">
            <span class="material-title">{{ item.title }}</span>
            <span class="material-type">{{ getTypeName(item.type) }}</span>
          </div>
          <button class="delete-btn" @click.stop="confirmDelete(item)">
            <SvgIcon name="Trash" :size="14" />
          </button>
        </div>

        <div v-if="filteredMaterials.length === 0" class="empty-state">
          <SvgIcon :name="getTypeIcon(currentCategory)" :size="48" />
          <p>暂无{{ getTypeName(currentCategory) }}</p>
          <button class="add-first-btn" @click="showAddForm = true">
            添加第一个
          </button>
        </div>
      </div>
    </div>

    <!-- 添加素材弹窗 -->
    <BaseModal v-model="showAddForm" :title="'添加' + getTypeName(currentCategory)">
      <div class="form-group">
        <label>标题</label>
        <input v-model="newMaterial.title" placeholder="输入素材标题" />
      </div>
      
      <div class="form-group">
        <label>内容</label>
        <textarea
          v-if="currentCategory === 'text' || currentCategory === 'code'"
          v-model="newMaterial.content"
          :placeholder="currentCategory === 'code' ? '粘贴代码...' : '输入文本内容...'"
          class="content-textarea"
          :class="{ 'code-textarea': currentCategory === 'code' }"
          rows="6"
        ></textarea>
        <input
          v-else-if="currentCategory === 'image'"
          v-model="newMaterial.content"
          placeholder="输入图片 URL"
          type="url"
        />
        <input
          v-else-if="currentCategory === 'link'"
          v-model="newMaterial.content"
          placeholder="输入链接 URL"
          type="url"
        />
        <div v-else-if="currentCategory === 'webpage'" class="webpage-form">
          <input v-model="newMaterial.content" placeholder="输入网页 URL" type="url" />
          <input v-model="newMaterial.metadata.description" placeholder="网页描述（可选）" />
        </div>
        <input
          v-else
          v-model="newMaterial.content"
          placeholder="输入文件 URL"
          type="url"
        />
      </div>

      <div class="form-group">
        <label>标签（可选）</label>
        <input v-model="newMaterial.tags" placeholder="用逗号分隔多个标签" />
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="showAddForm = false">取消</BaseButton>
        <BaseButton @click="addMaterial" :disabled="!newMaterial.title || !newMaterial.content">
          添加
        </BaseButton>
      </template>
    </BaseModal>

    <!-- 删除确认 -->
    <BaseModal v-model="showDeleteConfirm" title="删除素材">
      <p>确定要删除 "<strong>{{ materialToDelete?.title }}</strong>" 吗？</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteConfirm = false">取消</BaseButton>
        <BaseButton variant="danger" @click="deleteMaterial">删除</BaseButton>
      </template>
    </BaseModal>

    <!-- 选中素材详情 -->
    <BaseModal v-model="showDetail" :title="selectedMaterial?.title || '素材详情'">
      <div class="detail-content">
        <div class="detail-preview" :style="getPreviewStyle(selectedMaterial)">
          <img v-if="selectedMaterial?.type === 'image'" :src="selectedMaterial.content" :alt="selectedMaterial.title" />
          <pre v-else-if="selectedMaterial?.type === 'code'" class="code-preview">{{ selectedMaterial?.content }}</pre>
          <div v-else class="text-preview">{{ selectedMaterial?.content }}</div>
        </div>
        <div class="detail-info">
          <div class="info-row">
            <span class="label">类型</span>
            <span class="value">{{ getTypeName(selectedMaterial?.type || 'text') }}</span>
          </div>
          <div v-if="selectedMaterial?.tags?.length" class="info-row">
            <span class="label">标签</span>
            <div class="tags">
              <span v-for="tag in selectedMaterial.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="label">创建时间</span>
            <span class="value">{{ formatDate(selectedMaterial?.createdAt) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showDetail = false">关闭</BaseButton>
        <BaseButton @click="insertSelected">插入到编辑器</BaseButton>
      </template>
    </BaseModal>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MaterialItem, MaterialType } from '../types/wechat-note'
import { MATERIALS_KEY } from '../api/materials'
import SvgIcon from './icons/SvgIcon.vue'
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [material: MaterialItem]
}>()

const categories = [
  { type: 'text' as MaterialType, name: '文本', icon: 'Note' },
  { type: 'code' as MaterialType, name: '代码', icon: 'Code' },
  { type: 'image' as MaterialType, name: '图片', icon: 'Image' },
  { type: 'link' as MaterialType, name: '链接', icon: 'Link' },
  { type: 'webpage' as MaterialType, name: '网页', icon: 'Globe' },
  { type: 'file' as MaterialType, name: '文件', icon: 'Folder' }
]

const currentCategory = ref<MaterialType>('text')
const materials = ref<MaterialItem[]>([])
const showAddForm = ref(false)
const showDeleteConfirm = ref(false)
const showDetail = ref(false)
const materialToDelete = ref<MaterialItem | null>(null)
const selectedMaterial = ref<MaterialItem | null>(null)

const newMaterial = ref({
  title: '',
  content: '',
  tags: '',
  metadata: { description: '' }
})

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 加载素材
function loadMaterials() {
  const data = localStorage.getItem(MATERIALS_KEY)
  if (data) {
    materials.value = JSON.parse(data)
  }
}

// 保存素材
function saveMaterials() {
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials.value))
}

// 筛选素材
const filteredMaterials = computed(() => {
  return materials.value.filter(m => m.type === currentCategory.value)
})

// 获取类型名称
function getTypeName(type: MaterialType): string {
  const cat = categories.find(c => c.type === type)
  return cat?.name || '未知'
}

// 获取类型图标
function getTypeIcon(type: MaterialType): string {
  const cat = categories.find(c => c.type === type)
  return cat?.icon || 'Note'
}

// 获取预览样式
function getPreviewStyle(item: MaterialItem | null): any {
  if (!item) return {}
  
  if (item.type === 'image') {
    return {
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }
  
  return {}
}

// 添加素材
function addMaterial() {
  const material: MaterialItem = {
    id: generateId(),
    libraryId: 'default',
    type: currentCategory.value,
    title: newMaterial.value.title,
    content: newMaterial.value.content,
    tags: newMaterial.value.tags ? newMaterial.value.tags.split(',').map(t => t.trim()) : [],
    metadata: newMaterial.value.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  materials.value.unshift(material)
  saveMaterials()
  
  // 重置表单
  newMaterial.value = { title: '', content: '', tags: '', metadata: { description: '' } }
  showAddForm.value = false
}

// 确认删除
function confirmDelete(item: MaterialItem) {
  materialToDelete.value = item
  showDeleteConfirm.value = true
}

// 删除素材
function deleteMaterial() {
  if (!materialToDelete.value) return
  
  materials.value = materials.value.filter(m => m.id !== materialToDelete.value?.id)
  saveMaterials()
  
  showDeleteConfirm.value = false
  materialToDelete.value = null
}

// 选择素材
function selectMaterial(item: MaterialItem) {
  selectedMaterial.value = item
  showDetail.value = true
}

// 插入到编辑器
function insertSelected() {
  if (selectedMaterial.value) {
    emit('select', selectedMaterial.value)
    showDetail.value = false
  }
}

// 格式化日期
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 初始化
loadMaterials()
</script>

<style scoped>
.material-library {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.category-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.category-tab {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.category-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.category-tab.active {
  background: var(--accent-primary);
  color: white;
}

.add-material-section {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-normal);
}

.add-btn:hover {
  background: var(--accent-primary-hover);
}

.material-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
  max-height: 400px;
  overflow-y: auto;
}

.material-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
}

.material-item:hover {
  background: var(--bg-hover);
  transform: translateY(-2px);
}

.material-preview {
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-icon {
  color: var(--text-muted);
}

.material-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.material-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-type {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.material-item .delete-btn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-normal);
}

.material-item:hover .delete-btn {
  opacity: 1;
}

.material-item .delete-btn:hover {
  color: var(--accent-danger);
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-muted);
}

.add-first-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: var(--transition-normal);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-light);
}

.content-textarea {
  resize: vertical;
  min-height: 120px;
}

.code-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
}

.webpage-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail-preview {
  max-height: 300px;
  border-radius: var(--radius-md);
  overflow: auto;
  background: var(--bg-secondary);
}

.detail-preview img {
  width: 100%;
  height: auto;
}

.code-preview {
  padding: var(--space-4);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-all;
}

.text-preview {
  padding: var(--space-4);
  white-space: pre-wrap;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.info-row .label {
  flex-shrink: 0;
  width: 80px;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.info-row .value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.tag {
  padding: var(--space-1) var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}
</style>
