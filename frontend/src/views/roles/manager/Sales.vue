<template>
  <div class="sales-management">
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">{{ todaySales }}</div><div class="stat-label">今日销售额</div></div>
      <div class="stat-card"><div class="stat-value">{{ todayOrders }}</div><div class="stat-label">今日订单</div></div>
      <div class="stat-card"><div class="stat-value">{{ avgOrderValue }}</div><div class="stat-label">客单价</div></div>
      <div class="stat-card"><div class="stat-value">{{ monthSales }}</div><div class="stat-label">本月销售</div></div>
    </div>
    <div class="sales-section">
      <div class="section-header">
        <h3>销售记录</h3>
        <div class="date-filter"><input type="date" v-model="startDate" /> - <input type="date" v-model="endDate" /></div>
      </div>
      <div class="sales-table">
        <div class="table-header"><span>订单号</span><span>时间</span><span>商品</span><span>数量</span><span>金额</span><span>支付方式</span></div>
        <div v-for="order in salesRecords" :key="order.id" class="table-row">
          <span class="order-id">{{ order.id }}</span>
          <span class="order-time">{{ order.time }}</span>
          <span class="order-items">{{ order.items }}</span>
          <span class="order-quantity">{{ order.quantity }}</span>
          <span class="order-amount">{{ order.amount }}</span>
          <span class="order-payment">{{ order.payment }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const todaySales = ref('¥12,580')
const todayOrders = ref(156)
const avgOrderValue = ref('¥80.6')
const monthSales = ref('¥358,420')
const startDate = ref('2024-04-01')
const endDate = ref('2024-04-07')
const salesRecords = ref([
  { id: 'ORD-20240407001', time: '14:32', items: '拿铁咖啡x2', quantity: 2, amount: '¥60', payment: '微信支付' },
  { id: 'ORD-20240407002', time: '14:28', items: '美式咖啡x1', quantity: 1, amount: '¥20', payment: '支付宝' },
  { id: 'ORD-20240407003', time: '14:15', items: '卡布奇诺x1,蛋糕x1', quantity: 2, amount: '¥55', payment: '现金' },
  { id: 'ORD-20240407004', time: '14:02', items: '抹茶拿铁x2', quantity: 2, amount: '¥70', payment: '微信支付' },
  { id: 'ORD-20240407005', time: '13:48', items: '焦糖玛奇朵x1', quantity: 1, amount: '¥40', payment: '支付宝' }
])
</script>
<style scoped>
.sales-management { padding: var(--space-6); max-width: 1400px; margin: 0 auto; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-card); text-align: center; }
.stat-value { font-size: 32px; font-weight: var(--font-weight-bold); color: var(--accent-primary); margin-bottom: var(--space-2); }
.stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); }
.sales-section { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-card); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.section-header h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
.date-filter { display: flex; align-items: center; gap: var(--space-2); }
.date-filter input { padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); }
.sales-table { display: flex; flex-direction: column; }
.table-header, .table-row { display: grid; grid-template-columns: 1.5fr 1fr 2fr 1fr 1fr 1fr; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); }
.table-header { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-secondary); background: var(--bg-primary); border-radius: var(--radius-md) var(--radius-md) 0 0; }
.table-row { font-size: var(--font-size-sm); border-bottom: 1px solid var(--border); }
.order-id { font-family: var(--font-family-mono); color: var(--text-secondary); }
.order-amount { font-weight: var(--font-weight-bold); color: var(--accent-primary); }
@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .stats-row { grid-template-columns: 1fr; } .table-header, .table-row { grid-template-columns: 1fr 1fr 1fr; } .table-header span:nth-child(1), .table-header span:nth-child(4), .order-id, .order-quantity { display: none; } }
</style>
