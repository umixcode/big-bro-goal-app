import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Calendar</Text>
      <Text style={typography.caption}>
        Planner, goals, journaling, and calendar events land here in a later build pass.
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
