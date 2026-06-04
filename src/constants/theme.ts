export const colors = {
  primary: '#ff8c00',
  primaryLight: '#ffcc00',
  secondary: '#ff4d6d',
  accent: '#c084fc',
  accentBlue: '#00c2ff',
  background: '#0d0d12',
  surface: '#16181f',
  surfaceLight: '#1e2130',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.08)',
  white: '#fff',
  error: '#ff4757',
}

export const gradients = {
  brand: ['#ff8c00', '#ff4d6d', '#9b27af'] as const,
  brandH: ['#ff8c00', '#ff4d6d'] as const,
  card: ['#ff8c00', '#c084fc'] as const,
  blue: ['#00c2ff', '#6366f1'] as const,
  dark: ['#16181f', '#1e2130'] as const,
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
}

export const radius = {
  sm: 8, md: 14, lg: 20, full: 9999,
}
