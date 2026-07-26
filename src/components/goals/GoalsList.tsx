import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCreateGoal, useGoals, useUpdateGoal } from '../../hooks/useGoals';
import type { GoalCategory, GoalStatus } from '../../api/goals';
import { Card } from '../ui/Card';
import { ChipSelect } from '../ui/ChipSelect';
import { colors, radii, spacing, typography } from '../../lib/theme';

const categoryOptions: { value: GoalCategory; label: string }[] = [
  { value: 'weight', label: 'Weight' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'food', label: 'Food' },
  { value: 'reading', label: 'Reading' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'workout', label: 'Workout' },
  { value: 'custom', label: 'Custom' },
];

const statusOptions: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function GoalsList() {
  const { data: goals = [] } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('custom');

  const onAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createGoal.mutate({ title: trimmed, category });
    setTitle('');
    setCategory('custom');
  };

  return (
    <View>
      <Card>
        <Text style={typography.heading}>New goal</Text>
        <TextInput
          style={styles.input}
          placeholder="What are you working toward?"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <View style={{ marginTop: spacing.sm }}>
          <ChipSelect options={categoryOptions} value={category} onChange={setCategory} />
        </View>
        <Pressable style={styles.addButton} onPress={onAdd} disabled={createGoal.isPending}>
          <Text style={styles.addButtonText}>{createGoal.isPending ? 'Adding…' : 'Add goal'}</Text>
        </Pressable>
      </Card>

      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        {goals.length === 0 && (
          <Card>
            <Text style={typography.caption}>No goals yet — add one above.</Text>
          </Card>
        )}
        {goals.map((goal) => (
          <Card key={goal.id}>
            <Text style={typography.body}>{goal.title}</Text>
            <Text style={[typography.caption, { marginTop: spacing.xs }]}>
              {categoryOptions.find((c) => c.value === goal.category)?.label ?? goal.category}
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <ChipSelect
                options={statusOptions}
                value={goal.status}
                onChange={(status) => updateGoal.mutate({ id: goal.id, patch: { status } })}
              />
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    color: colors.onAccent,
    fontWeight: '600',
    fontSize: 16,
  },
});
