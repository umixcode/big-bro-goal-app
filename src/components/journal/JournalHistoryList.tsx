import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';
import { useJournalEntries } from '../../hooks/useJournalEntries';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../lib/theme';

const moodEmoji: Record<number, string> = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

export function JournalHistoryList() {
  const { data: entries = [], isLoading } = useJournalEntries();

  if (isLoading) return null;

  if (entries.length === 0) {
    return (
      <Card style={{ marginTop: spacing.sm }}>
        <Text style={typography.caption}>No journal entries yet.</Text>
      </Card>
    );
  }

  return (
    <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
      {entries.map((entry) => (
        <Card key={entry.id}>
          <View style={styles.headerRow}>
            <Text style={typography.caption}>{dayjs(entry.entry_at).format('MMM D, YYYY · h:mm A')}</Text>
            {entry.mood_score != null && <Text style={styles.mood}>{moodEmoji[entry.mood_score]}</Text>}
          </View>
          <Text style={[typography.body, { marginTop: spacing.xs }]}>{entry.content}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mood: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
