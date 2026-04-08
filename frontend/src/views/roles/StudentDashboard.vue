<template>
  <div class="student-dashboard">
    <h1>学习助手</h1>
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-value">{{ pendingHomework }}</div>
        <div class="stat-label">待交作业</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ upcomingExams }}</div>
        <div class="stat-label"> upcoming 考试</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgGrade }}</div>
        <div class="stat-label">平均成绩</div>
      </div>
    </div>
    
    <div class="section">
      <h2>今日课程</h2>
      <div class="course-list">
        <div v-for="course in todayCourses" :key="course.id" class="course-item">
          <div class="time">{{ course.time }}</div>
          <div class="name">{{ course.name }}</div>
          <div class="location">{{ course.location }}</div>
        </div>
        <div v-if="todayCourses.length === 0" class="empty">
          今日暂无课程
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pendingHomework = ref(3)
const upcomingExams = ref(2)
const avgGrade = ref('85.5')

const todayCourses = ref([
  { id: 1, time: '08:00-09:40', name: '高等数学', location: 'A-101' },
  { id: 2, time: '10:00-11:40', name: '大学英语', location: 'B-203' },
  { id: 3, time: '14:00-15:40', name: '计算机基础', location: 'C-305' }
])
</script>

<style scoped>
.student-dashboard {
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

.course-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.course-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
}

.time {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--accent-primary);
  min-width: 100px;
}

.name {
  flex: 1;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.location {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.empty {
  text-align: center;
  padding: var(--space-6);
  color: var(--text-muted);
}
</style>
