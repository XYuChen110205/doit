import { ref, watch, onMounted } from 'vue'

// 字体配置
export interface FontOption {
  id: string
  name: string
  family: string
  description: string
  cdnUrl?: string
  fallback: string
}

// 预设字体列表
export const fontOptions: FontOption[] = [
  {
    id: 'system',
    name: '系统默认',
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"',
    description: '使用系统自带字体，加载最快',
    fallback: 'sans-serif'
  },
  {
    id: 'noto-sans',
    name: '思源黑体',
    family: '"Noto Sans SC"',
    description: 'Google 开源字体，清晰现代',
    cdnUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap',
    fallback: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  {
    id: 'noto-serif',
    name: '思源宋体',
    family: '"Noto Serif SC"',
    description: '优雅的衬线字体，适合阅读',
    cdnUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
    fallback: '"Songti SC", "SimSun", serif'
  },
  {
    id: 'lxgw',
    name: '霞鹜文楷',
    family: '"LXGW WenKai"',
    description: '开源中文字体，文艺清新',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css',
    fallback: '"PingFang SC", "Microsoft YaHei", sans-serif'
  },
  {
    id: 'maple',
    name: ' Maple 字体',
    family: '"Maple Mono CN"',
    description: '等宽编程字体，适合代码',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/@chinese-fonts/maple-mono-cn@1.0.0/dist/MapleMono-CN/result.css',
    fallback: '"SF Mono", Monaco, monospace'
  }
]

// 当前字体
const currentFontId = ref<string>('noto-sans')
const loadedFonts = ref<Set<string>>(new Set())

// 加载字体 CSS
function loadFontCSS(fontId: string): Promise<void> {
  const font = fontOptions.find(f => f.id === fontId)
  if (!font || !font.cdnUrl || loadedFonts.value.has(fontId)) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = font.cdnUrl
    link.onload = () => {
      loadedFonts.value.add(fontId)
      resolve()
    }
    link.onerror = reject
    document.head.appendChild(link)
  })
}

// 应用字体
function applyFont(fontId: string) {
  const font = fontOptions.find(f => f.id === fontId)
  if (!font) return

  const root = document.documentElement
  const fullFontFamily = `${font.family}, ${font.fallback}`
  
  root.style.setProperty('--font-family-base', fullFontFamily)
  root.style.setProperty('--font-family-display', fullFontFamily)
  
  // 保存到本地存储
  localStorage.setItem('app-font', fontId)
}

// 切换字体
export async function switchFont(fontId: string) {
  try {
    await loadFontCSS(fontId)
    applyFont(fontId)
    currentFontId.value = fontId
    return true
  } catch (error) {
    console.error('字体加载失败:', error)
    return false
  }
}

// 获取当前字体
export function getCurrentFont() {
  return fontOptions.find(f => f.id === currentFontId.value) || fontOptions[0]
}

// 初始化字体
export function initFont() {
  const savedFont = localStorage.getItem('app-font')
  if (savedFont && fontOptions.find(f => f.id === savedFont)) {
    switchFont(savedFont)
  } else {
    switchFont('noto-sans')
  }
}

// Composable
export function useFont() {
  onMounted(() => {
    initFont()
  })

  return {
    currentFontId,
    fontOptions,
    switchFont,
    getCurrentFont
  }
}
