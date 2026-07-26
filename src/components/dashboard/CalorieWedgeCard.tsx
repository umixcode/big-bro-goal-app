import dayjs from 'dayjs';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { MacroWedgeChart } from '../ui/MacroWedgeChart';
import { useFoodEntries } from '../../hooks/useFoodEntries';
import { useDailyTargets } from '../../hooks/useDailyTargets';
import { colors, spacing, typography } from '../../lib/theme';

export function CalorieWedgeCard({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  const today = dayjs().format('YYYY-MM-DD');
  const { data: entries = [] } = useFoodEntries(today);
  const { targets } = useDailyTargets();

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein_g,
      carbs: acc.carbs + e.carbs_g,
      fat: acc.fat + e.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Card onPress={() => router.push('/(tabs)/trackers')} style={style}>
      <Text style={typography.eyebrow}>Calorie Intake</Text>
      <View style={styles.wedgeWrap}>
        <MacroWedgeChart
          size={64}
          strokeWidth={7}
          wedges={[
            { label: 'Protein', progress: targets ? totals.protein / targets.proteinG : 0, color: colors.macroProtein },
            { label: 'Fat', progress: targets ? totals.fat / targets.fatG : 0, color: colors.macroFat },
            { label: 'Carbs', progress: targets ? totals.carbs / targets.carbsG : 0, color: colors.macroCarbs },
          ]}
        >
          <Text style={styles.value}>{Math.round(totals.calories)}</Text>
        </MacroWedgeChart>
      </View>
      <Text style={[typography.caption, styles.caption]}>
        {targets ? `of ${targets.calorieGoal} kcal` : 'Set goals to see target'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  wedgeWrap: { alignItems: 'center', marginTop: spacing.sm },
  value: { color: colors.textPrimary, fontWeight: '700', fontSize: 12 },
  caption: { textAlign: 'center', marginTop: spacing.xs },
});
