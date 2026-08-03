import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Card } from '../ui/Card';
import { useTodayPrayerTimes } from '../../hooks/usePrayerTimes';
import { colors, spacing, typography } from '../../lib/theme';

export function PrayerTimesCard({ style }: { style?: ViewStyle }) {
  const { data: prayers, isLoading } = useTodayPrayerTimes();

  return (
    <Card style={style}>
      <Text style={typography.eyebrow}>Salah Time</Text>

      {isLoading && <Text style={[typography.caption, { marginTop: spacing.sm }]}>Loading…</Text>}

      {!isLoading && !prayers && (
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          Enable location access to see today's Athan and Iqama times.
        </Text>
      )}

      {prayers && (
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[typography.caption, styles.name]} />
            <Text style={[typography.caption, styles.time]}>Athan</Text>
            <Text style={[typography.caption, styles.time]}>Iqama</Text>
          </View>
          {prayers.map((prayer) => (
            <View key={prayer.key} style={styles.row}>
              <Text style={[typography.body, styles.name]}>{prayer.name}</Text>
              <Text style={[typography.body, styles.time]}>{prayer.athan}</Text>
              <Text style={[typography.body, styles.time]}>{prayer.iqama}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  table: { marginTop: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  name: { flex: 1 },
  time: { flex: 1, textAlign: 'right' },
});
