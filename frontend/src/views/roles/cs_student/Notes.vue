<template>
  <div class="notes-page">
    <!-- 左侧：科目列表 -->
    <div class="subjects-sidebar" :class="{ collapsed: subjectsCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!subjectsCollapsed">科目</h3>
        <div class="header-actions">
          <button class="add-btn" @click="showAddSubject = true" v-show="!subjectsCollapsed">+</button>
          <button class="collapse-btn" @click="subjectsCollapsed = !subjectsCollapsed">
            {{ subjectsCollapsed ? '→' : '←' }}
          </button>
        </div>
      </div>
      <div class="subject-list" v-show="!subjectsCollapsed">
        <div
          v-for="subject in subjects"
          :key="subject.id"
          class="subject-item"
          :class="{ active: currentSubject?.id === subject.id }"
          @click="selectSubject(subject)"
        >
          <span class="subject-icon">{{ subject.icon }}</span>
          <span class="subject-name" v-show="!subjectsCollapsed">{{ subject.name }}</span>
          <span class="subject-count" v-show="!subjectsCollapsed">{{ subject.chapters?.length || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 中间：章节列表 -->
    <div class="chapters-sidebar" v-if="currentSubject" :class="{ collapsed: chaptersCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!chaptersCollapsed">{{ currentSubject.name }}</h3>
        <div class="header-actions">
          <button class="add-btn" @click="showAddChapter = true" v-show="!chaptersCollapsed">+</button>
          <button class="collapse-btn" @click="chaptersCollapsed = !chaptersCollapsed">
            {{ chaptersCollapsed ? '→' : '←' }}
          </button>
        </div>
      </div>
      <div class="chapter-list" v-show="!chaptersCollapsed">
        <div
          v-for="chapter in currentSubject.chapters"
          :key="chapter.id"
          class="chapter-item"
          :class="{ active: currentChapter?.id === chapter.id }"
          @click="selectChapter(chapter)"
        >
          <span class="chapter-number">{{ chapter.order }}</span>
          <span class="chapter-name">{{ chapter.name }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：笔记内容 -->
    <div class="notes-content" v-if="currentChapter">
      <div class="content-header">
        <div class="header-title">
          <h2>{{ currentChapter.name }}</h2>
          <span class="breadcrumb">{{ currentSubject.name }} / 第{{ currentChapter.order }}章</span>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="showEditChapter = true">编辑章节</button>
          <button class="btn-secondary" @click="showImportModal = true">📥 导入</button>
          <button class="btn-primary" @click="saveNotes">保存</button>
        </div>
      </div>

      <div class="content-body">
        <!-- 富文本编辑器工具栏 -->
        <div class="editor-toolbar">
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="insertHeading(1)" title="一级标题">H1</button>
            <button class="toolbar-btn" @click="insertHeading(2)" title="二级标题">H2</button>
            <button class="toolbar-btn" @click="insertHeading(3)" title="三级标题">H3</button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="insertBold" title="粗体"><b>B</b></button>
            <button class="toolbar-btn" @click="insertItalic" title="斜体"><i>I</i></button>
            <button class="toolbar-btn" @click="insertCode" title="代码">&lt;/&gt;</button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="insertList" title="列表">☰</button>
            <button class="toolbar-btn" @click="insertLink" title="链接">🔗</button>
            <button class="toolbar-btn" @click="showImageUpload = true" title="插入图片">🖼️</button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button 
              class="toolbar-btn" 
              :class="{ active: previewMode }"
              @click="previewMode = !previewMode"
              title="预览"
            >
              👁️
            </button>
          </div>
        </div>

        <!-- 编辑/预览区域 -->
        <div class="editor-container">
          <!-- 编辑模式 -->
          <div v-show="!previewMode" class="editor-wrapper">
            <textarea
              ref="contentEditor"
              v-model="currentChapter.content"
              class="content-editor"
              placeholder="使用 Markdown 语法记录本章的核心概念、重点知识...&#10;&#10;支持：&#10;- # 一级标题&#10;- ## 二级标题&#10;- ### 三级标题&#10;- **粗体**&#10;- *斜体*&#10;- `代码`&#10;- - 列表项&#10;- [链接](url)&#10;- ![图片](url)"
              @keydown="handleKeydown"
            ></textarea>
          </div>

          <!-- 预览模式 -->
          <div v-show="previewMode" class="preview-wrapper">
            <div class="content-preview" v-html="renderMarkdown(currentChapter.content)"></div>
          </div>
        </div>

        <!-- 图片列表 -->
        <div class="images-section" v-if="currentChapter.images?.length">
          <div class="section-title">🖼️ 图片附件</div>
          <div class="images-grid">
            <div v-for="(image, index) in currentChapter.images" :key="index" class="image-item">
              <img :src="image.url" :alt="image.name" @click="viewImage(image)" />
              <button class="delete-image" @click="removeImage(index)">×</button>
            </div>
          </div>
        </div>

        <!-- 笔记区域 -->
        <div class="notes-section">
          <div class="section-title">📝 个人笔记</div>
          <textarea
            v-model="currentChapter.notes"
            class="notes-editor"
            placeholder="记录你的理解、疑问、心得..."
          ></textarea>
        </div>

        <!-- 代码片段区域 -->
        <div class="code-section">
          <div class="section-title">💻 代码片段</div>
          <div class="code-list">
            <div v-for="(snippet, index) in currentChapter.codeSnippets" :key="index" class="code-item">
              <div class="code-header">
                <input v-model="snippet.title" class="code-title" placeholder="代码标题" />
                <button class="delete-btn" @click="removeCodeSnippet(index)">×</button>
              </div>
              <textarea
                v-model="snippet.code"
                class="code-editor"
                placeholder="粘贴代码..."
              ></textarea>
            </div>
            <button class="add-code-btn" @click="addCodeSnippet">+ 添加代码片段</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="!currentSubject">
      <div class="empty-icon">📚</div>
      <p>选择一个科目开始学习</p>
      <p class="empty-hint">或点击 + 创建新科目</p>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">📖</div>
      <p>选择一个章节开始记笔记</p>
      <p class="empty-hint">或点击 + 创建新章节</p>
    </div>

    <!-- 添加科目弹窗 -->
    <div v-if="showAddSubject" class="modal-overlay" @click.self="showAddSubject = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加科目</h3>
          <button class="close-btn" @click="showAddSubject = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>科目名称</label>
            <input v-model="newSubject.name" type="text" placeholder="如：数据结构与算法" />
          </div>
          <div class="form-group">
            <label>图标</label>
            <div class="icon-picker">
              <button
                v-for="icon in iconOptions"
                :key="icon"
                class="icon-btn"
                :class="{ selected: newSubject.icon === icon }"
                @click="newSubject.icon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddSubject = false">取消</button>
          <button class="btn-primary" @click="addSubject">添加</button>
        </div>
      </div>
    </div>

    <!-- 添加章节弹窗 -->
    <div v-if="showAddChapter" class="modal-overlay" @click.self="showAddChapter = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加章节</h3>
          <button class="close-btn" @click="showAddChapter = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>章节名称</label>
            <input v-model="newChapter.name" type="text" placeholder="如：第一章 数组与链表" />
          </div>
          <div class="form-group">
            <label>章节序号</label>
            <input v-model.number="newChapter.order" type="number" min="1" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddChapter = false">取消</button>
          <button class="btn-primary" @click="addChapter">添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑章节弹窗 -->
    <div v-if="showEditChapter" class="modal-overlay" @click.self="showEditChapter = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑章节</h3>
          <button class="close-btn" @click="showEditChapter = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>章节名称</label>
            <input v-model="editChapterData.name" type="text" />
          </div>
          <div class="form-group">
            <label>章节序号</label>
            <input v-model.number="editChapterData.order" type="number" min="1" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-danger" @click="deleteChapter">删除章节</button>
          <button class="btn-secondary" @click="showEditChapter = false">取消</button>
          <button class="btn-primary" @click="updateChapter">保存</button>
        </div>
      </div>
    </div>

    <!-- 导入文件弹窗 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>导入文件</h3>
          <button class="close-btn" @click="showImportModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="import-options">
            <div class="import-option" @click="importFile('md')">
              <div class="import-icon">📝</div>
              <div class="import-info">
                <div class="import-title">Markdown (.md)</div>
                <div class="import-desc">导入 Markdown 格式的笔记文件</div>
              </div>
            </div>
            <div class="import-option" @click="importFile('txt')">
              <div class="import-icon">📄</div>
              <div class="import-info">
                <div class="import-title">文本文件 (.txt)</div>
                <div class="import-desc">导入纯文本格式的笔记</div>
              </div>
            </div>
            <div class="import-option" @click="importFile('html')">
              <div class="import-icon">🌐</div>
              <div class="import-info">
                <div class="import-title">HTML (.html)</div>
                <div class="import-desc">导入 HTML 格式的笔记</div>
              </div>
            </div>
            <div class="import-option" @click="showImageUpload = true">
              <div class="import-icon">🖼️</div>
              <div class="import-info">
                <div class="import-title">图片 (.png, .jpg, .gif)</div>
                <div class="import-desc">导入图片作为笔记附件</div>
              </div>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            style="display: none"
            :accept="fileAccept"
            @change="handleFileImport"
          />
        </div>
      </div>
    </div>

    <!-- 图片上传弹窗 -->
    <div v-if="showImageUpload" class="modal-overlay" @click.self="showImageUpload = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>插入图片</h3>
          <button class="close-btn" @click="showImageUpload = false">×</button>
        </div>
        <div class="modal-body">
          <div class="upload-area" @click="$refs.imageInput.click()" @drop.prevent="handleImageDrop" @dragover.prevent>
            <div class="upload-icon">🖼️</div>
            <p>点击或拖拽图片到此处</p>
            <p class="upload-hint">支持 PNG, JPG, GIF 格式</p>
          </div>
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageUpload"
          />
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="viewingImage" class="modal-overlay image-preview" @click.self="viewingImage = null">
      <div class="image-preview-content">
        <button class="close-btn" @click="viewingImage = null">×</button>
        <img :src="viewingImage.url" :alt="viewingImage.name" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface CodeSnippet {
  title: string
  code: string
}

interface NoteImage {
  name: string
  url: string
  type: string
}

interface Chapter {
  id: number
  name: string
  order: number
  content: string
  notes: string
  codeSnippets: CodeSnippet[]
  images: NoteImage[]
}

interface Subject {
  id: number
  name: string
  icon: string
  chapters: Chapter[]
}

const subjects = ref<Subject[]>([
  {
    id: 1,
    name: '数据结构与算法',
    icon: '📊',
    chapters: [
      {
        id: 1,
        name: '数组与链表',
        order: 1,
        content: '# 数组与链表\n\n## 数组\n- 连续内存存储\n- 支持随机访问\n- 时间复杂度 O(1)\n\n## 链表\n- 非连续存储\n- 通过指针连接\n- 插入删除 O(1)',
        notes: '数组适合查询多的场景，链表适合频繁增删的场景',
        codeSnippets: [
          { title: '链表节点定义', code: 'class ListNode:\n    def __init__(self, val=0):\n        self.val = val\n        self.next = None' }
        ],
        images: []
      },
      {
        id: 2,
        name: '栈与队列',
        order: 2,
        content: '# 栈与队列\n\n## 栈（Stack）\n- 后进先出 (LIFO)\n- 应用：函数调用、表达式求值\n\n## 队列（Queue）\n- 先进先出 (FIFO)\n- 应用：BFS、任务调度',
        notes: '',
        codeSnippets: [],
        images: []
      }
    ]
  },
  {
    id: 2,
    name: '操作系统',
    icon: '⚙️',
    chapters: [
      {
        id: 3,
        name: '进程管理',
        order: 1,
        content: '# 进程管理\n\n## 进程与线程\n- 进程是资源分配的基本单位\n- 线程是CPU调度的基本单位\n\n## 进程间通信\n- 管道、消息队列、共享内存、信号量、套接字',
        notes: '',
        codeSnippets: [],
        images: []
      }
    ]
  }
])

const currentSubject = ref<Subject | null>(null)
const currentChapter = ref<Chapter | null>(null)
const showAddSubject = ref(false)
const showAddChapter = ref(false)
const showEditChapter = ref(false)
const showImportModal = ref(false)
const showImageUpload = ref(false)
const subjectsCollapsed = ref(false)
const chaptersCollapsed = ref(false)
const previewMode = ref(false)
const viewingImage = ref<NoteImage | null>(null)
const fileAccept = ref('.md,.txt,.html')
const importType = ref('')

const contentEditor = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)

const newSubject = ref({ name: '', icon: '📚' })
const newChapter = ref({ name: '', order: 1 })
const editChapterData = ref({ name: '', order: 1 })

const iconOptions = ['📚', '💻', '🔢', '⚙️', '🌐', '🗄️', '🤖', '📱', '🔒', '📊']

// Markdown 渲染
function renderMarkdown(content: string): string {
  if (!content) return ''
  
  let html = content
    // 代码块
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // 标题
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="note-image" />')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 列表
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    // 换行
    .replace(/\n/g, '<br>')
  
  // 包裹列表项
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  
  return html
}

// 编辑器工具栏功能
function insertHeading(level: number) {
  const editor = contentEditor.value
  if (!editor) return
  
  const start = editor.selectionStart
  const end = editor.selectionEnd
  const text = editor.value
  const before = text.substring(0, start)
  const after = text.substring(end)
  const hashes = '#'.repeat(level) + ' '
  
  editor.value = before + '\n' + hashes + after
  currentChapter.value!.content = editor.value
  
  nextTick(() => {
    editor.selectionStart = editor.selectionEnd = start + level + 2
    editor.focus()
  })
}

function insertBold() {
  insertWrap('**', '**')
}

function insertItalic() {
  insertWrap('*', '*')
}

function insertCode() {
  insertWrap('`', '`')
}

function insertList() {
  const editor = contentEditor.value
  if (!editor) return
  
  const start = editor.selectionStart
  const text = editor.value
  const before = text.substring(0, start)
  const after = text.substring(start)
  
  editor.value = before + '\n- ' + after
  currentChapter.value!.content = editor.value
  
  nextTick(() => {
    editor.selectionStart = editor.selectionEnd = start + 3
    editor.focus()
  })
}

function insertLink() {
  const url = prompt('请输入链接地址：', 'https://')
  if (url) {
    insertWrap('[', '](' + url + ')')
  }
}

function insertWrap(before: string, after: string) {
  const editor = contentEditor.value
  if (!editor) return
  
  const start = editor.selectionStart
  const end = editor.selectionEnd
  const text = editor.value
  const selected = text.substring(start, end)
  
  editor.value = text.substring(0, start) + before + selected + after + text.substring(end)
  currentChapter.value!.content = editor.value
  
  nextTick(() => {
    editor.selectionStart = start + before.length
    editor.selectionEnd = end + before.length
    editor.focus()
  })
}

function handleKeydown(e: KeyboardEvent) {
  // Tab 键插入缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    const editor = contentEditor.value
    if (!editor) return
    
    const start = editor.selectionStart
    const end = editor.selectionEnd
    const text = editor.value
    
    editor.value = text.substring(0, start) + '  ' + text.substring(end)
    currentChapter.value!.content = editor.value
    
    nextTick(() => {
      editor.selectionStart = editor.selectionEnd = start + 2
    })
  }
}

// 图片处理
function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !currentChapter.value) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string
    currentChapter.value!.images.push({
      name: file.name,
      url: url,
      type: file.type
    })
    
    // 在内容中插入图片引用
    const imageMarkdown = `\n![${file.name}](${url})\n`
    currentChapter.value!.content += imageMarkdown
    
    showImageUpload.value = false
    saveSubjects()
  }
  reader.readAsDataURL(file)
}

function handleImageDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (!file || !file.type.startsWith('image/') || !currentChapter.value) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string
    currentChapter.value!.images.push({
      name: file.name,
      url: url,
      type: file.type
    })
    
    const imageMarkdown = `\n![${file.name}](${url})\n`
    currentChapter.value!.content += imageMarkdown
    
    showImageUpload.value = false
    saveSubjects()
  }
  reader.readAsDataURL(file)
}

function viewImage(image: NoteImage) {
  viewingImage.value = image
}

function removeImage(index: number) {
  if (!currentChapter.value) return
  currentChapter.value.images.splice(index, 1)
  saveSubjects()
}

// 文件导入
function importFile(type: string) {
  importType.value = type
  const accepts: Record<string, string> = {
    md: '.md',
    txt: '.txt',
    html: '.html'
  }
  fileAccept.value = accepts[type] || '*'
  
  nextTick(() => {
    fileInput.value?.click()
  })
}

function handleFileImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !currentChapter.value) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    
    if (importType.value === 'html') {
      // 简单 HTML 转 Markdown
      currentChapter.value!.content = htmlToMarkdown(content)
    } else {
      currentChapter.value!.content = content
    }
    
    showImportModal.value = false
    saveSubjects()
  }
  reader.readAsText(file)
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// 原有功能
function selectSubject(subject: Subject) {
  currentSubject.value = subject
  currentChapter.value = null
}

function selectChapter(chapter: Chapter) {
  currentChapter.value = chapter
  editChapterData.value = { name: chapter.name, order: chapter.order }
}

function addSubject() {
  if (!newSubject.value.name) return
  subjects.value.push({
    id: Date.now(),
    name: newSubject.value.name,
    icon: newSubject.value.icon,
    chapters: []
  })
  showAddSubject.value = false
  newSubject.value = { name: '', icon: '📚' }
  saveSubjects()
}

function addChapter() {
  if (!newChapter.value.name || !currentSubject.value) return
  currentSubject.value.chapters.push({
    id: Date.now(),
    name: newChapter.value.name,
    order: newChapter.value.order,
    content: '',
    notes: '',
    codeSnippets: [],
    images: []
  })
  currentSubject.value.chapters.sort((a, b) => a.order - b.order)
  showAddChapter.value = false
  newChapter.value = { name: '', order: 1 }
  saveSubjects()
}

function updateChapter() {
  if (!currentChapter.value) return
  currentChapter.value.name = editChapterData.value.name
  currentChapter.value.order = editChapterData.value.order
  if (currentSubject.value) {
    currentSubject.value.chapters.sort((a, b) => a.order - b.order)
  }
  showEditChapter.value = false
  saveSubjects()
}

function deleteChapter() {
  if (!currentChapter.value || !currentSubject.value) return
  if (!confirm('确定要删除这个章节吗？所有内容将无法恢复。')) return
  const index = currentSubject.value.chapters.findIndex(c => c.id === currentChapter.value?.id)
  if (index > -1) {
    currentSubject.value.chapters.splice(index, 1)
    currentChapter.value = null
    showEditChapter.value = false
    saveSubjects()
  }
}

function addCodeSnippet() {
  if (!currentChapter.value) return
  currentChapter.value.codeSnippets.push({ title: '', code: '' })
}

function removeCodeSnippet(index: number) {
  if (!currentChapter.value) return
  currentChapter.value.codeSnippets.splice(index, 1)
}

function saveNotes() {
  saveSubjects()
  alert('笔记已保存')
}

function saveSubjects() {
  localStorage.setItem('cs_notes_subjects', JSON.stringify(subjects.value))
}

function loadSubjects() {
  const saved = localStorage.getItem('cs_notes_subjects')
  if (saved) {
    const parsed = JSON.parse(saved)
    // 确保每个章节都有 images 数组
    parsed.forEach((subject: Subject) => {
      subject.chapters.forEach((chapter: Chapter) => {
        if (!chapter.images) chapter.images = []
      })
    })
    subjects.value = parsed
  }
}

onMounted(() => {
  loadSubjects()
})
</script>

<style scoped>
.notes-page {
  display: flex;
  height: calc(100vh - 64px);
  background: var(--bg-primary);
}

/* 侧边栏通用样式 */
.subjects-sidebar,
.chapters-sidebar {
  width: 220px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.chapters-sidebar {
  width: 240px;
}

.subjects-sidebar.collapsed {
  width: 60px;
}

.chapters-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.sidebar-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--accent-primary-bg);
  color: var(--accent-primary);
}

.add-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: none;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 科目列表 */
.subject-list,
.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.subject-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.subject-item:hover,
.subject-item.active {
  background: var(--accent-primary-bg);
}

.subject-item.active .subject-name {
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

.subject-icon {
  font-size: 20px;
}

.subject-name {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.subject-count {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

/* 章节列表 */
.chapter-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.chapter-item:hover,
.chapter-item.active {
  background: var(--accent-primary-bg);
}

.chapter-item.active .chapter-name {
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

.chapter-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}

.chapter-name {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

/* 内容区域 */
.notes-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.header-title h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.breadcrumb {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.content-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: var(--space-1);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

.toolbar-btn {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 32px;
}

.toolbar-btn:hover {
  background: var(--accent-primary-bg);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.toolbar-btn.active {
  background: var(--accent-primary);
  color: var(--text-inverse);
  border-color: var(--accent-primary);
}

/* 编辑器容器 */
.editor-container {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.editor-wrapper,
.preview-wrapper {
  min-height: 300px;
}

.content-editor {
  width: 100%;
  min-height: 300px;
  padding: var(--space-4);
  border: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.8;
  resize: vertical;
  box-sizing: border-box;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.content-preview {
  padding: var(--space-4);
  line-height: 1.8;
  color: var(--text-primary);
}

.content-preview h1 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--border);
}

.content-preview h2 {
  font-size: var(--font-size-xl);
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
  color: var(--accent-primary);
}

.content-preview h3 {
  font-size: var(--font-size-lg);
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
}

.content-preview pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-3) 0;
}

.content-preview code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.content-preview p code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--accent-primary);
}

.content-preview ul {
  margin: var(--space-2) 0;
  padding-left: var(--space-6);
}

.content-preview li {
  margin: var(--space-1) 0;
}

.content-preview .note-image {
  max-width: 100%;
  border-radius: var(--radius-md);
  margin: var(--space-3) 0;
}

/* 图片区域 */
.images-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-3);
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-item:hover img {
  transform: scale(1.05);
}

.delete-image {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .delete-image {
  opacity: 1;
}

/* 笔记区域 */
.notes-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
}

.notes-editor {
  width: 100%;
  min-height: 150px;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

/* 代码片段区域 */
.code-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.code-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.code-item {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.code-title {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.code-title:focus {
  outline: none;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
}

.delete-btn:hover {
  background: var(--error);
  color: white;
}

.code-editor {
  width: 100%;
  min-height: 120px;
  padding: var(--space-3);
  border: none;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}

.add-code-btn {
  padding: var(--space-3);
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.add-code-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-align: center;
  padding: var(--space-8);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--space-4);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-top: var(--space-2);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal-overlay.image-preview {
  background: rgba(0, 0, 0, 0.9);
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  font-size: 24px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 20px;
  transition: var(--transition-fast);
}

.icon-btn:hover {
  border-color: var(--accent-primary);
}

.icon-btn.selected {
  border-color: var(--accent-primary);
  background: var(--accent-primary-bg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

/* 导入选项 */
.import-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.import-option {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.import-option:hover {
  background: var(--accent-primary-bg);
}

.import-icon {
  font-size: 32px;
}

.import-title {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.import-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 上传区域 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload-area:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary-bg);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: var(--space-3);
}

.upload-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-top: var(--space-2);
}

/* 图片预览 */
.image-preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-preview-content img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: var(--radius-md);
}

.image-preview-content .close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  color: white;
  font-size: 32px;
}

/* 按钮样式 */
.btn-secondary,
.btn-primary,
.btn-danger {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary {
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-danger {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: none;
  margin-right: auto;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

@media (max-width: 1024px) {
  .subjects-sidebar {
    width: 180px;
  }

  .chapters-sidebar {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .notes-page {
    flex-direction: column;
    height: auto;
  }

  .subjects-sidebar,
  .chapters-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 200px;
  }

  .editor-toolbar {
    overflow-x: auto;
  }

  .images-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
