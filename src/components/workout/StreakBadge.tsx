import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, workoutTheme } from '../../lib/theme';

export function StreakBadge({ days }: { days: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.flameWrap}>
        <Ionicons name="flame" size={30} color={workoutTheme.warning} />
      </View>
      <View>
        <Text style={styles.count}>{days}</Text>
        <Text style={styles.label}>day streak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  flameWrap: {
    shadowColor: workoutTheme.warning,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  count: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 30,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
  },
  label: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
    marginTop: -2,
  },
});
