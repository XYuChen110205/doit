// 主题配置系统
export interface Theme {
  name: string
  description: string
  colors: {
    // 背景色
    bgPrimary: string
    bgSecondary: string
    bgCard: string
    bgHover: string
    bgNav: string
    bgActive: string
    // 文字色
    textPrimary: string
    textSecondary: string
    textMuted: string
    textInverse: string
    // 强调色
    accentPrimary: string
    accentPrimaryHover: string
    accentDanger: string
    accentSuccess: string
    accentWarning: string
    // 边框色
    border: string
    borderLight: string
    borderFocus: string
  }
  fonts: {
    family: string
    sizes: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
    }
  }
  radius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  shadows: {
    card: string
    nav: string
    hover: string
    float: string
  }
}

// 水色系主题 - 清爽专业
export const waterTheme: Theme = {
  name: 'water',
  description: '水色系 - 清爽专业',
  colors: {
    bgPrimary: '#F5F9FB',
    bgSecondary: '#EDF4F7',
    bgCard: '#FFFFFF',
    bgHover: '#E5F0F5',
    bgNav: 'rgba(255, 255, 255, 0.92)',
    bgActive: '#D6EBF3',
    textPrimary: '#1A2B3C',
    textSecondary: '#4A6572',
    textMuted: '#8BA3B0',
    textInverse: '#FFFFFF',
    accentPrimary: '#4A9FD4',
    accentPrimaryHover: '#3A8FC4',
    accentDanger: '#E57373',
    accentSuccess: '#66BB6A',
    accentWarning: '#FFA726',
    border: '#D0E3EC',
    borderLight: '#E8F1F5',
    borderFocus: '#4A9FD4',
  },
  fonts: {
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '40px',
    },
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  shadows: {
    card: '0 2px 8px rgba(26, 43, 60, 0.06)',
    nav: '0 2px 12px rgba(26, 43, 60, 0.08)',
    hover: '0 8px 24px rgba(26, 43, 60, 0.12)',
    float: '0 12px 40px rgba(26, 43, 60, 0.16)',
  },
}

// 童年感主题 - 温暖可爱
export const childhoodTheme: Theme = {
  name: 'childhood',
  description: '童年感 - 温暖可爱',
  colors: {
    bgPrimary: '#FFF8F0',
    bgSecondary: '#FFF0E5',
    bgCard: '#FFFFFF',
    bgHover: '#FFE8D6',
    bgNav: 'rgba(255, 248, 240, 0.95)',
    bgActive: '#FFD4B3',
    textPrimary: '#5D4037',
    textSecondary: '#8D6E63',
    textMuted: '#BCAAA4',
    textInverse: '#FFFFFF',
    accentPrimary: '#FF8A65',
    accentPrimaryHover: '#F4511E',
    accentDanger: '#EF5350',
    accentSuccess: '#66BB6A',
    accentWarning: '#FFCA28',
    border: '#FFE0B2',
    borderLight: '#FFF3E0',
    borderFocus: '#FF8A65',
  },
  fonts: {
    family: "'Nunito', 'Quicksand', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    sizes: {
      xs: '13px',
      sm: '15px',
      md: '17px',
      lg: '21px',
      xl: '26px',
      '2xl': '34px',
      '3xl': '42px',
    },
  },
  radius: {
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '28px',
  },
  shadows: {
    card: '0 4px 12px rgba(93, 64, 55, 0.08)',
    nav: '0 2px 16px rgba(93, 64, 55, 0.1)',
    hover: '0 8px 28px rgba(93, 64, 55, 0.12)',
    float: '0 12px 48px rgba(93, 64, 55, 0.16)',
  },
}

// 所有主题
export const themes: Record<string, Theme> = {
  water: waterTheme,
  childhood: childhoodTheme,
}

// 默认主题
export const defaultTheme = 'water'

// 应用主题到 CSS 变量
export function applyTheme(themeName: string) {
  const theme = themes[themeName] || themes[defaultTheme]
  const root = document.documentElement

  // 应用颜色
  root.style.setProperty('--bg-primary', theme.colors.bgPrimary)
  root.style.setProperty('--bg-secondary', theme.colors.bgSecondary)
  root.style.setProperty('--bg-card', theme.colors.bgCard)
  root.style.setProperty('--bg-hover', theme.colors.bgHover)
  root.style.setProperty('--bg-nav', theme.colors.bgNav)
  root.style.setProperty('--bg-active', theme.colors.bgActive)

  root.style.setProperty('--text-primary', theme.colors.textPrimary)
  root.style.setProperty('--text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--text-muted', theme.colors.textMuted)
  root.style.setProperty('--text-inverse', theme.colors.textInverse)

  root.style.setProperty('--accent-primary', theme.colors.accentPrimary)
  root.style.setProperty('--accent-primary-hover', theme.colors.accentPrimaryHover)
  root.style.setProperty('--accent-danger', theme.colors.accentDanger)
  root.style.setProperty('--accent-success', theme.colors.accentSuccess)
  root.style.setProperty('--accent-warning', theme.colors.accentWarning)

  root.style.setProperty('--border', theme.colors.border)
  root.style.setProperty('--border-light', theme.colors.borderLight)
  root.style.setProperty('--border-focus', theme.colors.borderFocus)

  // 应用字体
  root.style.setProperty('--font-family-base', theme.fonts.family)
  root.style.setProperty('--font-size-xs', theme.fonts.sizes.xs)
  root.style.setProperty('--font-size-sm', theme.fonts.sizes.sm)
  root.style.setProperty('--font-size-md', theme.fonts.sizes.md)
  root.style.setProperty('--font-size-lg', theme.fonts.sizes.lg)
  root.style.setProperty('--font-size-xl', theme.fonts.sizes.xl)
  root.style.setProperty('--font-size-2xl', theme.fonts.sizes['2xl'])
  root.style.setProperty('--font-size-3xl', theme.fonts.sizes['3xl'])

  // 应用圆角
  root.style.setProperty('--radius-sm', theme.radius.sm)
  root.style.setProperty('--radius-md', theme.radius.md)
  root.style.setProperty('--radius-lg', theme.radius.lg)
  root.style.setProperty('--radius-xl', theme.radius.xl)

  // 应用阴影
  root.style.setProperty('--shadow-card', theme.shadows.card)
  root.style.setProperty('--shadow-nav', theme.shadows.nav)
  root.style.setProperty('--shadow-hover', theme.shadows.hover)
  root.style.setProperty('--shadow-float', theme.shadows.float)

  // 保存到本地存储
  localStorage.setItem('app-theme', themeName)
}

// 获取当前主题
export function getCurrentTheme(): string {
  return localStorage.getItem('app-theme') || defaultTheme
}

// 初始化主题
export function initTheme() {
  const savedTheme = getCurrentTheme()
  applyTheme(savedTheme)
}
