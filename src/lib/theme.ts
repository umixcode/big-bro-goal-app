export const colors = {
  background: '#0B0D10',
  surface: '#15181D',
  surfaceRaised: '#1E2228',
  border: '#2A2F37',
  textPrimary: '#F2F3F5',
  textSecondary: '#9BA1AC',
  textMuted: '#5D6470',
  accent: '#4C8DFF',
  success: '#4CAF7D',
  warning: '#E0A93A',
  danger: '#E0553A',
  macroCarbs: '#E8C547',
  macroFat: '#4CAF7D',
  macroProtein: '#E0553A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  heading: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
};
