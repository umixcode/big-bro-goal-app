import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useActionTasks,
  useCreateActionTask,
  useDeleteActionTask,
  useSetActionTaskStatus,
} from '../../hooks/useActionTasks';
import type { ActionStatus, ActionTask } from '../../api/actions';
import { Card } from '../ui/Card';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface ActionsListProps {
  date: string;
  compact?: boolean;
}

// Bullet-journal style signifiers. `status` is null for a plain, unmarked
// task — the options below are what a task can be marked as instead.
const STATUS_META: Record<
  ActionStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; strikethrough?: boolean }
> = {
  completed: { label: 'Completed', icon: 'checkmark-circle', color: colors.success, strikethrough: true },
  partially_completed: { label: 'Partially completed', icon: 'contrast-outline', color: colors.warning },
  migrated: { label: 'Migrated', icon: 'arrow-forward-circle-outline', color: colors.accent },
  scheduled: { label: 'Scheduled', icon: 'calendar-outline', color: colors.accent },
  cancelled: { label: 'Cancelled', icon: 'close-circle-outline', color: colors.danger, strikethrough: true },
  priority: { label: 'Priority', icon: 'star', color: colors.warning },
  event: { label: 'Event', icon: 'ellipse-outline', color: colors.textSecondary },
  note: { label: 'Note', icon: 'document-text-outline', color: colors.textSecondary },
};

const STATUS_ORDER: ActionStatus[] = [
  'completed',
  'partially_completed',
  'migrated',
  'scheduled',
  'cancelled',
  'priority',
  'event',
  'note',
];

function TaskRow({ task, compact }: { task: ActionTask; compact: boolean }) {
  const setStatus = useSetActionTaskStatus();
  const deleteTask = useDeleteActionTask();

  const meta = task.status ? STATUS_META[task.status] : null;

  const onPressStatus = () => {
    Alert.alert(task.title, 'Mark this task as…', [
      ...STATUS_ORDER.map((status) => ({
        text: STATUS_META[status].label,
        onPress: () => setStatus.mutate({ id: task.id, status }),
      })),
      ...(task.status ? [{ text: 'Clear', onPress: () => setStatus.mutate({ id: task.id, status: null }) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={styles.row}>
      <Pressable style={styles.rowMain} onPress={onPressStatus}>
        <Ionicons name={meta?.icon ?? 'square-outline'} size={20} color={meta?.color ?? colors.textMuted} />
        <Text
          style={[typography.body, { marginLeft: spacing.sm }, meta?.strikethrough && styles.completedText]}
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
  );
}

export function ActionsList({ date, compact = false }: ActionsListProps) {
  const { data: tasks = [] } = useActionTasks(date);
  const createTask = useCreateActionTask();
  const [title, setTitle] = useState('');

  const onAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask.mutate({ date, title: trimmed });
    setTitle('');
  };

  return (
    <Card>
      <Text style={typography.eyebrow}>Actions</Text>
      <View style={{ marginTop: spacing.sm }}>
        {tasks.length === 0 && <Text style={typography.caption}>Nothing planned yet.</Text>}
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} compact={compact} />
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
