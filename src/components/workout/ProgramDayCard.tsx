import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, workoutTheme } from '../../lib/theme';

interface ProgramDayCardProps {
  dayName: string;
  exerciseCount: number;
  onPress: () => void;
}

export function ProgramDayCard({ dayName, exerciseCount, onPress }: ProgramDayCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.exerciseCount}>{exerciseCount} exercises</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={workoutTheme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: workoutTheme.surface,
  },
  dayName: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 20,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
  },
  exerciseCount: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
    marginTop: 2,
  },
});
