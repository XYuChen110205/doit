<template>
  <div class="notes-history-view">
    <div class="page-header">
      <h1>📝 笔记历史</h1>
      <div class="header-actions">
        <router-link to="/today" class="back-btn">← 返回今日</router-link>
      </div>
    </div>

    <!-- 日历选择器 -->
    <div class="calendar-section">
      <div class="calendar-header">
        <button class="nav-btn" @click="changeMonth(-1)">←</button>
        <span class="current-month">{{ currentYearMonth }}</span>
        <button class="nav-btn" @click="changeMonth(1)">→</button>
      </div>
      <div class="weekdays">
        <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="date in calendarDays"
          :key="date.dateStr"
          class="calendar-day"
          :class="{
            'other-month': !date.isCurrentMonth,
            'has-note': date.hasNote,
            'selected': selectedDate === date.dateStr,
            'today': date.isToday
          }"
          @click="selectDate(date)"
        >
          <span class="day-number">{{ date.day }}</span>
          <span v-if="date.hasNote" class="note-indicator">●</span>
        </div>
      </div>
    </div>

    <!-- 笔记列表 -->
    <div class="notes-list-section">
      <div class="section-header">
        <h2>历史笔记</h2>
        <span class="note-count">共 {{ notesList.length }} 条</span>
      </div>
      
      <div class="notes-list">
        <div
          v-for="note in filteredNotes"
          :key="note.note_date"
          class="note-card"
          :class="{ 'is-today': note.note_date === today }"
          @click="viewNote(note)"
        >
          <div class="note-date">
            <span class="date-day">{{ formatDay(note.note_date) }}</span>
            <span class="date-month">{{ formatMonth(note.note_date) }}</span>
          </div>
          <div class="note-content">
            <p class="note-preview">{{ truncateContent(note.content) || '（空笔记）' }}</p>
            <span class="note-time">{{ formatTime(note.updated_at) }}</span>
          </div>
          <div class="note-actions">
            <button class="action-btn" @click.stop="editNote(note)" title="编辑">✏️</button>
            <button class="action-btn delete" @click.stop="deleteNoteItem(note)" title="删除">🗑️</button>
          </div>
        </div>
      </div>

      <div v-if="filteredNotes.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>该月暂无笔记</p>
      </div>
    </div>

    <!-- 查看/编辑笔记弹窗 -->
    <div v-if="showNoteModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingNote ? '编辑笔记' : '查看笔记' }} - {{ formatFullDate(selectedNote?.note_date) }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <textarea
          v-model="noteContent"
          class="note-editor"
          placeholder="记录你的想法..."
          rows="10"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="saveNoteContent">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Note } from '../types'
import { getNotesList, saveNote, deleteNote } from '../api/notes'

const router = useRouter()

// 状态
const currentDate = ref(new Date())
const selectedDate = ref('')
const notesList = ref<Note[]>([])
const showNoteModal = ref(false)
const selectedNote = ref<Note | null>(null)
const noteContent = ref('')
const editingNote = ref(false)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const today = new Date().toISOString().split('T')[0]

// 计算属性
const currentYearMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

const filteredNotes = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return notesList.value.filter(note => {
    const noteDate = new Date(note.note_date)
    return noteDate.getFullYear() === year && noteDate.getMonth() === month
  }).sort((a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime())
})

// 生成日历天数
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  let firstDayWeek = firstDay.getDay()
  
  const days = []
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  
  // 上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(year, month - 1, day)
    const dateStr = formatDate(date)
    days.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === today,
      hasNote: notesList.value.some(n => n.note_date === dateStr && n.content)
    })
  }
  
  // 当前月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const dateStr = formatDate(date)
    days.push({
      day: i,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === today,
      hasNote: notesList.value.some(n => n.note_date === dateStr && n.content)
    })
  }
  
  // 下个月的日期
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    const dateStr = formatDate(date)
    days.push({
      day: i,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === today,
      hasNote: notesList.value.some(n => n.note_date === dateStr && n.content)
    })
  }
  
  return days
})

// 加载笔记列表
async function loadNotes() {
  notesList.value = await getNotesList(100)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function changeMonth(delta: number) {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentDate.value = newDate
}

function selectDate(date: { dateStr: string; hasNote: boolean }) {
  selectedDate.value = date.dateStr
  if (date.hasNote) {
    const note = notesList.value.find(n => n.note_date === date.dateStr)
    if (note) {
      viewNote(note)
    }
  } else {
    // 创建新笔记
    selectedNote.value = {
      note_date: date.dateStr,
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    noteContent.value = ''
    editingNote.value = true
    showNoteModal.value = true
  }
}

function viewNote(note: Note) {
  selectedNote.value = note
  noteContent.value = note.content
  editingNote.value = false
  showNoteModal.value = true
}

function editNote(note: Note) {
  selectedNote.value = note
  noteContent.value = note.content
  editingNote.value = true
  showNoteModal.value = true
}

async function saveNoteContent() {
  if (!selectedNote.value) return
  
  await saveNote(selectedNote.value.note_date, noteContent.value)
  await loadNotes()
  closeModal()
}

async function deleteNoteItem(note: Note) {
  if (!confirm('确定要删除这条笔记吗？')) return
  
  await deleteNote(note.note_date)
  await loadNotes()
}

function closeModal() {
  showNoteModal.value = false
  selectedNote.value = null
  noteContent.value = ''
  editingNote.value = false
}

// 格式化函数
function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString()
}

function formatMonth(dateStr: string): string {
  const month = new Date(dateStr).getMonth() + 1
  return `${month}月`
}

function formatFullDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

function truncateContent(content: string | undefined): string {
  if (!content) return ''
  return content.length > 100 ? content.slice(0, 100) + '...' : content
}

// 初始化
onMounted(() => {
  loadNotes()
})

// 监听日期变化
watch(currentDate, () => {
  // 可以在这里加载特定月份的笔记
})
</script>

<style scoped>
.notes-history-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.back-btn {
  padding: var(--space-2) var(--space-4);
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: var(--transition-normal);
}

.back-btn:hover {
  color: var(--accent-primary-hover);
}

/* 日历部分 */
.calendar-section {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--space-6);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-lg);
  transition: var(--transition-normal);
}

.nav-btn:hover {
  background: var(--bg-hover);
}

.current-month {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.weekday {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  padding: var(--space-2);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
}

.calendar-day:hover {
  background: var(--bg-hover);
}

.calendar-day.other-month {
  opacity: 0.4;
}

.calendar-day.today {
  background: var(--accent-primary);
  color: white;
}

.calendar-day.has-note:not(.today) {
  background: var(--accent-primary-light);
}

.calendar-day.selected {
  box-shadow: 0 0 0 2px var(--accent-primary);
}

.day-number {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.note-indicator {
  font-size: 8px;
  color: var(--accent-primary);
}

.calendar-day.today .note-indicator {
  color: white;
}

/* 笔记列表部分 */
.notes-list-section {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.note-count {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.note-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-normal);
}

.note-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateX(4px);
}

.note-card.is-today {
  border-left: 4px solid var(--accent-primary);
}

.note-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  padding: var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.date-day {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.date-month {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.note-content {
  flex: 1;
  min-width: 0;
}

.note-preview {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: var(--space-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.note-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.note-actions {
  display: flex;
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
  padding: var(--space-10);
  color: var(--text-muted);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--space-4);
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
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-float);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.note-editor {
  width: 100%;
  padding: var(--space-6);
  border: none;
  font-size: var(--font-size-md);
  line-height: 1.8;
  color: var(--text-primary);
  background: var(--bg-primary);
  resize: vertical;
  min-height: 200px;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
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

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

/* 响应式 */
@media (max-width: 768px) {
  .notes-history-view {
    padding: var(--space-4);
  }

  .calendar-section,
  .notes-list-section {
    padding: var(--space-4);
  }

  .note-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .note-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
