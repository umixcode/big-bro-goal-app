import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../ui/Card';
import { CircularProgressRing } from '../ui/CircularProgressRing';
import { SyncedBadge } from '../ui/SyncedBadge';
import { useSleepLog, useUpsertSleepLog } from '../../hooks/useSleepLogs';
import { calculateSleepScore } from '../../lib/formulas';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface SleepCardProps {
  sleepGoalHours: number;
}

export function SleepCard({ sleepGoalHours }: SleepCardProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: log } = useSleepLog(today);
  const upsert = useUpsertSleepLog(today);

  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (log) {
      setHours(String(Math.floor(log.total_minutes / 60)));
      setMinutes(String(log.total_minutes % 60));
    }
  }, [log?.id]);

  const totalMinutes = log?.total_minutes ?? 0;
  const progress = sleepGoalHours > 0 ? totalMinutes / (sleepGoalHours * 60) : 0;
  const score = calculateSleepScore(totalMinutes, sleepGoalHours);

  const onSave = () => {
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const total = h * 60 + m;
    if (total <= 0) return;
    upsert.mutate({ total_minutes: total, score: calculateSleepScore(total, sleepGoalHours) });
  };

  return (
    <Card>
      <Text style={typography.heading}>Sleep</Text>
      {log?.source === 'healthkit' && <SyncedBadge />}
      <View style={styles.body}>
        <CircularProgressRing progress={progress} size={100} strokeWidth={10}>
          <Text style={styles.ringValue}>{(totalMinutes / 60).toFixed(1)}h</Text>
          <Text style={typography.caption}>{score}%</Text>
        </CircularProgressRing>
        <View style={styles.form}>
          <Text style={typography.caption}>Goal: {sleepGoalHours}h</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="hrs"
              placeholderTextColor={colors.textMuted}
              value={hours}
              onChangeText={setHours}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="min"
              placeholderTextColor={colors.textMuted}
              value={minutes}
              onChangeText={setMinutes}
            />
          </View>
          <Pressable style={styles.button} onPress={onSave} disabled={upsert.isPending}>
            <Text style={styles.buttonText}>{upsert.isPending ? 'Saving…' : 'Log sleep'}</Text>
          </Pressable>
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
  button: { backgroundColor: colors.accent, borderRadius: radii.md, padding: spacing.sm, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontWeight: '600' },
});
