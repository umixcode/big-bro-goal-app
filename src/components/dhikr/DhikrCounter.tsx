import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDhikrToday, useIncrementDhikr } from '../../hooks/useDhikr';
import { Card } from '../ui/Card';
import { colors, radii, spacing, typography } from '../../lib/theme';

export function DhikrCounter() {
  const { data } = useDhikrToday();
  const increment = useIncrementDhikr();
  const count = data?.count ?? 0;

  return (
    <Card style={styles.card}>
      <View>
        <Text style={typography.heading}>Dhikr</Text>
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>Today's count</Text>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => increment.mutate(1)}
        accessibilityRole="button"
        accessibilityLabel="Tap to count dhikr"
      >
        <Text style={styles.count}>{count}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
