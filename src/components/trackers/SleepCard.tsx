import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { CircularProgressRing } from '../ui/CircularProgressRing';
import { SyncedBadge } from '../ui/SyncedBadge';
import { GoalHeatmap } from './GoalHeatmap';
import { SwipeReveal } from './SwipeReveal';
import { useSleepHeatmap, useSleepLog } from '../../hooks/useSleepLogs';
import { calculateSleepScore } from '../../lib/formulas';
import { colors, spacing, typography } from '../../lib/theme';

interface SleepCardProps {
  sleepGoalHours: number;
}

export function SleepCard({ sleepGoalHours }: SleepCardProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: log } = useSleepLog(today);
  const { days } = useSleepHeatmap(sleepGoalHours);

  const totalMinutes = log?.total_minutes ?? 0;
  const progress = sleepGoalHours > 0 ? totalMinutes / (sleepGoalHours * 60) : 0;
  const score = calculateSleepScore(totalMinutes, sleepGoalHours);

  return (
    <SwipeReveal
      front={
        <Card>
          <Text style={typography.heading}>Sleep</Text>
          {log?.source === 'healthkit' && <SyncedBadge />}
          <View style={styles.body}>
            <CircularProgressRing progress={progress} size={100} strokeWidth={10}>
              <Text style={styles.ringValue}>{(totalMinutes / 60).toFixed(1)}h</Text>
              <Text style={typography.caption}>{score}%</Text>
            </CircularProgressRing>
            <View style={styles.goalCol}>
              <Text style={typography.caption}>Goal: {sleepGoalHours}h</Text>
              <Text style={[typography.caption, styles.synced]}>Synced from Apple Health</Text>
            </View>
          </View>
        </Card>
      }
      back={
        <Card>
          <GoalHeatmap title="Sleep" days={days} />
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ringValue: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  goalCol: { flex: 1, gap: spacing.xs },
  synced: { color: colors.textMuted },
});
