<template>
  <div class="student-schedule" :style="backgroundStyle">
    <div class="page-header">
      <h1>课程表</h1>
      <div class="header-controls">
        <select v-model="currentTerm" class="term-select" @change="loadCourses">
          <option v-for="term in terms" :key="term.value" :value="term.value">{{ term.label }}</option>
        </select>
        <div class="week-nav">
          <button class="nav-btn" @click="changeWeek(-1)">
            <span class="arrow left"></span>
          </button>
          <span class="week-title">第 {{ currentWeek }} 周</span>
          <button class="nav-btn" @click="changeWeek(1)">
            <span class="arrow right"></span>
          </button>
        </div>
        <button class="btn-secondary" @click="showBgModal = true">背景</button>
        <button class="btn-secondary" @click="exportSchedule">导出</button>
        <button class="btn-primary" @click="showAddModal = true">+ 添加课程</button>
      </div>
    </div>

    <!-- 通知设置 -->
    <div class="notification-bar" v-if="notificationEnabled">
      <span class="notify-icon"></span>
      <span>上课提醒已开启（提前30分钟）</span>
      <button class="btn-toggle" @click="toggleNotification">关闭</button>
    </div>
    <div class="notification-bar disabled" v-else>
      <span class="notify-icon off"></span>
      <span>上课提醒已关闭</span>
      <button class="btn-toggle" @click="toggleNotification">开启</button>
    </div>

    <!-- 复制粘贴提示 -->
    <div class="copy-hint" v-if="copiedCourse">
      <span>已复制：{{ copiedCourse.name }}</span>
      <span class="hint-detail">右键点击空单元格粘贴 | Shift+点击粘贴</span>
      <button class="btn-clear" @click="copiedCourse = null">清除</button>
    </div>

    <!-- 课程表容器 -->
    <div class="schedule-wrapper" :style="tableStyle" ref="scheduleWrapper">
      <div class="schedule-table" ref="scheduleTable">
        <!-- 固定表头 -->
        <div class="table-header sticky-header">
          <div class="time-header">时间</div>
          <div
            v-for="day in weekDays"
            :key="day.value"
            class="day-header"
            :class="{ today: isToday(day.value) }"
          >
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.date }}</div>
          </div>
        </div>

        <!-- 上午 -->
        <div class="section-header">上午</div>
        <div 
          v-for="period in morningPeriods" 
          :key="period.index"
          class="table-row"
        >
          <div class="time-cell">
            <div class="period-name">第{{ period.index }}节</div>
            <div class="period-time">{{ period.time }}</div>
          </div>
          <div
            v-for="day in weekDays"
            :key="day.value"
            class="course-cell"
            :class="{ 'has-course': getCourse(day.value, period.index) }"
            @click="handleCellClick(day.value, period.index, $event)"
            @contextmenu.prevent="handleCellRightClick(day.value, period.index)"
          >
            <div 
              v-if="getCourse(day.value, period.index)"
              class="course-block"
              :style="{ backgroundColor: getCourseColor(getCourse(day.value, period.index)!) }"
              :class="{ 'active-week': isActiveWeek(getCourse(day.value, period.index)!) }"
              @click.stop="showCourseDetail(getCourse(day.value, period.index)!)"
            >
              <div class="course-name">{{ getCourse(day.value, period.index)?.name }}</div>
              <div class="course-code">{{ getCourse(day.value, period.index)?.code }}</div>
              <div class="course-weeks">{{ getCourse(day.value, period.index)?.weeks }}周</div>
              <div class="course-room">{{ getCourse(day.value, period.index)?.room }}</div>
            </div>
          </div>
        </div>

        <!-- 午休 -->
        <div class="break-row">
          <div class="break-label">午餐、午休</div>
        </div>

        <!-- 下午 -->
        <div class="section-header">下午</div>
        <div 
          v-for="period in afternoonPeriods" 
          :key="period.index"
          class="table-row"
        >
          <div class="time-cell">
            <div class="period-name">第{{ period.index }}节</div>
            <div class="period-time">{{ period.time }}</div>
          </div>
          <div
            v-for="day in weekDays"
            :key="day.value"
            class="course-cell"
            :class="{ 'has-course': getCourse(day.value, period.index) }"
            @click="handleCellClick(day.value, period.index, $event)"
            @contextmenu.prevent="handleCellRightClick(day.value, period.index)"
          >
            <div
              v-if="getCourse(day.value, period.index)"
              class="course-block"
              :style="{ backgroundColor: getCourseColor(getCourse(day.value, period.index)!) }"
              :class="{ 'active-week': isActiveWeek(getCourse(day.value, period.index)!) }"
              @click.stop="showCourseDetail(getCourse(day.value, period.index)!)"
            >
              <div class="course-name">{{ getCourse(day.value, period.index)?.name }}</div>
              <div class="course-code">{{ getCourse(day.value, period.index)?.code }}</div>
              <div class="course-weeks">{{ getCourse(day.value, period.index)?.weeks }}周</div>
              <div class="course-room">{{ getCourse(day.value, period.index)?.room }}</div>
            </div>
          </div>
        </div>

        <!-- 晚餐 -->
        <div class="break-row dinner">
          <div class="break-label">晚餐</div>
        </div>

        <!-- 晚上 -->
        <div class="section-header">晚上</div>
        <div 
          v-for="period in eveningPeriods" 
          :key="period.index"
          class="table-row"
        >
          <div class="time-cell">
            <div class="period-name">第{{ period.index }}节</div>
            <div class="period-time">{{ period.time }}</div>
          </div>
          <div
            v-for="day in weekDays"
            :key="day.value"
            class="course-cell"
            :class="{ 'has-course': getCourse(day.value, period.index) }"
            @click="handleCellClick(day.value, period.index, $event)"
            @contextmenu.prevent="handleCellRightClick(day.value, period.index)"
          >
            <div
              v-if="getCourse(day.value, period.index)"
              class="course-block"
              :style="{ backgroundColor: getCourseColor(getCourse(day.value, period.index)!) }"
              :class="{ 'active-week': isActiveWeek(getCourse(day.value, period.index)!) }"
              @click.stop="showCourseDetail(getCourse(day.value, period.index)!)"
            >
              <div class="course-name">{{ getCourse(day.value, period.index)?.name }}</div>
              <div class="course-code">{{ getCourse(day.value, period.index)?.code }}</div>
              <div class="course-weeks">{{ getCourse(day.value, period.index)?.weeks }}周</div>
              <div class="course-room">{{ getCourse(day.value, period.index)?.room }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal detail-modal">
        <div class="modal-header">
          <h3>{{ selectedCourse?.name }}</h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <span class="detail-label">课程代码</span>
            <span class="detail-value">{{ selectedCourse?.code }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">学时</span>
            <span class="detail-value">{{ selectedCourse?.hours }}学时</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">上课周次</span>
            <span class="detail-value">{{ selectedCourse?.weeks }}周</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">上课时间</span>
            <span class="detail-value">{{ selectedCourse?.day }} 第{{ selectedCourse?.period }}节</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">上课地点</span>
            <span class="detail-value">{{ selectedCourse?.room }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">授课教师</span>
            <span class="detail-value">{{ selectedCourse?.teacher }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">授课对象</span>
            <span class="detail-value">{{ selectedCourse?.target }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="copyCourse(selectedCourse!)">复制</button>
          <button class="btn-secondary" @click="editCourse(selectedCourse!)">编辑</button>
          <button class="btn-danger" @click="deleteCourse(selectedCourse!.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑课程弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <h3>{{ editingId ? '编辑课程' : '添加课程' }}</h3>
        <form @submit.prevent="saveCourse">
          <div class="form-group">
            <label>课程名称</label>
            <input v-model="form.name" type="text" required placeholder="如：无人驾驶技术与实践" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>课程代码</label>
              <input v-model="form.code" type="text" required placeholder="如：[0605213b610]" />
            </div>
            <div class="form-group">
              <label>学时</label>
              <input v-model.number="form.hours" type="number" required placeholder="如：48" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>星期</label>
              <select v-model="form.day" required>
                <option v-for="day in weekDays" :key="day.value" :value="day.value">{{ day.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>节次</label>
              <select v-model.number="form.period" required>
                <option v-for="i in 12" :key="i" :value="i">第{{ i }}节</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>上课周次</label>
            <input v-model="form.weeks" type="text" required placeholder="如：2-17周 或 8-16周" />
          </div>
          <div class="form-group">
            <label>上课地点</label>
            <input v-model="form.room" type="text" required placeholder="如：大学生创业园203(计算机机房)" />
          </div>
          <div class="form-group">
            <label>课程颜色</label>
            <div class="color-picker">
              <button
                v-for="color in courseColors"
                :key="color"
                type="button"
                class="color-btn"
                :class="{ selected: form.color === color }"
                :style="{ backgroundColor: color }"
                @click="form.color = color"
              ></button>
            </div>
          </div>
          <div class="form-group">
            <label>授课教师</label>
            <input v-model="form.teacher" type="text" placeholder="教师姓名" />
          </div>
          <div class="form-group">
            <label>授课对象</label>
            <input v-model="form.target" type="text" placeholder="如：智能本231[48人]" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeAddModal">取消</button>
            <button type="submit" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 背景设置弹窗 -->
    <div v-if="showBgModal" class="modal-overlay" @click.self="closeBgModal">
      <div class="modal bg-modal">
        <h3>设置背景</h3>
        
        <!-- 背景类型选择 -->
        <div class="bg-section">
          <label class="section-label">选择背景</label>
          <div class="bg-options">
            <div class="bg-option" @click="setBackground('')">
              <div class="bg-preview default" :class="{ active: background === '' }">默认</div>
              <span>无背景</span>
            </div>
            <div class="bg-option" v-for="(bg, index) in backgroundOptions" :key="index" @click="setBackground(bg)">
              <div class="bg-preview" :style="{ background: bg }" :class="{ active: background === bg }"></div>
              <span>背景 {{ index + 1 }}</span>
            </div>
          </div>
        </div>

        <!-- 图片上传 -->
        <div class="bg-section">
          <label class="section-label">上传图片</label>
          <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              style="display: none" 
              @change="handleFileChange"
            />
            <div class="upload-placeholder" v-if="!background.startsWith('data:')">
              <span class="upload-icon">+</span>
              <span>点击或拖拽上传图片</span>
            </div>
            <div class="upload-preview" v-else>
              <img :src="background" alt="背景预览" />
              <button class="remove-img-btn" @click.stop="removeBackground">×</button>
            </div>
          </div>
        </div>

        <!-- 图片URL输入 -->
        <div class="bg-section">
          <label class="section-label">或输入图片URL</label>
          <div class="url-input-group">
            <input v-model="customBgUrl" type="text" placeholder="https://example.com/image.jpg" />
            <button class="btn-primary" @click="setCustomBackground">应用</button>
          </div>
        </div>

        <!-- 背景透明度 -->
        <div class="bg-section">
          <label class="section-label">背景透明度 ({{ Math.round(backgroundOpacity * 100) }}%)</label>
          <input 
            type="range" 
            v-model.number="backgroundOpacity" 
            min="0" 
            max="0.8" 
            step="0.05"
            class="opacity-slider"
            @input="saveOpacitySettings"
          />
          <div class="slider-labels">
            <span>清晰</span>
            <span>半透明</span>
          </div>
        </div>

        <!-- 课表透明度 -->
        <div class="bg-section">
          <label class="section-label">课表透明度 ({{ Math.round((1 - tableOpacity) * 100) }}%)</label>
          <input 
            type="range" 
            v-model.number="tableOpacity" 
            min="0.3" 
            max="1" 
            step="0.05"
            class="opacity-slider"
            @input="saveOpacitySettings"
          />
          <div class="slider-labels">
            <span>透明</span>
            <span>不透明</span>
          </div>
        </div>

        <!-- 图片位置调整（仅当有图片背景时显示） -->
        <div class="bg-section" v-if="background.startsWith('http') || background.startsWith('data:')">
          <label class="section-label">图片位置调整</label>
          <div class="position-control">
            <div class="position-preview" 
                 @mousedown="startDrag" 
                 @mousemove="onDrag" 
                 @mouseup="stopDrag"
                 @mouseleave="stopDrag"
                 @touchstart="startTouchDrag"
                 @touchmove="onTouchDrag"
                 @touchend="stopDrag">
              <div class="position-dot" :style="{ left: bgPosition.x + '%', top: bgPosition.y + '%' }"></div>
            </div>
            <div class="position-info">
              <span>X: {{ Math.round(bgPosition.x) }}%</span>
              <span>Y: {{ Math.round(bgPosition.y) }}%</span>
            </div>
          </div>
          <label class="section-label" style="margin-top: var(--space-3)">图片缩放 ({{ bgScale }}%)</label>
          <input 
            type="range" 
            v-model.number="bgScale" 
            min="50" 
            max="200" 
            step="5"
            class="opacity-slider"
            @input="saveBgPosition"
          />
          <div class="slider-labels">
            <span>缩小</span>
            <span>放大</span>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="resetBgPosition">重置位置</button>
          <button class="btn-secondary" @click="closeBgModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 导出图片弹窗 -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal export-modal-simple">
        <h3>导出课表图片</h3>
        <p class="export-desc">将导出当前显示的完整课表，包括背景、透明度等所有设置</p>

        <div class="export-options">
          <div class="option-group">
            <label>格式</label>
            <select v-model="exportFormat">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>
          <div class="option-group">
            <label>质量</label>
            <select v-model="exportQuality">
              <option :value="0.8">高</option>
              <option :value="1">原图</option>
            </select>
          </div>
          <div class="option-group">
            <label>比例</label>
            <select v-model="exportScale">
              <option :value="1">1x</option>
              <option :value="2">2x</option>
            </select>
          </div>
          <div class="option-group">
            <label>包含背景</label>
            <select v-model="exportWithBg">
              <option :value="true">是</option>
              <option :value="false">否</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="closeExportModal">取消</button>
          <button class="btn-primary" @click="exportAsImage">导出图片</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { courseApi, scheduleSettingsApi, type Course as ApiCourse } from '@/services/api'

// 前端使用的 Course 类型（兼容 API 返回的 number id）
interface Course {
  id: number | string
  name: string
  code: string
  hours: number
  day: string
  period: number
  weeks: string
  room: string
  teacher: string
  target: string
  color: string
  term: string
}

const weekDays = [
  { name: '周一', value: 'mon', date: '' },
  { name: '周二', value: 'tue', date: '' },
  { name: '周三', value: 'wed', date: '' },
  { name: '周四', value: 'thu', date: '' },
  { name: '周五', value: 'fri', date: '' }
]

const morningPeriods = [
  { index: 1, time: '08:00-08:40' },
  { index: 2, time: '08:45-09:25' },
  { index: 3, time: '09:45-10:25' },
  { index: 4, time: '10:30-11:10' },
  { index: 5, time: '11:15-11:55' }
]

const afternoonPeriods = [
  { index: 6, time: '14:30-15:10' },
  { index: 7, time: '15:15-15:55' },
  { index: 8, time: '16:15-16:55' },
  { index: 9, time: '17:00-17:40' }
]

const eveningPeriods = [
  { index: 10, time: '19:00-19:40' },
  { index: 11, time: '19:45-20:25' },
  { index: 12, time: '20:30-21:10' }
]

const courseColors = [
  '#FFE4E1', '#E6E6FA', '#E0FFFF', '#F0FFF0', '#FFF8DC',
  '#FFE4B5', '#E6F3FF', '#FFF0F5', '#F5F5DC', '#E8F5E9',
  '#FFF3E0', '#F3E5F5', '#E1F5FE', '#F9FBE7', '#FFEBEE'
]

const terms = [
  { label: '2024-2025学年 第一学期', value: '2024-2025-1' },
  { label: '2024-2025学年 第二学期', value: '2024-2025-2' },
  { label: '2023-2024学年 第一学期', value: '2023-2024-1' },
  { label: '2023-2024学年 第二学期', value: '2023-2024-2' }
]

const backgroundOptions = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
]

const currentTerm = ref('2024-2025-1')
const currentWeek = ref(8)
const courses = ref<Course[]>([])
const showAddModal = ref(false)
const showDetailModal = ref(false)
const showBgModal = ref(false)
const editingId = ref<string | null>(null)
const selectedCourse = ref<Course | null>(null)
const notificationEnabled = ref(false)
const customBgUrl = ref('')
const background = ref('')
const backgroundOpacity = ref(0.15)
const tableOpacity = ref(0.95)
const bgPosition = ref({ x: 50, y: 50 }) // 背景位置百分比
const bgScale = ref(100) // 背景缩放百分比
const showExportModal = ref(false)
const exportFormat = ref('png')
const exportQuality = ref(1)

let notificationTimer: ReturnType<typeof setInterval> | null = null
let isDraggingBg = false
let dragStartPos = { x: 0, y: 0 }

const form = ref({
  name: '',
  code: '',
  hours: 48,
  day: 'mon',
  period: 1,
  weeks: '2-17周',
  room: '',
  color: courseColors[0],
  teacher: '',
  target: '',
  term: currentTerm.value
})

const backgroundStyle = computed(() => {
  const opacity = backgroundOpacity.value
  if (background.value.startsWith('http') || background.value.startsWith('data:')) {
    return {
      backgroundImage: `linear-gradient(rgba(255,255,255,${1-opacity}), rgba(255,255,255,${1-opacity})), url(${background.value})`,
      backgroundSize: `${bgScale.value}%`,
      backgroundAttachment: 'fixed',
      backgroundPosition: `${bgPosition.value.x}% ${bgPosition.value.y}%`
    }
  }
  if (background.value) {
    return {
      background: background.value
    }
  }
  return {
    background: 'var(--bg-primary)'
  }
})

const tableStyle = computed(() => {
  return {
    background: `rgba(255, 255, 255, ${tableOpacity.value})`,
    backdropFilter: tableOpacity.value < 1 ? 'blur(10px)' : 'none'
  }
})

const allPeriods = computed(() => [...morningPeriods, ...afternoonPeriods, ...eveningPeriods])

// 导出设置
const exportScale = ref(2)
const exportWithBg = ref(true)
const scheduleWrapper = ref<HTMLElement | null>(null)
const scheduleTable = ref<HTMLElement | null>(null)

// 复制粘贴功能
const copiedCourse = ref<Course | null>(null)

function copyCourse(course: Course) {
  copiedCourse.value = { ...course }
  alert(`已复制课程：${course.name}`)
}

async function pasteCourse(day: string, period: number) {
  if (!copiedCourse.value) {
    alert('请先复制一个课程')
    return
  }

  // 检查目标位置是否已有课程
  const existingCourse = getCourse(day, period)
  if (existingCourse) {
    if (!confirm(`该时段已有课程 "${existingCourse.name}"，是否覆盖？`)) {
      return
    }
    // 删除原有课程
    const existingId = typeof existingCourse.id === 'string' ? parseInt(existingCourse.id) : existingCourse.id
    await deleteCourseFromApi(existingId)
  }

  // 创建新课程
  const { id, created_at, updated_at, ...courseData } = copiedCourse.value as any
  const newCourseData = {
    ...courseData,
    day,
    period,
    term: currentTerm.value
  }

  try {
    const newCourse = await courseApi.createCourse(newCourseData)
    courses.value.push(newCourse)
    alert(`已粘贴课程：${newCourse.name} 到 ${weekDays.find(d => d.value === day)?.name} 第${period}节`)
  } catch (error) {
    alert('粘贴失败，请检查网络连接')
  }
}

function isToday(dayValue: string) {
  const dayMap: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
  return dayMap[dayValue] === new Date().getDay()
}

function getCourse(day: string, period: number): Course | undefined {
  return courses.value.find(c => c.day === day && c.period === period && c.term === currentTerm.value)
}

function getCourseColor(course: Course): string {
  return course.color || '#E3F2FD'
}

function isActiveWeek(course: Course): boolean {
  const match = course.weeks.match(/(\d+)-(\d+)周/)
  if (!match) return true
  const startWeek = parseInt(match[1])
  const endWeek = parseInt(match[2])
  return currentWeek.value >= startWeek && currentWeek.value <= endWeek
}

function changeWeek(delta: number) {
  currentWeek.value = Math.max(1, Math.min(20, currentWeek.value + delta))
}

function selectSlot(day: string, period: number) {
  form.value.day = day
  form.value.period = period
  form.value.term = currentTerm.value
  showAddModal.value = true
}

function handleCellClick(day: string, period: number, event: MouseEvent) {
  const course = getCourse(day, period)
  if (course) {
    // 如果点击的是课程块，显示详情
    showCourseDetail(course)
  } else {
    // 如果点击的是空单元格，检查是否有复制的课程
    if (copiedCourse.value) {
      // 按住Shift键点击粘贴
      if (event.shiftKey) {
        pasteCourse(day, period)
      } else {
        selectSlot(day, period)
      }
    } else {
      selectSlot(day, period)
    }
  }
}

function handleCellRightClick(day: string, period: number) {
  const course = getCourse(day, period)
  if (course) {
    // 右键点击课程，复制
    copyCourse(course)
  } else if (copiedCourse.value) {
    // 右键点击空单元格，粘贴
    pasteCourse(day, period)
  }
}

function showCourseDetail(course: Course) {
  selectedCourse.value = course
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedCourse.value = null
}

function editCourse(course: Course) {
  closeDetailModal()
  editingId.value = course.id
  form.value = {
    name: course.name,
    code: course.code,
    hours: course.hours,
    day: course.day,
    period: course.period,
    weeks: course.weeks,
    room: course.room,
    color: course.color || courseColors[0],
    teacher: course.teacher,
    target: course.target,
    term: course.term
  }
  showAddModal.value = true
}

async function deleteCourse(id: string | number) {
  if (confirm('确定要删除这门课程吗？')) {
    try {
      const courseId = typeof id === 'string' ? parseInt(id) : id
      await deleteCourseFromApi(courseId)
      closeDetailModal()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

function closeAddModal() {
  showAddModal.value = false
  editingId.value = null
  form.value = {
    name: '',
    code: '',
    hours: 48,
    day: 'mon',
    period: 1,
    weeks: '2-17周',
    room: '',
    color: courseColors[0],
    teacher: '',
    target: '',
    term: currentTerm.value
  }
}

async function saveCourse() {
  try {
    if (editingId.value) {
      // 更新现有课程
      const courseId = typeof editingId.value === 'string' ? parseInt(editingId.value) : editingId.value as number
      await updateCourseToApi(courseId, form.value)
    } else {
      // 创建新课程
      await saveCourseToApi(form.value)
    }
    closeAddModal()
  } catch (error) {
    console.error('保存课程失败:', error)
  }
}

// 从后端 API 加载课程
async function loadCourses() {
  try {
    const data = await courseApi.getCourses(currentTerm.value)
    courses.value = data
  } catch (error) {
    console.error('加载课程失败:', error)
    // 如果 API 不可用，使用本地数据（开发时）
    const saved = localStorage.getItem('student_courses_v3')
    if (saved) {
      courses.value = JSON.parse(saved)
    }
  }
}

// 保存课程到后端 API
async function saveCourseToApi(courseData: Omit<Course, 'id'>) {
  try {
    const newCourse = await courseApi.createCourse(courseData)
    courses.value.push(newCourse)
    return newCourse
  } catch (error) {
    console.error('保存课程失败:', error)
    alert('保存失败，请检查网络连接')
    throw error
  }
}

// 更新课程到后端 API
async function updateCourseToApi(id: number, courseData: Partial<Course>) {
  try {
    const updated = await courseApi.updateCourse(id, courseData)
    const index = courses.value.findIndex(c => c.id === id)
    if (index !== -1) {
      courses.value[index] = updated
    }
    return updated
  } catch (error) {
    console.error('更新课程失败:', error)
    alert('更新失败，请检查网络连接')
    throw error
  }
}

// 删除课程
async function deleteCourseFromApi(id: number) {
  try {
    await courseApi.deleteCourse(id)
    courses.value = courses.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('删除课程失败:', error)
    alert('删除失败，请检查网络连接')
    throw error
  }
}

// 背景设置
const fileInput = ref<HTMLInputElement | null>(null)

async function setBackground(bg: string) {
  background.value = bg
  // 同时保存到后端和本地
  localStorage.setItem('schedule_background', bg)
  await saveSettingsToApi()
}

function setCustomBackground() {
  if (customBgUrl.value) {
    setBackground(customBgUrl.value)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

function processImageFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    if (result) {
      setBackground(result)
    }
  }
  reader.readAsDataURL(file)
}

function removeBackground() {
  setBackground('')
}

// 保存设置到后端 API
async function saveSettingsToApi() {
  try {
    await scheduleSettingsApi.updateSettings({
      background: background.value,
      background_opacity: backgroundOpacity.value,
      table_opacity: tableOpacity.value,
      bg_position_x: bgPosition.value.x,
      bg_position_y: bgPosition.value.y,
      bg_scale: bgScale.value,
      notification_enabled: notificationEnabled.value
    })
  } catch (error) {
    console.error('保存设置失败:', error)
    // 失败时保存到本地作为备份
    localStorage.setItem('schedule_bg_opacity', backgroundOpacity.value.toString())
    localStorage.setItem('schedule_table_opacity', tableOpacity.value.toString())
    localStorage.setItem('schedule_bg_position', JSON.stringify(bgPosition.value))
    localStorage.setItem('schedule_bg_scale', bgScale.value.toString())
  }
}

// 从后端 API 加载设置
async function loadSettingsFromApi() {
  try {
    const settings = await scheduleSettingsApi.getSettings()
    background.value = settings.background || ''
    backgroundOpacity.value = settings.background_opacity ?? 0.15
    tableOpacity.value = settings.table_opacity ?? 0.95
    bgPosition.value = {
      x: settings.bg_position_x ?? 50,
      y: settings.bg_position_y ?? 50
    }
    bgScale.value = settings.bg_scale ?? 100
    notificationEnabled.value = settings.notification_enabled ?? false
  } catch (error) {
    console.error('加载设置失败:', error)
    // 从本地加载作为备份
    const savedBgOpacity = localStorage.getItem('schedule_bg_opacity')
    if (savedBgOpacity) backgroundOpacity.value = parseFloat(savedBgOpacity)
    const savedTableOpacity = localStorage.getItem('schedule_table_opacity')
    if (savedTableOpacity) tableOpacity.value = parseFloat(savedTableOpacity)
    const savedBgPosition = localStorage.getItem('schedule_bg_position')
    if (savedBgPosition) bgPosition.value = JSON.parse(savedBgPosition)
    const savedBgScale = localStorage.getItem('schedule_bg_scale')
    if (savedBgScale) bgScale.value = parseInt(savedBgScale)
  }
}

function saveOpacitySettings() {
  saveSettingsToApi()
}

function saveBgPosition() {
  saveSettingsToApi()
}

function startDrag(e: MouseEvent) {
  isDraggingBg = true
  updateBgPosition(e)
}

function onDrag(e: MouseEvent) {
  if (!isDraggingBg) return
  updateBgPosition(e)
}

function stopDrag() {
  isDraggingBg = false
  saveBgPosition()
}

function updateBgPosition(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  bgPosition.value = {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  }
}

function startTouchDrag(e: TouchEvent) {
  isDraggingBg = true
  updateTouchBgPosition(e)
}

function onTouchDrag(e: TouchEvent) {
  if (!isDraggingBg) return
  updateTouchBgPosition(e)
  e.preventDefault()
}

function updateTouchBgPosition(e: TouchEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const touch = e.touches[0]
  const x = ((touch.clientX - rect.left) / rect.width) * 100
  const y = ((touch.clientY - rect.top) / rect.height) * 100
  bgPosition.value = {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  }
}

function resetBgPosition() {
  bgPosition.value = { x: 50, y: 50 }
  bgScale.value = 100
  saveBgPosition()
}

function closeBgModal() {
  showBgModal.value = false
  customBgUrl.value = ''
}

// 导出课表数据
function exportSchedule() {
  showExportModal.value = true
}

function closeExportModal() {
  showExportModal.value = false
}

// 使用html2canvas导出图片 - 直接捕获页面上显示的课表
async function exportAsImage() {
  if (!scheduleWrapper.value) return

  try {
    const html2canvas = (await import('html2canvas')).default

    // 等待图片加载完成（如果有背景图片）
    if (background.value && (background.value.startsWith('http') || background.value.startsWith('data:'))) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = background.value
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
        setTimeout(resolve, 500)
      })
    }

    // 保存原始样式
    const originalStyles = {
      maxHeight: scheduleWrapper.value.style.maxHeight,
      overflow: scheduleWrapper.value.style.overflow,
      background: scheduleWrapper.value.style.background,
      backgroundImage: scheduleWrapper.value.style.backgroundImage,
      backgroundSize: scheduleWrapper.value.style.backgroundSize,
      backgroundPosition: scheduleWrapper.value.style.backgroundPosition,
      backgroundAttachment: scheduleWrapper.value.style.backgroundAttachment,
      backgroundRepeat: scheduleWrapper.value.style.backgroundRepeat
    }

    // 获取课表的完整尺寸
    const fullHeight = scheduleTable.value?.scrollHeight || scheduleWrapper.value.scrollHeight
    const fullWidth = scheduleTable.value?.scrollWidth || scheduleWrapper.value.scrollWidth

    // 关键修复：html2canvas 不支持 background-attachment: fixed
    // 需要临时改为 scroll 模式，并确保背景覆盖整个内容区域
    if (exportWithBg.value && background.value) {
      const opacity = backgroundOpacity.value
      
      if (background.value.startsWith('http') || background.value.startsWith('data:')) {
        // 图片背景：临时改为 scroll 模式，使用 cover 覆盖整个区域
        scheduleWrapper.value.style.backgroundImage = `linear-gradient(rgba(255,255,255,${1-opacity}), rgba(255,255,255,${1-opacity})), url(${background.value})`
        scheduleWrapper.value.style.backgroundSize = 'cover'
        scheduleWrapper.value.style.backgroundPosition = 'center center'
        scheduleWrapper.value.style.backgroundAttachment = 'scroll'
        scheduleWrapper.value.style.backgroundRepeat = 'no-repeat'
      } else {
        // 渐变色背景
        scheduleWrapper.value.style.background = background.value
      }
    } else if (!exportWithBg.value) {
      // 不包含背景时设为白色背景
      scheduleWrapper.value.style.background = '#ffffff'
    }

    // 临时移除滚动限制，确保捕获完整内容
    scheduleWrapper.value.style.maxHeight = 'none'
    scheduleWrapper.value.style.overflow = 'visible'

    // 捕获整个课表
    const canvas = await html2canvas(scheduleWrapper.value, {
      scale: exportScale.value,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: fullWidth,
      height: fullHeight,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0
    })

    // 恢复原始样式
    scheduleWrapper.value.style.maxHeight = originalStyles.maxHeight
    scheduleWrapper.value.style.overflow = originalStyles.overflow
    scheduleWrapper.value.style.background = originalStyles.background
    scheduleWrapper.value.style.backgroundImage = originalStyles.backgroundImage
    scheduleWrapper.value.style.backgroundSize = originalStyles.backgroundSize
    scheduleWrapper.value.style.backgroundPosition = originalStyles.backgroundPosition
    scheduleWrapper.value.style.backgroundAttachment = originalStyles.backgroundAttachment
    scheduleWrapper.value.style.backgroundRepeat = originalStyles.backgroundRepeat

    // 下载图片
    const link = document.createElement('a')
    link.download = `课程表_${currentTerm.value}_第${currentWeek.value}周.${exportFormat.value}`
    link.href = canvas.toDataURL(`image/${exportFormat.value}`, exportQuality.value)
    link.click()

    closeExportModal()
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请重试')
  }
}

// 通知功能
async function toggleNotification() {
  notificationEnabled.value = !notificationEnabled.value
  localStorage.setItem('schedule_notification', notificationEnabled.value.toString())
  await saveSettingsToApi()

  if (notificationEnabled.value) {
    startNotificationTimer()
  } else {
    stopNotificationTimer()
  }
}

function startNotificationTimer() {
  checkUpcomingCourses()
  notificationTimer = setInterval(checkUpcomingCourses, 60000) // 每分钟检查一次
}

function stopNotificationTimer() {
  if (notificationTimer) {
    clearInterval(notificationTimer)
    notificationTimer = null
  }
}

function checkUpcomingCourses() {
  const now = new Date()
  const currentDay = now.getDay()
  const dayMap: Record<number, string> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' }
  const today = dayMap[currentDay]
  
  if (!today) return // 周末不检查
  
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute
  
  const allPeriods = [...morningPeriods, ...afternoonPeriods, ...eveningPeriods]
  
  allPeriods.forEach(period => {
    const course = getCourse(today, period.index)
    if (course && isActiveWeek(course)) {
      const [startHour, startMinute] = period.time.split('-')[0].split(':').map(Number)
      const courseStartTime = startHour * 60 + startMinute
      const timeDiff = courseStartTime - currentTime
      
      // 提前30分钟提醒
      if (timeDiff > 0 && timeDiff <= 30) {
        showNotification(course, period)
      }
    }
  })
}

function showNotification(course: Course, period: { index: number; time: string }) {
  if ('Notification' in window && Notification.permission === 'grmitted') {
    new Notification('即将上课', {
      body: `${course.name} 第${period.index}节 ${period.time} ${course.room}`,
      icon: '/favicon.ico'
    })
  } else {
    // 使用alert作为降级方案
    alert(`即将上课：${course.name}\n时间：第${period.index}节 ${period.time}\n地点：${course.room}`)
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

onMounted(async () => {
  // 从后端 API 加载设置
  await loadSettingsFromApi()

  // 加载课程数据
  await loadCourses()

  // 加载通知设置（本地）
  const savedNotification = localStorage.getItem('schedule_notification')
  if (savedNotification === 'true') {
    notificationEnabled.value = true
    requestNotificationPermission()
    startNotificationTimer()
  }

  // 计算当前周
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  currentWeek.value = Math.min(20, Math.max(1, weekNumber - 8))
})

onUnmounted(() => {
  stopNotificationTimer()
})
</script>

<style scoped>
.student-schedule {
  padding: var(--space-4);
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.term-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.week-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow {
  display: block;
  width: 8px;
  height: 8px;
  border-style: solid;
  border-color: var(--text-primary);
  border-width: 0 2px 2px 0;
}

.arrow.left {
  transform: rotate(135deg);
}

.arrow.right {
  transform: rotate(-45deg);
}

.week-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  min-width: 70px;
  text-align: center;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.btn-small {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  margin-top: var(--space-2);
}

/* 通知栏 */
.notification-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: rgba(209, 250, 229, 0.9);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
}

.notification-bar.disabled {
  background: rgba(241, 245, 249, 0.9);
}

/* 复制粘贴提示 */
.copy-hint {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(254, 243, 199, 0.9);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  border: 1px solid #fbbf24;
}

.copy-hint span {
  color: #92400e;
  font-weight: var(--font-weight-medium);
}

.hint-detail {
  font-size: var(--font-size-xs);
  color: #a16207;
  margin-left: auto;
}

.btn-clear {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  color: #92400e;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #fbbf24;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.8);
}

.notify-icon {
  width: 16px;
  height: 16px;
  background: #10b981;
  border-radius: 50%;
}

.notify-icon.off {
  background: var(--text-muted);
}

.btn-toggle {
  margin-left: auto;
  padding: var(--space-1) var(--space-2);
  border: none;
  background: white;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

/* 课程表容器 */
.schedule-wrapper {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 250px);
  transition: background 0.3s;
  position: relative;
}

.schedule-table {
  min-width: 1000px;
  display: flex;
  flex-direction: column;
}

/* 表头 */
.table-header {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border);
}

.time-header {
  padding: var(--space-3);
  text-align: center;
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  border-right: 1px solid var(--border-light);
}

.day-header {
  padding: var(--space-3);
  text-align: center;
  border-right: 1px solid var(--border-light);
}

.day-header:last-child {
  border-right: none;
}

.day-header.today {
  background: var(--accent-primary);
  color: white;
}

.day-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.day-date {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.day-header.today .day-date {
  color: rgba(255, 255, 255, 0.8);
}

/* 固定表头 */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.sticky-header .time-header,
.sticky-header .day-header {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

/* 时段标题 */
.section-header {
  padding: var(--space-2) var(--space-3);
  background: #f0f7ff;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  text-align: center;
  border-bottom: 1px solid var(--border-light);
}

/* 表格行 */
.table-row {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
  border-bottom: 1px solid var(--border-light);
  min-height: 80px;
}

.time-cell {
  padding: var(--space-2);
  text-align: center;
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--bg-secondary);
}

.period-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.period-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 课程单元格 */
.course-cell {
  padding: 4px;
  border-right: 1px solid var(--border-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.course-cell:hover {
  background-color: var(--bg-hover);
}

.course-cell.has-course:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 课程块 */
.course-block {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  height: 100%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.course-block:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.course-block.active-week {
  box-shadow: 0 0 0 2px var(--accent-primary);
}

.course-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: 1.3;
}

.course-code {
  font-size: 10px;
  color: var(--text-secondary);
}

.course-weeks {
  font-size: 10px;
  color: var(--text-muted);
}

.course-room {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: auto;
}

/* 休息行 */
.break-row {
  padding: var(--space-2);
  background: #fff8e1;
  text-align: center;
  border-bottom: 1px solid var(--border-light);
}

.break-row.dinner {
  background: #fce4ec;
}

.break-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

/* 详情弹窗 */
.detail-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.detail-modal h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
}

.close-btn:hover {
  background: var(--bg-hover);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.detail-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  text-align: right;
  max-width: 60%;
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* 表单 */
.form-group {
  margin-bottom: var(--space-3);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.color-picker {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn.selected {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--text-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.btn-danger {
  padding: var(--space-3) var(--space-4);
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* 背景弹窗样式 */
.bg-modal {
  max-width: 500px;
}

.bg-section {
  margin-bottom: var(--space-4);
}

.section-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

/* 背景选项 */
.bg-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.bg-option {
  cursor: pointer;
  text-align: center;
}

.bg-preview {
  width: 100%;
  height: 50px;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-1);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.bg-preview.active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
}

.bg-preview.default {
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.bg-option:hover .bg-preview {
  border-color: var(--accent-primary);
}

.bg-option span {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--accent-primary);
  background: var(--bg-hover);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.upload-icon {
  font-size: 32px;
  color: var(--accent-primary);
}

.upload-placeholder span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.upload-preview {
  position: relative;
  width: 100%;
  height: 120px;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.remove-img-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--error);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* URL输入 */
.url-input-group {
  display: flex;
  gap: var(--space-2);
}

.url-input-group input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 透明度滑块 */
.opacity-slider {
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  outline: none;
  -webkit-appearance: none;
  margin: var(--space-2) 0;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.opacity-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 图片位置控制 */
.position-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.position-preview {
  width: 100%;
  height: 120px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  position: relative;
  cursor: crosshair;
  border: 2px solid var(--border);
  overflow: hidden;
}

.position-preview::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border);
}

.position-preview::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border);
}

.position-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  background: var(--accent-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: grab;
}

.position-dot:active {
  cursor: grabbing;
}

.position-info {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 导出弹窗 */
.export-modal-simple {
  max-width: 500px;
  width: 90%;
}

.export-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  text-align: center;
}

.export-header h2 {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.export-header p {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.export-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.export-row {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  gap: 2px;
  min-height: 60px;
}

.export-row.header {
  min-height: 40px;
}

.export-row.header .time-col,
.export-row.header .day-col {
  background: var(--accent-primary);
  color: white;
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-col {
  background: var(--bg-secondary);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: var(--font-size-xs);
}

.period-num {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.period-time {
  color: var(--text-secondary);
  font-size: 10px;
}

.day-col {
  background: var(--bg-secondary);
  padding: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-col {
  background: white;
  padding: 2px;
  min-height: 60px;
}

.export-course {
  height: 100%;
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.export-course .course-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: 1.2;
}

.export-course .course-room {
  font-size: 10px;
  color: var(--text-secondary);
}

.export-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.option-group select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 响应式 - 移动端优化 */
@media (max-width: 768px) {
  .student-schedule {
    padding: var(--space-2);
  }

  .schedule-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-height: calc(100vh - 200px);
  }

  .schedule-table {
    min-width: 600px;
  }

  /* 表头缩小 */
  .table-header {
    grid-template-columns: 60px repeat(5, 1fr);
  }

  .time-header,
  .day-header {
    padding: var(--space-2);
  }

  .day-name {
    font-size: var(--font-size-sm);
  }

  .day-date {
    font-size: var(--font-size-xs);
  }

  /* 时间段缩小 */
  .table-row {
    grid-template-columns: 60px repeat(5, 1fr);
  }

  .time-cell {
    padding: var(--space-1);
  }

  .period-name {
    font-size: var(--font-size-xs);
  }

  .period-time {
    font-size: 10px;
  }

  /* 课程块缩小 */
  .course-cell {
    min-height: 60px;
    padding: 2px;
  }

  .course-block {
    padding: var(--space-1);
    min-height: 56px;
  }

  .course-name {
    font-size: 11px;
  }

  .course-code,
  .course-weeks,
  .course-room {
    font-size: 9px;
  }

  /* 页面头部 */
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .page-header h1 {
    font-size: var(--font-size-xl);
    text-align: center;
  }

  .header-controls {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
  }

  .header-controls button,
  .header-controls select {
    padding: var(--space-2);
    font-size: var(--font-size-sm);
  }

  /* 周导航 */
  .week-nav {
    order: -1;
    width: 100%;
    justify-content: center;
  }

  .week-title {
    font-size: var(--font-size-base);
  }

  /* 通知栏 */
  .notification-bar {
    flex-wrap: wrap;
    font-size: var(--font-size-xs);
    padding: var(--space-2);
  }

  /* 复制提示 */
  .copy-hint {
    flex-wrap: wrap;
    font-size: var(--font-size-xs);
    padding: var(--space-2);
  }

  .hint-detail {
    width: 100%;
    margin-left: 0;
    margin-top: var(--space-1);
  }

  /* 弹窗适配 */
  .modal {
    padding: var(--space-4);
    margin: var(--space-2);
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .bg-options {
    grid-template-columns: repeat(3, 1fr);
  }

  .url-input-group {
    flex-direction: column;
  }

  .export-options {
    grid-template-columns: 1fr;
  }

  .export-modal-simple {
    width: 95%;
    padding: var(--space-4);
  }

  /* 午休行 */
  .break-row {
    padding: var(--space-1);
  }

  .break-label {
    font-size: var(--font-size-xs);
  }

  /* 节次标题 */
  .section-header {
    padding: var(--space-1);
    font-size: var(--font-size-xs);
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .schedule-table {
    min-width: 500px;
  }

  .table-header {
    grid-template-columns: 50px repeat(5, 1fr);
  }

  .table-row {
    grid-template-columns: 50px repeat(5, 1fr);
  }

  .course-cell {
    min-height: 50px;
  }

  .course-block {
    min-height: 46px;
  }

  .course-name {
    font-size: 10px;
  }
}
</style>