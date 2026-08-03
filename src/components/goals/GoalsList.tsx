import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from '../../hooks/useGoals';
import type { Goal, GoalCategory, GoalStatus } from '../../api/goals';
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
  const deleteGoal = useDeleteGoal();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('custom');

  const onAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createGoal.mutate({ title: trimmed, category });
    setTitle('');
    setCategory('custom');
  };

  const onDelete = (goal: Goal) => {
    Alert.alert('Delete goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal.mutate(goal.id) },
    ]);
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
            <View style={styles.goalHeader}>
              <Text style={[typography.body, { flex: 1 }]}>{goal.title}</Text>
              <Pressable onPress={() => onDelete(goal)} hitSlop={8} disabled={deleteGoal.isPending}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
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
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
