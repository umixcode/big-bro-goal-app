import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isHealthKitSupported } from '../../lib/healthkit';
import { useActivitySummaryForDate } from '../../hooks/useTodayActivitySummary';
import { spacing, workoutTheme } from '../../lib/theme';

interface TodayActivityCardProps {
  date?: string;
}

export function TodayActivityCard({ date }: TodayActivityCardProps) {
  const { data } = useActivitySummaryForDate(date ?? dayjs().format('YYYY-MM-DD'));

  if (!isHealthKitSupported()) return null;

  return (
    <View style={styles.card}>
      <View style={styles.stat}>
        <Ionicons name="footsteps-outline" size={22} color={workoutTheme.accent} />
        <Text style={styles.value}>{Math.round(data?.steps ?? 0).toLocaleString()}</Text>
        <Text style={styles.label}>steps</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Ionicons name="flame-outline" size={22} color={workoutTheme.warning} />
        <Text style={styles.value}>{Math.round(data?.activeCalories ?? 0).toLocaleString()}</Text>
        <Text style={styles.label}>cal burned</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, backgroundColor: workoutTheme.border },
  value: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 22,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginTop: spacing.xs,
  },
  label: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
  },
});
