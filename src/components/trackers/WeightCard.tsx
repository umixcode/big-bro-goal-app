import { useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { SyncedBadge } from '../ui/SyncedBadge';
import { WeightTrendChart } from '../ui/WeightTrendChart';
import { useDeleteWeightLog, useUpsertWeightLog, useWeightLogs } from '../../hooks/useWeightLogs';
import { useProfile, useUpsertProfile } from '../../hooks/useProfile';
import { formatWeight, parseWeightToKg } from '../../lib/units';
import { colors, radii, spacing, typography } from '../../lib/theme';

export function WeightCard() {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const { data: logs = [] } = useWeightLogs(30);
  const upsertWeight = useUpsertWeightLog();
  const deleteWeight = useDeleteWeightLog();
  const [value, setValue] = useState('');

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const unitLabel = unitsPreference === 'metric' ? 'kg' : 'lb';
  const latest = logs[0] ?? null;
  const chronological = [...logs].reverse();

  const onSave = () => {
    const numeric = Number(value);
    if (!numeric) return;
    const weightKg = parseWeightToKg(numeric, unitsPreference);
    upsertWeight.mutate({ date: today, weight_kg: weightKg }, { onSuccess: () => setValue('') });
    upsertProfile.mutate({ current_weight_kg: weightKg });
  };

  const onDelete = (id: string, date: string) => {
    Alert.alert('Delete entry', `Remove the weight logged on ${dayjs(date).format('MMM D, YYYY')}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWeight.mutate(id) },
    ]);
  };

  return (
    <Card>
      <Text style={typography.heading}>Weight</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs }]}>
        {latest ? `Latest: ${formatWeight(latest.weight_kg, unitsPreference)} ${unitLabel} on ${latest.date}` : 'No entries yet'}
      </Text>
      {latest?.source === 'healthkit' && <SyncedBadge />}

      {chronological.length > 1 && (
        <View style={{ marginTop: spacing.sm }}>
          <WeightTrendChart logs={chronological} unitsPreference={unitsPreference} />
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

      {logs.length > 0 && (
        <View style={styles.history}>
          <Text style={[typography.eyebrow, { marginBottom: spacing.xs }]}>History</Text>
          {logs.map((log) => (
            <View key={log.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{dayjs(log.date).format('MMM D, YYYY')}</Text>
              <View style={styles.historyValueGroup}>
                <Text style={styles.historyValue}>
                  {formatWeight(log.weight_kg, unitsPreference)} {unitLabel}
                </Text>
                {log.source === 'healthkit' && <SyncedBadge />}
              </View>
              <Pressable onPress={() => onDelete(log.id, log.date)} hitSlop={8} disabled={deleteWeight.isPending}>
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
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
  buttonText: { color: colors.onAccent, fontWeight: '600' },
  history: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  historyDate: { ...typography.caption, flex: 1 },
  historyValueGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginRight: spacing.sm },
  historyValue: { ...typography.body, fontSize: 14 },
});
