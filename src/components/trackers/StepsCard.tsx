import { useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../ui/Card';
import { CircularProgressRing } from '../ui/CircularProgressRing';
import { SyncedBadge } from '../ui/SyncedBadge';
import { useStepsLog, useUpsertStepsLog } from '../../hooks/useStepsLogs';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface StepsCardProps {
  stepGoal: number;
}

export function StepsCard({ stepGoal }: StepsCardProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: log } = useStepsLog(today);
  const upsert = useUpsertStepsLog(today);
  const [customSteps, setCustomSteps] = useState('');

  const steps = log?.steps ?? 0;
  const progress = stepGoal > 0 ? steps / stepGoal : 0;

  const onAddManual = () => {
    const n = Number(customSteps);
    if (!n) return;
    upsert.mutate({ steps: steps + n, source: 'manual' }, { onSuccess: () => setCustomSteps('') });
  };

  return (
    <Card>
      <Text style={typography.heading}>Steps</Text>
      {log?.source === 'healthkit' && <SyncedBadge />}
      <View style={styles.body}>
        <CircularProgressRing progress={progress} size={100} strokeWidth={10}>
          <Text style={styles.ringValue}>{steps}</Text>
          <Text style={typography.caption}>/ {stepGoal}</Text>
        </CircularProgressRing>
        <View style={styles.form}>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Add steps"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={customSteps}
              onChangeText={setCustomSteps}
            />
            <Pressable style={styles.addButton} onPress={onAddManual} disabled={upsert.isPending}>
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
  buttonText: { color: colors.onAccent, fontWeight: '600' },
});
