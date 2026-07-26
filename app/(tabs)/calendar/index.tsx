import { useState } from 'react';
import dayjs from 'dayjs';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChipSelect } from '../../../src/components/ui/ChipSelect';
import { PlannerTaskList } from '../../../src/components/planner/PlannerTaskList';
import { GoalsList } from '../../../src/components/goals/GoalsList';
import { JournalComposer } from '../../../src/components/journal/JournalComposer';
import { JournalHistoryList } from '../../../src/components/journal/JournalHistoryList';
import { CalendarView } from '../../../src/components/calendar/CalendarView';
import { colors, spacing, typography } from '../../../src/lib/theme';

type Tab = 'daily' | 'calendar';
type DailySection = 'planner' | 'goals' | 'journal';

const tabOptions: { value: Tab; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'calendar', label: 'Calendar' },
];

const dailySectionOptions: { value: DailySection; label: string }[] = [
  { value: 'planner', label: 'Planner' },
  { value: 'goals', label: 'Goals' },
  { value: 'journal', label: 'Journal' },
];

export default function CalendarScreen() {
  const [tab, setTab] = useState<Tab>('daily');
  const [dailySection, setDailySection] = useState<DailySection>('planner');

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={typography.title}>Calendar</Text>
      <View style={styles.switcher}>
        <ChipSelect options={tabOptions} value={tab} onChange={setTab} />
      </View>

      {tab === 'daily' && (
        <View>
          <View style={styles.switcher}>
            <ChipSelect options={dailySectionOptions} value={dailySection} onChange={setDailySection} />
          </View>
          {dailySection === 'planner' && <PlannerTaskList date={dayjs().format('YYYY-MM-DD')} />}
          {dailySection === 'goals' && <GoalsList />}
          {dailySection === 'journal' && (
            <View style={{ gap: spacing.sm }}>
              <JournalComposer />
              <JournalHistoryList />
            </View>
          )}
        </View>
      )}

      {tab === 'calendar' && <CalendarView />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  switcher: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
