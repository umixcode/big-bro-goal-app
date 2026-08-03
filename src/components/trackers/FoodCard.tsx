import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { MacroWedgeChart } from '../ui/MacroWedgeChart';
import { GoalHeatmap } from './GoalHeatmap';
import { SwipeReveal } from './SwipeReveal';
import { useCreateFoodEntry, useDeleteFoodEntry, useFoodEntries, useFoodHeatmap } from '../../hooks/useFoodEntries';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface FoodCardProps {
  calorieGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
}

export function FoodCard({ calorieGoal, proteinGoal, fatGoal, carbsGoal }: FoodCardProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: entries = [] } = useFoodEntries(today);
  const createEntry = useCreateFoodEntry(today);
  const deleteEntry = useDeleteFoodEntry(today);
  const { days } = useFoodHeatmap(calorieGoal);

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein_g,
      carbs: acc.carbs + e.carbs_g,
      fat: acc.fat + e.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const onAdd = () => {
    const cal = Number(calories);
    if (!name.trim() || !cal) return;
    createEntry.mutate(
      { name: name.trim(), calories: cal, protein_g: Number(protein) || 0, carbs_g: Number(carbs) || 0, fat_g: Number(fat) || 0 },
      {
        onSuccess: () => {
          setName('');
          setCalories('');
          setProtein('');
          setCarbs('');
          setFat('');
        },
      }
    );
  };

  return (
    <SwipeReveal
      front={
        <Card>
          <Text style={typography.heading}>Food</Text>
          <View style={styles.body}>
            <MacroWedgeChart
              size={120}
              strokeWidth={11}
              wedges={[
                { label: 'Protein', progress: proteinGoal > 0 ? totals.protein / proteinGoal : 0, color: colors.macroProtein },
                { label: 'Fat', progress: fatGoal > 0 ? totals.fat / fatGoal : 0, color: colors.macroFat },
                { label: 'Carbs', progress: carbsGoal > 0 ? totals.carbs / carbsGoal : 0, color: colors.macroCarbs },
              ]}
            >
              <Text style={styles.ringValue}>{Math.round(totals.calories)}</Text>
              <Text style={typography.caption}>/ {calorieGoal} kcal</Text>
            </MacroWedgeChart>
            <View style={styles.legend}>
              <LegendRow color={colors.macroProtein} label="Protein" value={`${Math.round(totals.protein)} / ${proteinGoal}g`} />
              <LegendRow color={colors.macroFat} label="Fat" value={`${Math.round(totals.fat)} / ${fatGoal}g`} />
              <LegendRow color={colors.macroCarbs} label="Carbs" value={`${Math.round(totals.carbs)} / ${carbsGoal}g`} />
            </View>
          </View>

          {entries.length > 0 && (
            <View style={styles.list}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.listRow}>
                  <Text style={typography.body}>{entry.name}</Text>
                  <View style={styles.listRight}>
                    <Text style={typography.caption}>{entry.calories} kcal</Text>
                    <Pressable onPress={() => deleteEntry.mutate(entry.id)}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Food name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.row}>
              <TextInput style={styles.input} placeholder="kcal" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={calories} onChangeText={setCalories} />
              <TextInput style={styles.input} placeholder="protein g" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={protein} onChangeText={setProtein} />
              <TextInput style={styles.input} placeholder="carbs g" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={carbs} onChangeText={setCarbs} />
              <TextInput style={styles.input} placeholder="fat g" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={fat} onChangeText={setFat} />
            </View>
            <Pressable style={styles.button} onPress={onAdd} disabled={createEntry.isPending}>
              <Text style={styles.buttonText}>{createEntry.isPending ? 'Adding…' : 'Add food'}</Text>
            </Pressable>
          </View>
        </Card>
      }
      back={
        <Card>
          <GoalHeatmap title="Food" days={days} />
        </Card>
      }
    />
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={typography.caption}>{label}</Text>
      <Text style={[typography.caption, styles.legendValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ringValue: { color: colors.textPrimary, fontWeight: '700', fontSize: 18 },
  legend: { flex: 1, gap: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendValue: { marginLeft: 'auto' },
  dot: { width: 8, height: 8, borderRadius: radii.full },
  list: { marginTop: spacing.md, gap: spacing.xs },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  form: { marginTop: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    color: colors.textPrimary,
  },
  button: { backgroundColor: colors.accent, borderRadius: radii.md, padding: spacing.sm, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontWeight: '600' },
});
