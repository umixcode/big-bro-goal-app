import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { CircularProgressRing } from '../ui/CircularProgressRing';
import { SyncedBadge } from '../ui/SyncedBadge';
import { useStepsLog } from '../../hooks/useStepsLogs';
import { colors, spacing, typography } from '../../lib/theme';

interface StepsCardProps {
  stepGoal: number;
}

export function StepsCard({ stepGoal }: StepsCardProps) {
  const router = useRouter();
  const today = dayjs().format('YYYY-MM-DD');
  const { data: log } = useStepsLog(today);

  const steps = log?.steps ?? 0;
  const progress = stepGoal > 0 ? steps / stepGoal : 0;

  return (
    <Card onPress={() => router.push('/(tabs)/trackers/steps')}>
      <View style={styles.titleRow}>
        <Text style={typography.heading}>Steps</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      {log?.source === 'healthkit' && <SyncedBadge />}
      <View style={styles.body}>
        <CircularProgressRing progress={progress} size={100} strokeWidth={10}>
          <Text style={styles.ringValue}>{steps}</Text>
          <Text style={typography.caption}>/ {stepGoal}</Text>
        </CircularProgressRing>
        <View style={styles.goalCol}>
          <Text style={[typography.caption, styles.synced]}>Synced from Apple Health</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ringValue: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  goalCol: { flex: 1, gap: spacing.xs },
  synced: { color: colors.textMuted },
});
