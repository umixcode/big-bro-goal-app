import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../lib/theme';

interface SparklineProps {
  values: number[];
  height?: number;
  style?: ViewStyle;
}

export function Sparkline({ values, height = 40, style }: SparklineProps) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, max);
  const range = max - min || 1;

  return (
    <View style={[styles.sparkline, { height }, style]}>
      {values.map((value, index) => {
        const heightPct = ((value - min) / range) * 0.8 + 0.2;
        return <View key={index} style={[styles.bar, { height: `${heightPct * 100}%` }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flex: 1, backgroundColor: colors.accent, borderRadius: 2, minHeight: 4 },
});
