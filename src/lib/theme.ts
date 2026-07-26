export const colors = {
  background: '#1A1B1E',
  surface: '#232428',
  surfaceRaised: '#2C2D32',
  border: '#3A3B40',
  textPrimary: '#F5F5F5',
  textSecondary: '#A8A9AD',
  textMuted: '#6E6F74',
  accent: '#FFFFFF',
  onAccent: '#1A1B1E',
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
  eyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
  },
  statLarge: { fontSize: 34, fontWeight: '700' as const, color: colors.textPrimary },
};

export const gradients = {
  accent: [colors.accent, 'rgba(255, 255, 255, 0)'] as const,
};

export const calendarTheme = {
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textSecondary,
  dayTextColor: colors.textPrimary,
  todayTextColor: colors.accent,
  monthTextColor: colors.textPrimary,
  selectedDayBackgroundColor: colors.accent,
  selectedDayTextColor: colors.onAccent,
  dotColor: colors.accent,
  selectedDotColor: colors.onAccent,
  arrowColor: colors.accent,
  textDisabledColor: colors.textMuted,
} as const;
