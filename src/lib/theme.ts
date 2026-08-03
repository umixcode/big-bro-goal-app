import { Platform } from 'react-native';

// The dark/mint/serif look that started in the workout section is now the
// app-wide palette — `colors`/`typography` below derive straight from it, so
// every screen picks it up automatically since they already read from these
// shared tokens.
export const workoutTheme = {
  background: '#050D09',
  surface: '#0C1611',
  surfaceRaised: '#122019',
  border: '#1E2E25',
  accent: '#6EE7B7',
  accentMuted: 'rgba(110, 231, 183, 0.35)',
  textPrimary: '#F3F4F0',
  textSecondary: '#9BA79E',
  textMuted: '#5C6961',
  danger: '#E0705A',
  warning: '#E0A93A',
  fontSerif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  fontMono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }),
} as const;

export const colors = {
  background: workoutTheme.background,
  surface: workoutTheme.surface,
  surfaceRaised: workoutTheme.surfaceRaised,
  border: workoutTheme.border,
  textPrimary: workoutTheme.textPrimary,
  textSecondary: workoutTheme.textSecondary,
  textMuted: workoutTheme.textMuted,
  accent: workoutTheme.accent,
  onAccent: workoutTheme.background,
  success: workoutTheme.accent,
  warning: workoutTheme.warning,
  danger: workoutTheme.danger,
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
  title: { fontSize: 28, fontWeight: '700' as const, fontFamily: workoutTheme.fontSerif, color: colors.textPrimary },
  heading: { fontSize: 20, fontWeight: '600' as const, fontFamily: workoutTheme.fontSerif, color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: workoutTheme.fontMono,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
  },
  statLarge: { fontSize: 34, fontWeight: '700' as const, fontFamily: workoutTheme.fontSerif, color: colors.textPrimary },
};

export const gradients = {
  accent: [colors.accent, 'rgba(255, 255, 255, 0)'] as const,
};

export const sleepStageColors = {
  deep: '#5B8DEF',
  light: '#7FD8D0',
  rem: '#9B87F5',
  awake: workoutTheme.warning,
} as const;

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
  textMonthFontFamily: workoutTheme.fontSerif,
  textDayHeaderFontFamily: workoutTheme.fontMono,
} as const;
