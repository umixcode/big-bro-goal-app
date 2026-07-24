import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors, radii, spacing, typography } from '../../lib/theme';

type ComingSoonVariant = 'plain' | 'dots' | 'ring' | 'rows';

interface ComingSoonCardProps {
  title: string;
  variant?: ComingSoonVariant;
  rows?: string[];
  style?: ViewStyle;
}

export function ComingSoonCard({ title, variant = 'plain', rows, style }: ComingSoonCardProps) {
  return (
    <Card style={style}>
      <Text style={typography.heading}>{title}</Text>

      {variant === 'dots' && (
        <View style={styles.dotsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name="ellipse-outline" size={22} color={colors.textMuted} />
          ))}
        </View>
      )}

      {variant === 'ring' && (
        <View style={styles.ringWrap}>
          <View style={styles.ring} />
        </View>
      )}

      {variant === 'rows' && rows && (
        <View style={{ marginTop: spacing.sm }}>
          {rows.map((row) => (
            <View key={row} style={styles.row}>
              <Text style={typography.body}>{row}</Text>
              <Text style={typography.caption}>--:--</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[typography.caption, { marginTop: spacing.sm }]}>Coming soon</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
});
