export const colors = {
  primary: '#e8845c',       // warm coral/terracotta
  primaryDark: '#c9566e',   // deep rose
  primaryLight: '#f0b48c',  // soft peach
  accent: '#f0c070',        // warm gold
  accentBlue: '#4a9eca',    // muted sky blue
  background: '#0d1b2e',    // deep midnight
  surface: '#111d2e',
  surfaceLight: '#1a2a3e',
  text: '#f5f0eb',          // warm white
  textMuted: 'rgba(245,240,235,0.5)',
  border: 'rgba(245,240,235,0.08)',
  white: '#fff',
  error: '#e05555',
}

export const gradients = {
  brand: ['#e8845c', '#c9566e'] as const,
  brandH: ['#e8845c', '#c9566e'] as const,
  brandGold: ['#f0c070', '#e8845c'] as const,
  sky: ['#0d1b2e', '#1a3a5c', '#7e4a35', '#c4703a', '#e8a860'] as const,
  skyLocations: [0, 0.3, 0.55, 0.75, 1] as const,
  card: ['#e8845c', '#c9566e'] as const,
  dark: ['#111d2e', '#1a2a3e'] as const,
  glass: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const,
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
}

export const radius = {
  sm: 8, md: 14, lg: 20, full: 9999,
}
