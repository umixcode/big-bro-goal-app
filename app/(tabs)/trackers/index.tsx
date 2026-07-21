import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function TrackersScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Trackers</Text>
      <Text style={typography.caption}>
        Sleep, food, water, and weight tracking are coming in the next build pass.
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
