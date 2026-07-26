import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../lib/theme';

export function SyncedBadge() {
  return <Text style={styles.caption}>Synced from Health</Text>;
}

const styles = StyleSheet.create({
  caption: { ...typography.caption, marginTop: spacing.xs, color: colors.textMuted },
});
