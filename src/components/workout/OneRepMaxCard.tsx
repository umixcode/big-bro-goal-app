import dayjs from 'dayjs';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui/Card';
import { Sparkline } from '../ui/Sparkline';
import { useCurrentOneRepMax, useOneRepMaxHistory } from '../../hooks/useOneRepMax';
import { useProfile } from '../../hooks/useProfile';
import { formatWeight } from '../../lib/units';
import { BENCH_PRESS_EXERCISE_NAME } from '../../api/oneRepMax';
import { spacing, typography } from '../../lib/theme';

interface OneRepMaxCardProps {
  exerciseName?: string;
}

export function OneRepMaxCard({ exerciseName = BENCH_PRESS_EXERCISE_NAME }: OneRepMaxCardProps) {
  const { data: profile } = useProfile();
  const { data: current } = useCurrentOneRepMax(exerciseName);
  const { data: history = [] } = useOneRepMaxHistory(exerciseName);

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';

  return (
    <Card style={styles.card}>
      <Text style={typography.heading}>Bench Press 1RM</Text>
      {current ? (
        <>
          <Text style={styles.value}>
            {formatWeight(current.estimated_1rm, unitsPreference)} {unitLabel}
          </Text>
          <Text style={typography.caption}>Best on {dayjs(current.logged_at).format('MMM D')}</Text>
        </>
      ) : (
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>Log a bench set to estimate your 1RM.</Text>
      )}
      {history.length > 1 && (
        <Sparkline
          values={history.map((h) => h.estimated_1rm)}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  value: { ...typography.title, marginTop: spacing.xs },
});
