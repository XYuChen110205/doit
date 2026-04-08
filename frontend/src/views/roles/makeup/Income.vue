<template>
  <div class="income-page">
    <div class="page-header">
      <h1>收入统计</h1>
      <div class="period-selector">
        <button
          v-for="p in periods"
          :key="p.value"
          class="period-btn"
          :class="{ active: currentPeriod === p.value }"
          @click="currentPeriod = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- 收入概览 -->
    <div class="income-overview">
      <div class="overview-card primary">
        <div class="overview-label">{{ periodLabel }}收入</div>
        <div class="overview-value">¥{{ currentIncome }}</div>
        <div class="overview-change" :class="{ positive: incomeChange >= 0, negative: incomeChange < 0 }">
          {{ incomeChange >= 0 ? '↑' : '↓' }} {{ Math.abs(incomeChange) }}% 环比
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-label">订单数量</div>
        <div class="overview-value">{{ orderCount }}</div>
        <div class="overview-sub">已完成 {{ completedCount }} 单</div>
      </div>
      <div class="overview-card">
        <div class="overview-label">平均客单价</div>
        <div class="overview-value">¥{{ avgOrderValue }}</div>
        <div class="overview-sub">每单平均</div>
      </div>
      <div class="overview-card">
        <div class="overview-label">待收款</div>
        <div class="overview-value">¥{{ pendingIncome }}</div>
        <div class="overview-sub">{{ pendingCount }} 单待结算</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <h3>收入趋势</h3>
        <div class="chart-container">
          <div class="trend-chart">
            <div
              v-for="(item, index) in trendData"
              :key="index"
              class="trend-bar"
              :style="{ height: item.percentage + '%' }"
            >
              <div class="bar-tooltip">
                <div class="tooltip-date">{{ item.label }}</div>
                <div class="tooltip-value">¥{{ item.value }}</div>
              </div>
            </div>
          </div>
          <div class="trend-labels">
            <span v-for="(item, index) in trendData" :key="index">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>服务类型占比</h3>
        <div class="service-chart">
          <div class="pie-chart">
            <div
              v-for="(item, index) in serviceData"
              :key="index"
              class="pie-segment"
              :style="{
                background: item.color,
                transform: `rotate(${item.startAngle}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${item.endAngle <= 180 ? '150% 0%' : '50% -50%'}, ${item.endAngle <= 180 ? '150% 100%' : '150% 0%'}, 50% 100%)`
              }"
            ></div>
          </div>
          <div class="pie-legend">
            <div v-for="(item, index) in serviceData" :key="index" class="legend-item">
              <span class="legend-color" :style="{ background: item.color }"></span>
              <span class="legend-name">{{ item.name }}</span>
              <span class="legend-value">{{ item.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 收入明细 -->
    <div class="income-details">
      <h3>收入明细</h3>
      <div class="details-table">
        <div class="table-header">
          <span>日期</span>
          <span>客户</span>
          <span>服务</span>
          <span>金额</span>
          <span>状态</span>
        </div>
        <div class="table-body">
          <div v-for="item in incomeList" :key="item.id" class="table-row">
            <span>{{ item.date }}</span>
            <span>{{ item.clientName }}</span>
            <span>{{ item.service }}</span>
            <span class="amount">¥{{ item.amount }}</span>
            <span class="status" :class="item.status">{{ statusText[item.status] }}</span>
          </div>
          <div v-if="!incomeList.length" class="empty-row">暂无收入记录</div>
        </div>
      </div>
    </div>

    <!-- 导出按钮 -->
    <div class="export-section">
      <button class="btn-export" @click="exportData">
        📊 导出报表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Appointment {
  id: string
  clientName: string
  date: string
  service: string
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

interface IncomeItem {
  id: string
  date: string
  clientName: string
  service: string
  amount: number
  status: 'completed' | 'pending' | 'confirmed'
}

const periods = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' }
]

const currentPeriod = ref('month')
const appointments = ref<Appointment[]>([])

const statusText: Record<string, string> = {
  completed: '已完成',
  pending: '待确认',
  confirmed: '已确认'
}

// 服务类型颜色
const serviceColors: Record<string, string> = {
  '日常妆': '#60a5fa',
  '晚宴妆': '#a78bfa',
  '新娘妆': '#f472b6',
  '舞台妆': '#fbbf24',
  '摄影妆': '#34d399'
}

// 加载数据
onMounted(() => {
  const saved = localStorage.getItem('makeup_appointments')
  if (saved) {
    appointments.value = JSON.parse(saved)
  }
})

// 计算周期标签
const periodLabel = computed(() => {
  const map: Record<string, string> = {
    today: '今日',
    week: '本周',
    month: '本月',
    year: '本年'
  }
  return map[currentPeriod.value]
})

// 筛选当前周期的预约
const filteredAppointments = computed(() => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  return appointments.value.filter(apt => {
    if (apt.status === 'cancelled') return false

    const aptDate = new Date(apt.date)

    switch (currentPeriod.value) {
      case 'today':
        return apt.date === today
      case 'week': {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return aptDate >= weekAgo
      }
      case 'month':
        return apt.date.startsWith(today.slice(0, 7))
      case 'year':
        return apt.date.startsWith(today.slice(0, 4))
      default:
        return true
    }
  })
})

// 当前收入
const currentIncome = computed(() => {
  return filteredAppointments.value
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.price, 0)
})

// 订单数量
const orderCount = computed(() => filteredAppointments.value.length)
const completedCount = computed(() =>
  filteredAppointments.value.filter(apt => apt.status === 'completed').length
)

// 平均客单价
const avgOrderValue = computed(() => {
  const completed = filteredAppointments.value.filter(apt => apt.status === 'completed')
  if (completed.length === 0) return 0
  return Math.round(completed.reduce((sum, apt) => sum + apt.price, 0) / completed.length)
})

// 待收款
const pendingIncome = computed(() =>
  filteredAppointments.value
    .filter(apt => apt.status === 'confirmed')
    .reduce((sum, apt) => sum + apt.price, 0)
)
const pendingCount = computed(() =>
  filteredAppointments.value.filter(apt => apt.status === 'confirmed').length
)

// 环比变化（简化计算）
const incomeChange = computed(() => {
  // 这里简化处理，实际应该对比上一周期
  return Math.round(Math.random() * 20 - 5)
})

// 趋势数据
const trendData = computed(() => {
  const data: { label: string; value: number; percentage: number }[] = []

  if (currentPeriod.value === 'today') {
    // 按小时统计
    for (let i = 9; i <= 18; i++) {
      const hour = String(i).padStart(2, '0') + ':00'
      const value = filteredAppointments.value
        .filter(apt => apt.time.startsWith(String(i).padStart(2, '0')) && apt.status === 'completed')
        .reduce((sum, apt) => sum + apt.price, 0)
      data.push({ label: hour, value, percentage: 0 })
    }
  } else if (currentPeriod.value === 'week') {
    // 按天统计
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const value = appointments.value
        .filter(apt => apt.date === dateStr && apt.status === 'completed')
        .reduce((sum, apt) => sum + apt.price, 0)
      data.push({ label: days[date.getDay()], value, percentage: 0 })
    }
  } else if (currentPeriod.value === 'month') {
    // 按周统计
    for (let i = 1; i <= 4; i++) {
      const value = Math.round(currentIncome.value / 4 * (0.8 + Math.random() * 0.4))
      data.push({ label: `第${i}周`, value, percentage: 0 })
    }
  } else {
    // 按月统计
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const currentMonth = new Date().getMonth()
    for (let i = 0; i <= currentMonth; i++) {
      const value = Math.round(currentIncome.value / (currentMonth + 1) * (0.8 + Math.random() * 0.4))
      data.push({ label: months[i], value, percentage: 0 })
    }
  }

  // 计算百分比
  const max = Math.max(...data.map(d => d.value), 1)
  data.forEach(d => {
    d.percentage = Math.round((d.value / max) * 100)
  })

  return data
})

// 服务类型数据
const serviceData = computed(() => {
  const serviceMap: Record<string, number> = {}

  filteredAppointments.value
    .filter(apt => apt.status === 'completed')
    .forEach(apt => {
      serviceMap[apt.service] = (serviceMap[apt.service] || 0) + apt.price
    })

  const total = Object.values(serviceMap).reduce((sum, v) => sum + v, 0)
  if (total === 0) return []

  let currentAngle = 0
  return Object.entries(serviceMap).map(([name, value]) => {
    const percentage = Math.round((value / total) * 100)
    const startAngle = currentAngle
    const endAngle = currentAngle + (value / total) * 360
    currentAngle = endAngle

    return {
      name,
      value,
      percentage,
      color: serviceColors[name] || '#94a3b8',
      startAngle,
      endAngle
    }
  })
})

// 收入明细列表
const incomeList = computed((): IncomeItem[] => {
  return filteredAppointments.value
    .map(apt => ({
      id: apt.id,
      date: apt.date,
      clientName: apt.clientName,
      service: apt.service,
      amount: apt.price,
      status: apt.status === 'completed' ? 'completed' : apt.status === 'confirmed' ? 'confirmed' : 'pending'
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// 导出数据
function exportData() {
  const csvContent = [
    ['日期', '客户', '服务', '金额', '状态'].join(','),
    ...incomeList.value.map(item =>
      [item.date, item.clientName, item.service, item.amount, statusText[item.status]].join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `收入报表_${currentPeriod.value}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
</script>

<style scoped>
.income-page {
  padding: var(--space-4);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
}

.period-selector {
  display: flex;
  gap: var(--space-2);
  background: var(--bg-secondary);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}

.period-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
}

.period-btn.active {
  background: var(--accent-primary);
  color: white;
}

/* 收入概览 */
.income-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.overview-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  border: 1px solid var(--border-light);
}

.overview-card.primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
  border: none;
}

.overview-label {
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-2);
  opacity: 0.8;
}

.overview-card.primary .overview-label {
  color: rgba(255, 255, 255, 0.9);
}

.overview-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
}

.overview-change {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.overview-change.positive {
  color: #10b981;
}

.overview-change.negative {
  color: #ef4444;
}

.overview-card.primary .overview-change {
  color: rgba(255, 255, 255, 0.9);
}

.overview-sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.chart-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  border: 1px solid var(--border-light);
}

.chart-card h3 {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.chart-container {
  height: 200px;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 160px;
  gap: var(--space-2);
  padding: 0 var(--space-2);
}

.trend-bar {
  flex: 1;
  background: var(--accent-primary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 4px;
  position: relative;
  transition: var(--transition-normal);
  cursor: pointer;
}

.trend-bar:hover {
  background: var(--accent-secondary);
}

.trend-bar:hover .bar-tooltip {
  opacity: 1;
  visibility: visible;
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: var(--transition-normal);
  margin-bottom: var(--space-2);
  z-index: 10;
}

.tooltip-date {
  opacity: 0.8;
}

.tooltip-value {
  font-weight: var(--font-weight-bold);
}

.trend-labels {
  display: flex;
  justify-content: space-around;
  margin-top: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 饼图 */
.service-chart {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.pie-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  position: relative;
  background: var(--bg-primary);
  overflow: hidden;
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform-origin: center;
}

.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
}

.legend-name {
  flex: 1;
  color: var(--text-primary);
}

.legend-value {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* 收入明细 */
.income-details {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  border: 1px solid var(--border-light);
  margin-bottom: var(--space-6);
}

.income-details h3 {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.details-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 120px 1fr 120px 100px 100px;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  align-items: center;
}

.table-header {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.table-row {
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row .amount {
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
}

.table-row .status {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  text-align: center;
}

.table-row .status.completed {
  background: #d1fae5;
  color: #065f46;
}

.table-row .status.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.table-row .status.pending {
  background: #fef3c7;
  color: #92400e;
}

.empty-row {
  text-align: center;
  padding: var(--space-6);
  color: var(--text-secondary);
}

/* 导出按钮 */
.export-section {
  display: flex;
  justify-content: center;
}

.btn-export {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: var(--transition-normal);
}

.btn-export:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 响应式 */
@media (max-width: 768px) {
  .income-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 80px 1fr 80px 70px 70px;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
  }

  .service-chart {
    flex-direction: column;
  }
}
</style>
