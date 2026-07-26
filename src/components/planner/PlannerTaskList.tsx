import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useCreatePlannerTask,
  useDeletePlannerTask,
  usePlannerTasks,
  useTogglePlannerTask,
} from '../../hooks/usePlannerTasks';
import { Card } from '../ui/Card';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface PlannerTaskListProps {
  date: string;
  compact?: boolean;
}

export function PlannerTaskList({ date, compact = false }: PlannerTaskListProps) {
  const { data: tasks = [] } = usePlannerTasks(date);
  const createTask = useCreatePlannerTask();
  const toggleTask = useTogglePlannerTask();
  const deleteTask = useDeletePlannerTask();
  const [title, setTitle] = useState('');

  const onAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask.mutate({ date, title: trimmed });
    setTitle('');
  };

  return (
    <Card>
      <Text style={typography.eyebrow}>Planner</Text>
      <View style={{ marginTop: spacing.sm }}>
        {tasks.length === 0 && <Text style={typography.caption}>Nothing planned yet.</Text>}
        {tasks.map((task) => (
          <View key={task.id} style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() => toggleTask.mutate({ id: task.id, isCompleted: !task.is_completed })}
            >
              <Ionicons
                name={task.is_completed ? 'checkbox' : 'square-outline'}
                size={20}
                color={task.is_completed ? colors.success : colors.textMuted}
              />
              <Text
                style={[
                  typography.body,
                  { marginLeft: spacing.sm },
                  task.is_completed && styles.completedText,
                ]}
              >
                {task.title}
              </Text>
            </Pressable>
            {!compact && (
              <Pressable onPress={() => deleteTask.mutate(task.id)} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={onAdd}>
          <Ionicons name="add" size={20} color={colors.onAccent} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  completedText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
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
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
