import dayjs from 'dayjs';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { CircularProgressRing } from '../ui/CircularProgressRing';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { useDailyTargets } from '../../hooks/useDailyTargets';
import { colors, spacing, typography } from '../../lib/theme';

export function WaterRingCard({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  const today = dayjs().format('YYYY-MM-DD');
  const { totalMl } = useWaterLogs(today);
  const { targets } = useDailyTargets();
  const goal = targets?.waterGoalMl ?? 0;
  const progress = goal > 0 ? totalMl / goal : 0;

  return (
    <Card onPress={() => router.push('/(tabs)/trackers')} style={style}>
      <Text style={typography.eyebrow}>Water Intake</Text>
      <View style={styles.ringWrap}>
        <CircularProgressRing progress={progress} size={64} strokeWidth={7}>
          <Text style={styles.value}>{totalMl}</Text>
        </CircularProgressRing>
      </View>
      <Text style={[typography.caption, styles.caption]}>{goal ? `of ${goal}ml goal` : 'Set goals to see target'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', marginTop: spacing.sm },
  value: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  caption: { textAlign: 'center', marginTop: spacing.xs },
});
