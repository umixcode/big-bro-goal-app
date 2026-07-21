import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function BrainScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Brain Tracker</Text>
      <Text style={typography.caption}>Track what you're reading — coming in a later build pass.</Text>
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
