import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';
import type { OverloadDirection } from '../../lib/workoutStats';

interface OverloadIndicatorProps {
  direction: OverloadDirection;
  label?: string;
}

const ICONS: Record<OverloadDirection, keyof typeof Ionicons.glyphMap> = {
  up: 'arrow-up',
  down: 'arrow-down',
  same: 'remove',
  none: 'remove',
};

const TINTS: Record<OverloadDirection, string> = {
  up: colors.success,
  down: colors.danger,
  same: colors.textMuted,
  none: colors.textMuted,
};

export function OverloadIndicator({ direction, label }: OverloadIndicatorProps) {
  if (direction === 'none') return null;

  return (
    <View style={styles.row}>
      <Ionicons name={ICONS[direction]} size={14} color={TINTS[direction]} />
      {label ? <Text style={[typography.caption, { color: TINTS[direction] }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
