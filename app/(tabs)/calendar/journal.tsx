import { useState } from 'react';
import dayjs from 'dayjs';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useJournalPhotosForMonth } from '../../../src/hooks/useJournalEntries';
import { calendarTheme, colors, radii, spacing, typography } from '../../../src/lib/theme';

const DAY_SIZE = 44;

export default function JournalCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [monthKey, setMonthKey] = useState(dayjs().format('YYYY-MM'));
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const { data: photosByDate = {} } = useJournalPhotosForMonth(monthKey);
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}
    >
      <View style={styles.header}>
        <Text style={typography.title}>Photo journal</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Calendar
        current={`${monthKey}-01`}
        onMonthChange={(date: DateData) => setMonthKey(date.dateString.slice(0, 7))}
        enableSwipeMonths
        theme={calendarTheme}
        style={styles.calendar}
        dayComponent={({ date }: { date?: DateData }) => {
          if (!date) return <View style={styles.dayCell} />;
          const inMonth = date.dateString.slice(0, 7) === monthKey;
          const photoUrl = photosByDate[date.dateString];

          return (
            <Pressable
              style={styles.dayCell}
              onPress={() =>
                photoUrl
                  ? setViewingDate(date.dateString)
                  : router.navigate({ pathname: '/(tabs)/calendar', params: { date: date.dateString } })
              }
            >
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.dayPhoto} />
              ) : (
                <View style={[styles.dayPhoto, styles.dayPhotoEmpty]}>
                  <Text style={[typography.caption, !inMonth && { color: colors.textMuted }]}>{date.day}</Text>
                </View>
              )}
              {date.dateString === today && <View style={styles.todayDot} />}
            </Pressable>
          );
        }}
      />

      <Modal
        visible={viewingDate != null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingDate(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewingDate(null)}>
          {viewingDate && photosByDate[viewingDate] && (
            <>
              <Image
                source={{ uri: photosByDate[viewingDate] }}
                style={[styles.viewerImage, { marginTop: insets.top }]}
                resizeMode="contain"
              />
              <Text style={[typography.caption, styles.viewerCaption]}>
                {dayjs(viewingDate).format('dddd, MMMM D, YYYY')}
              </Text>
            </>
          )}
          <Pressable
            style={[styles.viewerClose, { top: insets.top + spacing.sm }]}
            onPress={() => setViewingDate(null)}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendar: { backgroundColor: colors.background },
  dayCell: { width: DAY_SIZE, height: DAY_SIZE, alignItems: 'center', justifyContent: 'center' },
  dayPhoto: { width: DAY_SIZE - 6, height: DAY_SIZE - 6, borderRadius: radii.sm },
  dayPhotoEmpty: { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  viewerImage: {
    width: '100%',
    height: '75%',
    borderRadius: radii.md,
  },
  viewerCaption: {
    marginTop: spacing.md,
  },
  viewerClose: {
    position: 'absolute',
    right: spacing.lg,
  },
});
