<template>
  <div class="manager-dashboard">
    <!-- 概览卡片 -->
    <div class="overview-section">
      <div class="overview-card sales">
        <div class="card-icon"></div>
        <div class="card-info">
          <div class="card-value">{{ todaySales }}</div>
          <div class="card-label">今日销售额</div>
          <div class="card-trend" :class="salesTrend.type">
            {{ salesTrend.text }}
          </div>
        </div>
      </div>
      <div class="overview-card orders">
        <div class="card-icon"></div>
        <div class="card-info">
          <div class="card-value">{{ todayOrders }}</div>
          <div class="card-label">今日订单</div>
          <div class="card-trend" :class="ordersTrend.type">
            {{ ordersTrend.text }}
          </div>
        </div>
      </div>
      <div class="overview-card staff">
        <div class="card-icon"></div>
        <div class="card-info">
          <div class="card-value">{{ staffOnDuty }}/{{ totalStaff }}</div>
          <div class="card-label">在岗员工</div>
          <div class="card-sub">{{ staffStatus }}</div>
        </div>
      </div>
      <div class="overview-card inventory">
        <div class="card-icon"></div>
        <div class="card-info">
          <div class="card-value">{{ lowStockItems }}</div>
          <div class="card-label">库存预警</div>
          <div class="card-sub warning">需补货</div>
        </div>
      </div>
    </div>

    <!-- 销售趋势 -->
    <div class="dashboard-row">
      <div class="chart-card">
        <div class="card-header">
          <h3>销售趋势</h3>
          <div class="time-tabs">
            <button
              v-for="tab in timeTabs"
              :key="tab.value"
              class="tab-btn"
              :class="{ active: currentTimeTab === tab.value }"
              @click="currentTimeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <div class="chart-content">
          <div class="sales-chart">
            <div
              v-for="(item, index) in salesData"
              :key="index"
              class="chart-bar-wrapper"
            >
              <div class="chart-bar-bg">
                <div
                  class="chart-bar"
                  :style="{ height: (item.value / maxSalesValue * 100) + '%' }"
                ></div>
              </div>
              <div class="chart-label">{{ item.label }}</div>
              <div class="chart-value">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 热销商品 -->
      <div class="top-products">
        <div class="card-header">
          <h3>热销商品 TOP5</h3>
        </div>
        <div class="product-list">
          <div
            v-for="(product, index) in topProducts"
            :key="product.id"
            class="product-item"
          >
            <div class="product-rank" :class="{ top: index < 3 }">{{ index + 1 }}</div>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-sales">销量 {{ product.sales }}</div>
            </div>
            <div class="product-amount">{{ product.amount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 员工排班和任务 -->
    <div class="dashboard-row">
      <!-- 员工排班 -->
      <div class="staff-schedule">
        <div class="card-header">
          <h3>今日排班</h3>
          <button class="view-all" @click="$router.push('/manager/staff')">查看全部</button>
        </div>
        <div class="staff-list">
          <div
            v-for="staff in todayStaff"
            :key="staff.id"
            class="staff-item"
            :class="{ onduty: staff.status === '在岗', off: staff.status === '休息' }"
          >
            <div class="staff-avatar" :style="{ background: staff.color }">
              {{ staff.name.charAt(0) }}
            </div>
            <div class="staff-info">
              <div class="staff-name">{{ staff.name }}</div>
              <div class="staff-role">{{ staff.role }}</div>
            </div>
            <div class="staff-shift">{{ staff.shift }}</div>
            <div class="staff-status">{{ staff.status }}</div>
          </div>
        </div>
      </div>

      <!-- 老板交代的任务 -->
      <div class="task-overview boss-tasks-card">
        <div class="card-header">
          <h3>📝 老板交代的任务</h3>
          <button class="view-all" @click="$router.push('/manager/boss-tasks')">查看全部</button>
        </div>
        <div class="task-stats">
          <div class="task-stat">
            <div class="stat-num urgent">{{ bossUrgentTasks }}</div>
            <div class="stat-label">紧急</div>
          </div>
          <div class="task-stat">
            <div class="stat-num pending">{{ bossPendingTasks }}</div>
            <div class="stat-label">待处理</div>
          </div>
          <div class="task-stat">
            <div class="stat-num completed">{{ bossCompletedTasks }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="recent-tasks">
          <div
            v-for="task in recentBossTasks"
            :key="task.id"
            class="task-item"
            :class="task.status"
          >
            <div class="task-status-dot" :class="task.status"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <span class="task-assignee">{{ task.assigner }}</span>
                <span class="task-deadline">{{ formatDeadline(task.deadline) }}</span>
              </div>
            </div>
            <div class="task-priority" :class="task.priority">{{ task.priorityText }}</div>
          </div>
        </div>
        <div v-if="recentBossTasks.length === 0" class="empty-tasks">
          <p>暂无老板交代的任务</p>
          <button class="btn-quick-add" @click="$router.push('/manager/boss-tasks')">+ 记录新任务</button>
        </div>
      </div>
    </div>

    <!-- 库存预警 -->
    <div class="inventory-alert">
      <div class="card-header">
        <h3>库存预警</h3>
        <button class="view-all" @click="$router.push('/manager/inventory')">查看全部</button>
      </div>
      <div class="alert-table">
        <div class="table-header">
          <span>商品名称</span>
          <span>当前库存</span>
          <span>安全库存</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div
          v-for="item in lowStockList"
          :key="item.id"
          class="table-row"
        >
          <span class="item-name">{{ item.name }}</span>
          <span class="item-stock" :class="{ danger: item.stock < item.safeStock }">
            {{ item.stock }}
          </span>
          <span class="item-safe">{{ item.safeStock }}</span>
          <span class="item-status" :class="item.status">{{ item.statusText }}</span>
          <button class="restock-btn" @click="restock(item)">补货</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 概览数据
const todaySales = ref('¥12,580')
const todayOrders = ref(156)
const staffOnDuty = ref(5)
const totalStaff = ref(8)
const lowStockItems = ref(6)

const salesTrend = ref({ type: 'up', text: '+15.3% 较昨日' })
const ordersTrend = ref({ type: 'up', text: '+8.2% 较昨日' })
const staffStatus = ref('正常运营')

// 老板任务数据
interface BossTask {
  id: number
  title: string
  assigner: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'completed'
  deadline: string
  createdAt: string
}

const bossTasks = ref<BossTask[]>([])

const bossUrgentTasks = computed(() => bossTasks.value.filter(t => t.priority === 'urgent' && t.status === 'pending').length)
const bossPendingTasks = computed(() => bossTasks.value.filter(t => t.status === 'pending').length)
const bossCompletedTasks = computed(() => bossTasks.value.filter(t => t.status === 'completed').length)

const recentBossTasks = computed(() => {
  return bossTasks.value
    .filter(t => t.status === 'pending')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 4)
    .map(task => ({
      ...task,
      priorityText: { urgent: '紧急', high: '重要', normal: '普通', low: '低' }[task.priority]
    }))
})

function formatDeadline(deadline: string): string {
  if (!deadline) return '无截止日期'
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 0) return '已逾期'
  if (hours < 24) return `${hours}小时后`
  const days = Math.floor(hours / 24)
  return `${days}天后`
}

function loadBossTasks() {
  const saved = localStorage.getItem('boss_tasks')
  if (saved) {
    bossTasks.value = JSON.parse(saved)
  }
}

onMounted(() => {
  loadBossTasks()
})

// 时间标签
const timeTabs = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]
const currentTimeTab = ref('today')

// 销售数据
const salesData = ref([
  { label: '08:00', value: 320 },
  { label: '10:00', value: 580 },
  { label: '12:00', value: 920 },
  { label: '14:00', value: 650 },
  { label: '16:00', value: 480 },
  { label: '18:00', value: 890 },
  { label: '20:00', value: 760 }
])

const maxSalesValue = computed(() => {
  return Math.max(...salesData.value.map(d => d.value))
})

// 热销商品
const topProducts = ref([
  { id: 1, name: '拿铁咖啡', sales: 89, amount: '¥2,670' },
  { id: 2, name: '美式咖啡', sales: 76, amount: '¥1,520' },
  { id: 3, name: '卡布奇诺', sales: 54, amount: '¥1,620' },
  { id: 4, name: '抹茶拿铁', sales: 43, amount: '¥1,505' },
  { id: 5, name: '焦糖玛奇朵', sales: 38, amount: '¥1,520' }
])

// 员工排班
const todayStaff = ref([
  { id: 1, name: '小王', role: '店长', shift: '08:00-17:00', status: '在岗', color: '#667eea' },
  { id: 2, name: '小李', role: '咖啡师', shift: '08:00-16:00', status: '在岗', color: '#f093fb' },
  { id: 3, name: '小张', role: '服务员', shift: '10:00-18:00', status: '在岗', color: '#4facfe' },
  { id: 4, name: '小陈', role: '咖啡师', shift: '14:00-22:00', status: '休息', color: '#43e97b' },
  { id: 5, name: '小刘', role: '服务员', shift: '16:00-24:00', status: '休息', color: '#fa709a' }
])

// 任务统计
const pendingTasks = ref(8)
const progressTasks = ref(5)
const completedTasks = ref(12)

const recentTasks = ref([
  { id: 1, title: '盘点库存', assignee: '小王', deadline: '今天 18:00', status: 'pending', priority: 'high', priorityText: '紧急' },
  { id: 2, title: '清洁设备', assignee: '小李', deadline: '今天 20:00', status: 'progress', priority: 'medium', priorityText: '普通' },
  { id: 3, title: '整理货架', assignee: '小张', deadline: '明天 10:00', status: 'pending', priority: 'low', priorityText: '低' },
  { id: 4, title: '培训新员工', assignee: '小王', deadline: '明天 14:00', status: 'progress', priority: 'medium', priorityText: '普通' }
])

// 库存预警
const lowStockList = ref([
  { id: 1, name: '咖啡豆(意式)', stock: 5, safeStock: 20, status: 'danger', statusText: '严重不足' },
  { id: 2, name: '牛奶(全脂)', stock: 12, safeStock: 30, status: 'warning', statusText: '库存不足' },
  { id: 3, name: '糖浆(香草)', stock: 8, safeStock: 15, status: 'warning', statusText: '库存不足' },
  { id: 4, name: '纸杯(中号)', stock: 150, safeStock: 200, status: 'normal', statusText: '库存偏低' }
])

function restock(item: typeof lowStockList.value[0]) {
  alert(`已为 ${item.name} 创建补货订单`)
}
</script>

<style scoped>
.manager-dashboard {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* 概览卡片 */
.overview-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.overview-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
}

.overview-card.sales .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.overview-card.orders .card-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.overview-card.staff .card-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.overview-card.inventory .card-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.card-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.card-trend {
  font-size: var(--font-size-xs);
}

.card-trend.up {
  color: var(--success);
}

.card-trend.down {
  color: var(--error);
}

.card-sub {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.card-sub.warning {
  color: var(--warning);
}

/* 图表区域 */
.dashboard-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.chart-card,
.top-products,
.staff-schedule,
.task-overview,
.inventory-alert {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.card-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.time-tabs {
  display: flex;
  gap: var(--space-1);
}

.tab-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.view-all {
  font-size: var(--font-size-sm);
  color: var(--accent-primary);
  background: none;
  border: none;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

/* 销售图表 */
.sales-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  gap: var(--space-3);
  padding: var(--space-3) 0;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.chart-bar-bg {
  width: 100%;
  height: 150px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
}

.chart-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--radius-sm);
  transition: height 0.5s ease;
}

.chart-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.chart-value {
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

/* 热销商品 */
.product-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.product-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.product-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
  background: var(--bg-hover);
  border-radius: var(--radius-md);
}

.product-rank.top {
  color: var(--text-inverse);
  background: var(--accent-primary);
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.product-sales {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.product-amount {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
}

/* 员工排班 */
.staff-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.staff-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.staff-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-inverse);
}

.staff-info {
  flex: 1;
}

.staff-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.staff-role {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.staff-shift {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-family: var(--font-family-mono);
}

.staff-status {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.staff-item.onduty .staff-status {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.staff-item.off .staff-status {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

/* 任务概览 */
.task-stats {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.task-stat {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-1);
}

.stat-num.pending {
  color: var(--warning);
}

.stat-num.progress {
  color: var(--accent-primary);
}

.stat-num.completed {
  color: var(--success);
}

.task-stat .stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.recent-tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
}

.task-status-dot.pending {
  background: var(--warning);
}

.task-status-dot.progress {
  background: var(--accent-primary);
}

.task-status-dot.completed {
  background: var(--success);
}

.task-content {
  flex: 1;
}

.task-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.task-meta {
  display: flex;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.task-priority {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.task-priority.high {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}

.task-priority.medium {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
}

.task-priority.low {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

/* 库存预警 */
.inventory-alert {
  margin-bottom: var(--space-6);
}

.alert-table {
  display: flex;
  flex-direction: column;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 80px;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
}

.table-header {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.table-row {
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border);
}

.table-row:last-child {
  border-bottom: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.item-name {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.item-stock.danger {
  color: var(--error);
  font-weight: var(--font-weight-bold);
}

.item-status {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-align: center;
}

.item-status.danger {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}

.item-status.warning {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
}

.item-status.normal {
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}

.restock-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.restock-btn:hover {
  background: var(--accent-primary-hover);
}

/* 老板任务卡片样式 */
.boss-tasks-card .stat-num.urgent {
  color: #ef4444;
}

.empty-tasks {
  text-align: center;
  padding: var(--space-6);
  color: var(--text-secondary);
}

.empty-tasks p {
  margin-bottom: var(--space-3);
}

.btn-quick-add {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.btn-quick-add:hover {
  background: var(--accent-primary-hover);
}

@media (max-width: 1200px) {
  .overview-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .overview-section {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-2);
  }

  .table-header span:nth-child(4),
  .table-header span:nth-child(5),
  .table-row .item-status,
  .table-row .restock-btn {
    display: none;
  }
}
</style>
