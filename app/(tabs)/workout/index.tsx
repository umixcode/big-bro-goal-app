import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MonthStreakCalendar } from '../../../src/components/workout/MonthStreakCalendar';
import { ProgramDayCard } from '../../../src/components/workout/ProgramDayCard';
import { StreakBadge } from '../../../src/components/workout/StreakBadge';
import { TodayActivityCard } from '../../../src/components/workout/TodayActivityCard';
import { WeekProgressRow } from '../../../src/components/workout/WeekProgressRow';
import { useDefaultPhase, usePhaseDayExercises, usePhaseDays } from '../../../src/hooks/useWorkoutProgram';
import { useAuthSession } from '../../../src/hooks/useAuthSession';
import { useEnsureEnrollment } from '../../../src/hooks/useWorkoutEnrollment';
import {
  useLastCompletedDay,
  useSessionsForDate,
  useStreak,
  useWeekSummary,
} from '../../../src/hooks/useWorkoutSession';
import { projectAssignedDay, resolveAssignedDay } from '../../../src/lib/workoutStats';
import { spacing, workoutTheme } from '../../../src/lib/theme';
import type { WorkoutPhaseDay } from '../../../src/api/workoutPrograms';

// Phase day names carry a parenthetical suffix ("Push (Hypertrophy Focus)")
// that's too verbose for the "It's ___ day" headline.
function shortDayName(name: string) {
  return name.split(' (')[0];
}

function dateLabel(date: string, today: string): string {
  const diffDays = dayjs(date).diff(dayjs(today), 'day');
  if (diffDays === 0) return 'today';
  if (diffDays === -1) return 'yesterday';
  if (diffDays === 1) return 'tomorrow';
  return dayjs(date).format('ddd, MMM D');
}

function DayCard({ day, phaseId }: { day: WorkoutPhaseDay; phaseId: string }) {
  const router = useRouter();
  const { data: exercises = [] } = usePhaseDayExercises(day.id);

  return (
    <ProgramDayCard
      dayName={day.day_name}
      exerciseCount={exercises.length}
      onPress={() =>
        router.push({
          pathname: '/workout/session/[phaseDayId]',
          params: { phaseDayId: day.id, dayName: day.day_name, phaseId },
        })
      }
    />
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const signupDate = session?.user.created_at ?? null;
  const { data: phase } = useDefaultPhase();
  useEnsureEnrollment(phase?.id);
  const { data: days = [] } = usePhaseDays(phase?.id);
  const { data: weekSummary = [] } = useWeekSummary();
  const { data: streak = 0 } = useStreak();
  const { data: lastCompleted } = useLastCompletedDay();
  const [changeWorkoutOpen, setChangeWorkoutOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);

  const today = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const assigned = useMemo(
    () => resolveAssignedDay(days, lastCompleted ?? null, today),
    [days, lastCompleted, today]
  );
  const previewAssigned = useMemo(
    () => (isFuture ? projectAssignedDay(days, lastCompleted ?? null, selectedDate) : null),
    [isFuture, days, lastCompleted, selectedDate]
  );
  const { data: pastSessions = [] } = useSessionsForDate(!isToday && !isFuture ? selectedDate : undefined);

  const todayStatus = weekSummary.find((d) => d.date === today)?.status ?? 'none';
  const ctaLabel =
    todayStatus === 'complete' ? 'View workout ✓' : todayStatus === 'partial' ? 'View workout' : 'Start workout';

  const onStart = () => {
    if (assigned.kind !== 'workout' || !phase) return;
    router.push({
      pathname: '/workout/session/[phaseDayId]',
      params: { phaseDayId: assigned.day.id, dayName: assigned.day.day_name, phaseId: phase.id },
    });
  };

  return (
    <ScrollView style={{ backgroundColor: workoutTheme.background }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Workout</Text>
      {phase ? (
        <Text style={styles.subtitle}>
          {phase.program.name} · {phase.name}
        </Text>
      ) : (
        <Text style={styles.subtitle}>Loading your program…</Text>
      )}

      <StreakBadge days={streak} />

      {weekSummary.length > 0 && (
        <WeekProgressRow
          days={weekSummary}
          signupDate={signupDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          expanded={monthOpen}
          onToggleMonth={() => setMonthOpen((prev) => !prev)}
        />
      )}

      {monthOpen && (
        <MonthStreakCalendar signupDate={signupDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      )}

      {days.length > 0 && (
        <View style={styles.heroCard}>
          <View style={styles.heroEyebrowRow}>
            <Text style={styles.heroEyebrow}>{dateLabel(selectedDate, today)}</Text>
            {!isToday && (
              <Pressable onPress={() => setSelectedDate(today)} hitSlop={8}>
                <Text style={styles.backToToday}>back to today</Text>
              </Pressable>
            )}
          </View>

          {isToday && assigned.kind === 'workout' && (
            <>
              <Text style={styles.heroTitle}>It's {shortDayName(assigned.day.day_name)} day</Text>
              <Pressable
                style={[styles.startButton, todayStatus === 'complete' && styles.startButtonDone]}
                onPress={onStart}
              >
                <Text
                  style={[styles.startButtonText, todayStatus === 'complete' && styles.startButtonTextDone]}
                >
                  {ctaLabel}
                </Text>
              </Pressable>
            </>
          )}
          {isToday && assigned.kind === 'rest' && (
            <>
              <Text style={styles.heroTitle}>It's a rest day</Text>
              <Text style={styles.restSubtitle}>Recovery — no workout scheduled.</Text>
            </>
          )}

          {!isToday && isFuture && previewAssigned?.kind === 'workout' && (
            <>
              <Text style={styles.heroTitle}>{shortDayName(previewAssigned.day.day_name)} day</Text>
              <Text style={styles.restSubtitle}>Preview — rotation isn't final until then.</Text>
            </>
          )}
          {!isToday && isFuture && previewAssigned?.kind === 'rest' && (
            <>
              <Text style={styles.heroTitle}>Rest day</Text>
              <Text style={styles.restSubtitle}>Preview — no workout scheduled.</Text>
            </>
          )}

          {!isToday && !isFuture && pastSessions.length > 0 && (
            <>
              <Text style={styles.heroTitle}>{shortDayName(pastSessions[0].dayName ?? 'Workout')} day</Text>
              <Text style={styles.restSubtitle}>View past workout</Text>
            </>
          )}
          {!isToday && !isFuture && pastSessions.length === 0 && (
            <Text style={styles.heroTitle}>No workout logged</Text>
          )}
        </View>
      )}

      {!isFuture && <TodayActivityCard date={selectedDate} />}

      {isToday && todayStatus !== 'complete' && (
        <>
          <Pressable style={styles.changeToggle} onPress={() => setChangeWorkoutOpen((prev) => !prev)}>
            <Text style={styles.changeToggleText}>change workout</Text>
            <Ionicons
              name={changeWorkoutOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={workoutTheme.textMuted}
            />
          </Pressable>

          {changeWorkoutOpen && phase && (
            <View style={styles.changeList}>
              {days.map((day) => (
                <DayCard key={day.id} day={day} phaseId={phase.id} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: workoutTheme.background,
    padding: spacing.lg,
  },
  title: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 34,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
  },
  subtitle: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 12,
    letterSpacing: 0.5,
    color: workoutTheme.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  heroEyebrow: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
  },
  backToToday: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 12,
    color: workoutTheme.accent,
  },
  heroTitle: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 28,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  restSubtitle: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 15,
    color: workoutTheme.textSecondary,
  },
  startButton: {
    backgroundColor: workoutTheme.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  startButtonDone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: workoutTheme.accentMuted,
  },
  startButtonText: { color: workoutTheme.background, fontWeight: '700', fontSize: 16 },
  startButtonTextDone: { color: workoutTheme.accent },
  changeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  changeToggleText: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.textMuted,
  },
  changeList: { marginTop: spacing.xs },
});
