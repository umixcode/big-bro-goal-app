import dayjs from 'dayjs';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../src/hooks/useProfile';
import { DhikrCounter } from '../../src/components/dhikr/DhikrCounter';
import { PlannerTaskList } from '../../src/components/planner/PlannerTaskList';
import { JournalComposer } from '../../src/components/journal/JournalComposer';
import { ComingSoonCard } from '../../src/components/dashboard/ComingSoonCard';
import { WaterRingCard } from '../../src/components/dashboard/WaterRingCard';
import { CalorieWedgeCard } from '../../src/components/dashboard/CalorieWedgeCard';
import { WeightTrendCard } from '../../src/components/dashboard/WeightTrendCard';
import { TodaysGoalsCard } from '../../src/components/goals/TodaysGoalsCard';
import { MiniCalendarCard } from '../../src/components/calendar/MiniCalendarCard';
import { supabase } from '../../src/api/supabaseClient';
import { colors, radii, spacing, typography } from '../../src/lib/theme';

const navPills = [
  { href: '/(tabs)/trackers', icon: 'moon', label: 'Sleep' },
  { href: '/(tabs)/trackers', icon: 'restaurant', label: 'Food' },
  { href: '/(tabs)/workout', icon: 'barbell', label: 'Workout' },
] as const;

const BREAKPOINT = 700;

export default function DashboardScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={typography.title}>
        {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Welcome back'}
      </Text>
      <Text style={[typography.caption, { marginBottom: spacing.md }]}>Let's level up today.</Text>

      <View style={styles.navRow}>
        {navPills.map((pill) => (
          <Pressable key={pill.label} style={styles.navPill} onPress={() => router.push(pill.href)}>
            <Ionicons name={pill.icon} size={16} color={colors.accent} />
            <Text style={styles.navPillText}>{pill.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginBottom: spacing.sm }}>
        <DhikrCounter />
      </View>

      <View style={isWide ? styles.columnsRow : undefined}>
        <View style={[styles.column, isWide && styles.columnLeft]}>
          <JournalComposer />
          <ComingSoonCard title="Salah Tracker" variant="dots" />
          <View style={styles.sideBySide}>
            <WaterRingCard style={styles.half} />
            <CalorieWedgeCard style={styles.half} />
          </View>
          <MiniCalendarCard />
          <TodaysGoalsCard />
          <WeightTrendCard />
        </View>

        <View style={[styles.column, isWide && styles.columnRight]}>
          <ComingSoonCard title="Salah Time" variant="rows" rows={['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']} />
          <PlannerTaskList date={today} />
        </View>
      </View>

      <Pressable style={styles.brainLink} onPress={() => router.push('/(tabs)/brain')}>
        <Ionicons name="book" size={18} color={colors.accent} />
        <Text style={[typography.body, { marginLeft: spacing.sm }]}>Brain Tracker</Text>
      </Pressable>

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={{ color: colors.danger }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navPillText: {
    ...typography.eyebrow,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  column: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  columnLeft: {
    flex: 62,
  },
  columnRight: {
    flex: 38,
  },
  sideBySide: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  brainLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOut: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    padding: spacing.md,
  },
});
