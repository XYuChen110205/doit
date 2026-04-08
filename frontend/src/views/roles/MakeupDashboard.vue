<template>
  <div class="makeup-dashboard">
    <h1>化妆师工作台</h1>
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-value">{{ todayAppointments.length }}</div>
        <div class="stat-label">今日预约</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ weekIncome }}</div>
        <div class="stat-label">本周收入</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ clientCount }}</div>
        <div class="stat-label">客户总数</div>
      </div>
    </div>
    
    <div class="section">
      <h2>今日行程</h2>
      <div class="timeline">
        <div v-for="apt in todayAppointments" :key="apt.id" class="timeline-item">
          <div class="time">{{ apt.time }}</div>
          <div class="content">
            <div class="client">{{ apt.clientName }}</div>
            <div class="service">{{ apt.service }}</div>
          </div>
        </div>
        <div v-if="todayAppointments.length === 0" class="empty">
          今日暂无预约
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const todayAppointments = ref([
  { id: 1, time: '09:00', clientName: '张女士', service: '新娘妆' },
  { id: 2, time: '14:00', clientName: '李女士', service: '日常妆' }
])

const weekIncome = ref('¥2,580')
const clientCount = ref(128)
</script>

<style scoped>
.makeup-dashboard {
  padding: var(--space-6);
}

h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-6);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-align: center;
  box-shadow: var(--shadow-card);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.section {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.section h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.timeline-item {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3);
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
}

.time {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
  min-width: 60px;
}

.content {
  flex: 1;
}

.client {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.service {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.empty {
  text-align: center;
  padding: var(--space-6);
  color: var(--text-muted);
}
</style>
