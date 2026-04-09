<template>
  <div class="poetic-writing" :style="backgroundStyle">
    <!-- 背景切换按钮 -->
    <div class="bg-controls">
      <button class="control-btn" @click="showBgSelector = true" title="切换背景">
        🖼️ 风景
      </button>
      <button class="control-btn" @click="toggleMusic" title="背景音乐">
        {{ isPlaying ? '🔇' : '🎵' }}
      </button>
      <button class="control-btn" @click="saveWriting" title="保存">
        💾 保存
      </button>
    </div>

    <!-- 写作区域 - 语文课本风格 -->
    <div class="writing-container" :class="{ 'zen-mode': zenMode }">
      <!-- 课本封面风格标题 -->
      <div class="book-header">
        <div class="book-title">
          <span class="season-icon">{{ currentSeason }}</span>
          <h1>{{ currentTitle }}</h1>
          <p class="subtitle">{{ currentSubtitle }}</p>
        </div>
        <div class="book-decoration">
          <span class="decoration-line"></span>
          <span class="decoration-dot">◆</span>
          <span class="decoration-line"></span>
        </div>
      </div>

      <!-- 写作区域 -->
      <div class="writing-area">
        <textarea
          v-model="content"
          class="poetic-textarea"
          :placeholder="currentPlaceholder"
          @input="autoSave"
        ></textarea>
        <div class="word-count">{{ wordCount }} 字</div>
      </div>

      <!-- 页脚装饰 -->
      <div class="book-footer">
        <span class="page-number">— {{ currentPage }} —</span>
        <p class="author-signature">{{ authorName }}</p>
      </div>
    </div>

    <!-- 背景选择器弹窗 -->
    <div v-if="showBgSelector" class="modal-overlay" @click.self="showBgSelector = false">
      <div class="bg-selector-modal">
        <h3>选择背景风景</h3>
        <div class="bg-grid">
          <div
            v-for="bg in backgroundOptions"
            :key="bg.id"
            class="bg-option"
            :class="{ active: currentBg === bg.id }"
            @click="selectBackground(bg)"
          >
            <div class="bg-preview" :style="{ backgroundImage: `url(${bg.url})` }">
              <span class="bg-name">{{ bg.name }}</span>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="showBgSelector = false">关闭</button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel" v-if="showSettings">
      <div class="setting-item">
        <label>作者署名</label>
        <input v-model="authorName" type="text" placeholder="你的名字">
      </div>
      <div class="setting-item">
        <label>文章标题</label>
        <input v-model="currentTitle" type="text" placeholder="标题">
      </div>
      <div class="setting-item">
        <label>副标题</label>
        <input v-model="currentSubtitle" type="text" placeholder="副标题">
      </div>
    </div>

    <!-- 设置按钮 -->
    <button class="settings-toggle" @click="showSettings = !showSettings">
      ⚙️
    </button>

    <!-- 禅模式切换 -->
    <button class="zen-toggle" @click="zenMode = !zenMode">
      {{ zenMode ? '退出禅模式' : '🧘 禅模式' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// 风景背景选项
const backgroundOptions = [
  {
    id: 'spring',
    name: '春日樱花',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80',
    theme: '春天',
    placeholder: '春风拂面，樱花如雪...'
  },
  {
    id: 'summer',
    name: '夏日荷塘',
    url: 'https://images.unsplash.com/photo-1566916358117-b2c1e0dc6399?w=1920&q=80',
    theme: '夏天',
    placeholder: '荷叶田田，蝉鸣阵阵...'
  },
  {
    id: 'autumn',
    name: '秋日枫林',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    theme: '秋天',
    placeholder: '枫叶如火，秋风送爽...'
  },
  {
    id: 'winter',
    name: '冬日雪景',
    url: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1920&q=80',
    theme: '冬天',
    placeholder: '白雪皑皑，静谧如诗...'
  },
  {
    id: 'mountain',
    name: '山水画卷',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    theme: '山水',
    placeholder: '青山隐隐，云雾缭绕...'
  },
  {
    id: 'ocean',
    name: '海边日落',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    theme: '海洋',
    placeholder: '海天一色，夕阳西下...'
  },
  {
    id: 'bamboo',
    name: '竹林幽径',
    url: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=1920&q=80',
    theme: '竹林',
    placeholder: '竹影婆娑，清风徐来...'
  },
  {
    id: 'library',
    name: '古书书房',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80',
    theme: '书香',
    placeholder: '书香满室，墨韵悠长...'
  }
]

// 状态
const currentBg = ref('spring')
const content = ref('')
const authorName = ref('')
const currentTitle = ref('无题')
const currentSubtitle = ref('随笔')
const showBgSelector = ref(false)
const showSettings = ref(false)
const zenMode = ref(false)
const isPlaying = ref(false)
const currentPage = ref(1)
const saveTimeout = ref<number | null>(null)

// 计算属性
const currentBgOption = computed(() => 
  backgroundOptions.find(bg => bg.id === currentBg.value) || backgroundOptions[0]
)

const backgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.9)), url(${currentBgOption.value.url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed'
}))

const currentSeason = computed(() => {
  const seasons: Record<string, string> = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
    mountain: '⛰️',
    ocean: '🌊',
    bamboo: '🎋',
    library: '📚'
  }
  return seasons[currentBg.value] || '📝'
})

const currentPlaceholder = computed(() => currentBgOption.value.placeholder)

const wordCount = computed(() => content.value.length)

// 方法
function selectBackground(bg: typeof backgroundOptions[0]) {
  currentBg.value = bg.id
  showBgSelector.value = false
  localStorage.setItem('poetic-bg', bg.id)
}

function toggleMusic() {
  isPlaying.value = !isPlaying.value
  // 这里可以添加实际的背景音乐播放逻辑
}

function autoSave() {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value)
  }
  saveTimeout.value = window.setTimeout(() => {
    saveWriting()
  }, 3000)
}

function saveWriting() {
  const data = {
    content: content.value,
    title: currentTitle.value,
    subtitle: currentSubtitle.value,
    author: authorName.value,
    background: currentBg.value,
    date: new Date().toISOString()
  }
  localStorage.setItem('poetic-writing', JSON.stringify(data))
  // 可以添加保存成功的提示
}

function loadWriting() {
  const saved = localStorage.getItem('poetic-writing')
  if (saved) {
    const data = JSON.parse(saved)
    content.value = data.content || ''
    currentTitle.value = data.title || '无题'
    currentSubtitle.value = data.subtitle || '随笔'
    authorName.value = data.author || ''
    currentBg.value = data.background || 'spring'
  }
  
  const savedBg = localStorage.getItem('poetic-bg')
  if (savedBg) {
    currentBg.value = savedBg
  }
}

// 生命周期
onMounted(() => {
  loadWriting()
  
  // 自动增加页码（模拟翻页效果）
  setInterval(() => {
    if (content.value.length > currentPage.value * 500) {
      currentPage.value++
    }
  }, 60000)
})

// 监听内容变化，自动保存
watch([content, currentTitle, currentSubtitle, authorName], () => {
  autoSave()
}, { deep: true })
</script>

<style scoped>
.poetic-writing {
  min-height: 100vh;
  padding: var(--space-6);
  position: relative;
  transition: background 0.5s ease;
}

/* 控制按钮 */
.bg-controls {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  gap: var(--space-2);
  z-index: 100;
}

.control-btn {
  padding: var(--space-2) var(--space-3);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);
  backdrop-filter: blur(10px);
}

.control-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 写作容器 - 语文课本风格 */
.writing-container {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 20px 25px -5px rgba(0, 0, 0, 0.1);
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 课本封面风格头部 */
.book-header {
  text-align: center;
  padding-bottom: var(--space-6);
  border-bottom: 2px solid var(--border);
  margin-bottom: var(--space-6);
}

.book-title {
  margin-bottom: var(--space-4);
}

.season-icon {
  font-size: 48px;
  display: block;
  margin-bottom: var(--space-3);
}

.book-title h1 {
  font-family: 'Noto Serif SC', serif;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  letter-spacing: var(--letter-spacing-wide);
}

.subtitle {
  font-family: 'Noto Serif SC', serif;
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  font-style: italic;
}

.book-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.decoration-line {
  width: 60px;
  height: 1px;
  background: var(--border);
}

.decoration-dot {
  color: var(--accent-primary);
  font-size: var(--font-size-sm);
}

/* 写作区域 */
.writing-area {
  flex: 1;
  position: relative;
  padding: var(--space-4);
}

.poetic-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: var(--font-size-lg);
  line-height: 2;
  color: var(--text-primary);
  background: transparent;
  text-indent: 2em;
}

.poetic-textarea::placeholder {
  color: var(--text-muted);
  font-style: italic;
}

.word-count {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* 页脚 */
.book-footer {
  text-align: center;
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
  margin-top: var(--space-6);
}

.page-number {
  font-family: 'Noto Serif SC', serif;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.author-signature {
  font-family: 'Noto Serif SC', serif;
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin-top: var(--space-2);
  font-style: italic;
}

/* 禅模式 */
.zen-mode {
  max-width: 900px;
}

.zen-mode .book-header,
.zen-mode .book-footer {
  opacity: 0.3;
}

.zen-mode .bg-controls {
  opacity: 0;
  pointer-events: none;
}

/* 背景选择器 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.bg-selector-modal {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.bg-selector-modal h3 {
  font-family: 'Noto Serif SC', serif;
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-4);
  text-align: center;
}

.bg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.bg-option {
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 3px solid transparent;
  transition: var(--transition-fast);
}

.bg-option:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.bg-option.active {
  border-color: var(--accent-primary);
}

.bg-preview {
  aspect-ratio: 16/10;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: var(--space-2);
}

.bg-name {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.close-btn {
  display: block;
  margin: 0 auto;
  padding: var(--space-2) var(--space-6);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* 设置面板 */
.settings-panel {
  position: fixed;
  bottom: var(--space-4);
  left: var(--space-4);
  background: rgba(255, 255, 255, 0.95);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  min-width: 250px;
}

.setting-item {
  margin-bottom: var(--space-3);
}

.setting-item label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.setting-item input {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.settings-toggle {
  position: fixed;
  bottom: var(--space-4);
  left: var(--space-4);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: var(--font-size-lg);
  z-index: 99;
}

/* 禅模式按钮 */
.zen-toggle {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-sm);
  z-index: 100;
  backdrop-filter: blur(10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .poetic-writing {
    padding: var(--space-3);
  }
  
  .writing-container {
    padding: var(--space-4);
  }
  
  .book-title h1 {
    font-size: var(--font-size-2xl);
  }
  
  .bg-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .settings-panel {
    left: var(--space-2);
    right: var(--space-2);
    bottom: 60px;
  }
}
</style>
