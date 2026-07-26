import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCreateJournalEntry } from '../../hooks/useJournalEntries';
import { Card } from '../ui/Card';
import { ChipSelect } from '../ui/ChipSelect';
import { colors, radii, spacing, typography } from '../../lib/theme';

const moodOptions = [
  { value: '1', label: '😞' },
  { value: '2', label: '🙁' },
  { value: '3', label: '😐' },
  { value: '4', label: '🙂' },
  { value: '5', label: '😄' },
];

export function JournalComposer() {
  const createEntry = useCreateJournalEntry();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);

  const onSave = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    createEntry.mutate(
      { content: trimmed, mood_score: mood ? Number(mood) : null },
      {
        onSuccess: () => {
          setContent('');
          setMood(null);
        },
      }
    );
  };

  return (
    <Card>
      <Text style={typography.eyebrow}>Journal</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
        How's it going today?
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Write whatever's on your mind…"
        placeholderTextColor={colors.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
      />

      <View style={{ marginTop: spacing.sm }}>
        <ChipSelect options={moodOptions} value={mood} onChange={setMood} />
      </View>

      <Pressable style={styles.button} onPress={onSave} disabled={createEntry.isPending}>
        <Text style={styles.buttonText}>{createEntry.isPending ? 'Saving…' : 'Save entry'}</Text>
      </Pressable>
    </Card>
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
    minHeight: 90,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '600',
    fontSize: 16,
  },
});
