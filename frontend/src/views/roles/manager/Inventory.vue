<template>
  <div class="inventory-management">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ totalProducts }}</div>
        <div class="stat-label">商品总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ lowStockCount }}</div>
        <div class="stat-label">库存不足</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ outOfStockCount }}</div>
        <div class="stat-label">已售罄</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ inventoryValue }}</div>
        <div class="stat-label">库存总值</div>
      </div>
    </div>

    <!-- 库存列表 -->
    <div class="inventory-section">
      <div class="section-header">
        <div class="header-left">
          <h3>库存管理</h3>
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="搜索商品..." />
          </div>
        </div>
        <div class="header-right">
          <div class="category-filter">
            <select v-model="selectedCategory">
              <option value="">全部分类</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <button class="add-btn" @click="showAddModal = true">+ 添加商品</button>
        </div>
      </div>

      <div class="inventory-table">
        <div class="table-header">
          <span>商品信息</span>
          <span>分类</span>
          <span>当前库存</span>
          <span>安全库存</span>
          <span>单价</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div v-for="item in filteredInventory" :key="item.id" class="table-row">
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-code">{{ item.code }}</div>
          </div>
          <span class="item-category">{{ item.category }}</span>
          <span class="item-stock" :class="getStockClass(item)">{{ item.stock }}</span>
          <span class="item-safe">{{ item.safeStock }}</span>
          <span class="item-price">¥{{ item.price }}</span>
          <span class="item-status" :class="getStatusClass(item)">{{ getStatusText(item) }}</span>
          <div class="item-actions">
            <button class="action-btn" @click="editItem(item)">编辑</button>
            <button class="action-btn primary" @click="restock(item)">补货</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingItem ? '编辑商品' : '添加商品' }}</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>商品名称</label>
            <input v-model="itemForm.name" type="text" placeholder="输入商品名称" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="itemForm.category">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>单价</label>
              <input v-model="itemForm.price" type="number" placeholder="输入单价" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>当前库存</label>
              <input v-model="itemForm.stock" type="number" placeholder="输入库存" />
            </div>
            <div class="form-group">
              <label>安全库存</label>
              <input v-model="itemForm.safeStock" type="number" placeholder="输入安全库存" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn-primary" @click="saveItem">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const totalProducts = ref(156)
const lowStockCount = ref(12)
const outOfStockCount = ref(3)
const inventoryValue = ref('¥45,280')

const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ['咖啡豆', '牛奶', '糖浆', '杯子', '食材', '包装', '清洁用品']

const inventory = ref([
  { id: 1, name: '咖啡豆(意式)', code: 'COF-001', category: '咖啡豆', stock: 5, safeStock: 20, price: 128 },
  { id: 2, name: '咖啡豆(单品)', code: 'COF-002', category: '咖啡豆', stock: 15, safeStock: 15, price: 168 },
  { id: 3, name: '牛奶(全脂)', code: 'MIL-001', category: '牛奶', stock: 12, safeStock: 30, price: 12 },
  { id: 4, name: '牛奶(脱脂)', code: 'MIL-002', category: '牛奶', stock: 8, safeStock: 20, price: 12 },
  { id: 5, name: '糖浆(香草)', code: 'SYP-001', category: '糖浆', stock: 8, safeStock: 15, price: 35 },
  { id: 6, name: '糖浆(焦糖)', code: 'SYP-002', category: '糖浆', stock: 0, safeStock: 10, price: 35 },
  { id: 7, name: '纸杯(中号)', code: 'CUP-001', category: '杯子', stock: 150, safeStock: 200, price: 0.5 },
  { id: 8, name: '纸杯(大号)', code: 'CUP-002', category: '杯子', stock: 80, safeStock: 150, price: 0.6 }
])

const filteredInventory = computed(() => {
  return inventory.value.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       item.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !selectedCategory.value || item.category === selectedCategory.value
    return matchSearch && matchCategory
  })
})

function getStockClass(item: typeof inventory.value[0]) {
  if (item.stock === 0) return 'danger'
  if (item.stock < item.safeStock) return 'warning'
  return 'normal'
}

function getStatusClass(item: typeof inventory.value[0]) {
  if (item.stock === 0) return 'danger'
  if (item.stock < item.safeStock) return 'warning'
  return 'success'
}

function getStatusText(item: typeof inventory.value[0]) {
  if (item.stock === 0) return '已售罄'
  if (item.stock < item.safeStock) return '库存不足'
  return '正常'
}

const showAddModal = ref(false)
const editingItem = ref<typeof inventory.value[0] | null>(null)
const itemForm = ref({ name: '', category: '咖啡豆', price: 0, stock: 0, safeStock: 0 })

function editItem(item: typeof inventory.value[0]) {
  editingItem.value = item
  itemForm.value = { ...item }
  showAddModal.value = true
}

function restock(item: typeof inventory.value[0]) {
  const amount = prompt(`为 ${item.name} 补货，请输入数量：`, '10')
  if (amount) {
    item.stock += parseInt(amount)
    alert(`已成功补货 ${amount} 件`)
  }
}

function saveItem() {
  if (editingItem.value) {
    Object.assign(editingItem.value, itemForm.value)
  } else {
    inventory.value.push({
      id: Date.now(),
      code: `NEW-${String(inventory.value.length + 1).padStart(3, '0')}`,
      ...itemForm.value
    })
  }
  showAddModal.value = false
  editingItem.value = null
  itemForm.value = { name: '', category: '咖啡豆', price: 0, stock: 0, safeStock: 0 }
}
</script>

<style scoped>
.inventory-management { padding: var(--space-6); max-width: 1400px; margin: 0 auto; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-card); text-align: center; }
.stat-value { font-size: 32px; font-weight: var(--font-weight-bold); color: var(--accent-primary); margin-bottom: var(--space-2); }
.stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); }
.inventory-section { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-card); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.header-left { display: flex; align-items: center; gap: var(--space-4); }
.header-left h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.search-box input { padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); width: 200px; }
.header-right { display: flex; gap: var(--space-3); }
.category-filter select { padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); }
.add-btn { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-inverse); background: var(--accent-primary); border: none; border-radius: var(--radius-md); cursor: pointer; }
.inventory-table { display: flex; flex-direction: column; }
.table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 120px; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); }
.table-header { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-secondary); background: var(--bg-primary); border-radius: var(--radius-md) var(--radius-md) 0 0; }
.table-row { font-size: var(--font-size-sm); border-bottom: 1px solid var(--border); }
.item-name { font-weight: var(--font-weight-medium); color: var(--text-primary); }
.item-code { font-size: var(--font-size-xs); color: var(--text-secondary); }
.item-stock.danger { color: var(--error); font-weight: var(--font-weight-bold); }
.item-stock.warning { color: var(--warning); }
.item-status { font-size: var(--font-size-xs); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); text-align: center; width: fit-content; }
.item-status.danger { color: var(--error); background: rgba(239, 68, 68, 0.1); }
.item-status.warning { color: var(--warning); background: rgba(245, 158, 11, 0.1); }
.item-status.success { color: var(--success); background: rgba(34, 197, 94, 0.1); }
.item-actions { display: flex; gap: var(--space-2); }
.action-btn { padding: var(--space-1) var(--space-2); font-size: var(--font-size-xs); color: var(--accent-primary); background: var(--accent-primary-bg); border: none; border-radius: var(--radius-sm); cursor: pointer; }
.action-btn.primary { color: var(--text-inverse); background: var(--accent-primary); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--bg-card); border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--border); }
.modal-header h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.close-btn { font-size: 24px; color: var(--text-secondary); background: none; border: none; cursor: pointer; }
.modal-body { padding: var(--space-4); }
.form-group { margin-bottom: var(--space-4); }
.form-group label { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); margin-bottom: var(--space-2); }
.form-group input, .form-group select { width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4); border-top: 1px solid var(--border); }
.btn-secondary { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; }
.btn-primary { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-inverse); background: var(--accent-primary); border: none; border-radius: var(--radius-md); cursor: pointer; }
@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .table-header, .table-row { grid-template-columns: 2fr 1fr 1fr 100px; } .table-header span:nth-child(4), .table-header span:nth-child(5), .table-header span:nth-child(6), .item-safe, .item-price, .item-status { display: none; } }
@media (max-width: 640px) { .stats-row { grid-template-columns: 1fr; } }
</style>
