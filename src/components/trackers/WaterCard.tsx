import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../ui/Card';
import { CircularProgressRing } from '../ui/CircularProgressRing';
import { useAddWaterLog, useWaterLogs } from '../../hooks/useWaterLogs';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface WaterCardProps {
  waterGoalMl: number;
  cupMl: number;
  bottleMl: number;
}

export function WaterCard({ waterGoalMl, cupMl, bottleMl }: WaterCardProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const { totalMl } = useWaterLogs(today);
  const addWater = useAddWaterLog(today);
  const [customMl, setCustomMl] = useState('');

  const progress = waterGoalMl > 0 ? totalMl / waterGoalMl : 0;

  const onAddCustom = () => {
    const ml = Number(customMl);
    if (!ml) return;
    addWater.mutate(ml, { onSuccess: () => setCustomMl('') });
  };

  return (
    <Card>
      <Text style={typography.heading}>Water</Text>
      <View style={styles.body}>
        <CircularProgressRing progress={progress} size={100} strokeWidth={10}>
          <Text style={styles.ringValue}>{totalMl}</Text>
          <Text style={typography.caption}>/ {waterGoalMl}ml</Text>
        </CircularProgressRing>
        <View style={styles.form}>
          <View style={styles.row}>
            <Pressable style={styles.quickAdd} onPress={() => addWater.mutate(cupMl)}>
              <Text style={styles.quickAddText}>+ Cup ({cupMl}ml)</Text>
            </Pressable>
            <Pressable style={styles.quickAdd} onPress={() => addWater.mutate(bottleMl)}>
              <Text style={styles.quickAddText}>+ Bottle ({bottleMl}ml)</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Custom ml"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={customMl}
              onChangeText={setCustomMl}
            />
            <Pressable style={styles.addButton} onPress={onAddCustom} disabled={addWater.isPending}>
              <Text style={styles.buttonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ringValue: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  form: { flex: 1, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  quickAdd: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  quickAddText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
