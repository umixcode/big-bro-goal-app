import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Workout</Text>
      <Text style={typography.caption}>
        Your Phase 1 PPL + Upper/Lower program will show up here once the workout tracker milestone is built.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
