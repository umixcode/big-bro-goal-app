import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ActionsList } from '../../../src/components/actions/ActionsList';
import { JournalComposer } from '../../../src/components/journal/JournalComposer';
import { CalendarView } from '../../../src/components/calendar/CalendarView';
import { colors, spacing, typography } from '../../../src/lib/theme';

export default function CalendarScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const [selectedDate, setSelectedDate] = useState(dateParam ?? dayjs().format('YYYY-MM-DD'));

  // The photo-journal calendar navigates back here with a `date` param
  // (screen instance persists across that navigation, so a state
  // initializer alone wouldn't pick up the change).
  useEffect(() => {
    if (dateParam) setSelectedDate(dateParam);
  }, [dateParam]);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={typography.title}>Calendar</Text>

      <View style={{ marginTop: spacing.md }}>
        <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <ActionsList date={selectedDate} />
        <JournalComposer date={selectedDate} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
