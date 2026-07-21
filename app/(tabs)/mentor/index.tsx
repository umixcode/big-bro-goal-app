import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function MentorScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>AI Mentor</Text>
      <Text style={typography.caption}>
        The mentor chat is stubbed for now — no model is wired up yet by design.
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
