import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../ui/Card';
import { useUpsertWeightLog, useWeightLogs } from '../../hooks/useWeightLogs';
import { useProfile, useUpsertProfile } from '../../hooks/useProfile';
import { formatWeight, parseWeightToKg } from '../../lib/units';
import { colors, radii, spacing, typography } from '../../lib/theme';

export function WeightCard() {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const { data: logs = [] } = useWeightLogs(14);
  const upsertWeight = useUpsertWeightLog();
  const [value, setValue] = useState('');

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const latest = logs[0] ?? null;
  const chronological = [...logs].reverse();
  const maxWeight = Math.max(...chronological.map((l) => l.weight_kg), 1);
  const minWeight = Math.min(...chronological.map((l) => l.weight_kg), maxWeight);
  const range = maxWeight - minWeight || 1;

  const onSave = () => {
    const numeric = Number(value);
    if (!numeric) return;
    const weightKg = parseWeightToKg(numeric, unitsPreference);
    upsertWeight.mutate({ date: today, weight_kg: weightKg }, { onSuccess: () => setValue('') });
    upsertProfile.mutate({ current_weight_kg: weightKg });
  };

  return (
    <Card>
      <Text style={typography.heading}>Weight</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs }]}>
        {latest ? `Latest: ${formatWeight(latest.weight_kg, unitsPreference)} ${unitLabel} on ${latest.date}` : 'No entries yet'}
      </Text>

      {chronological.length > 1 && (
        <View style={styles.sparkline}>
          {chronological.map((log) => {
            const heightPct = ((log.weight_kg - minWeight) / range) * 0.8 + 0.2;
            return <View key={log.id} style={[styles.bar, { height: `${heightPct * 100}%` }]} />;
          })}
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder={`Weight (${unitLabel})`}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={value}
          onChangeText={setValue}
        />
        <Pressable style={styles.button} onPress={onSave} disabled={upsertWeight.isPending}>
          <Text style={styles.buttonText}>{upsertWeight.isPending ? 'Saving…' : 'Log weight'}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40, marginTop: spacing.sm },
  bar: { flex: 1, backgroundColor: colors.accent, borderRadius: 2, minHeight: 4 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
