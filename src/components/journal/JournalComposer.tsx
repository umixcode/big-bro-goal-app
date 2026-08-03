import { useState } from 'react';
import dayjs from 'dayjs';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useCreateJournalPhotoEntry,
  useDeleteJournalEntry,
  useJournalEntryForDate,
  useJournalPhotoUrl,
} from '../../hooks/useJournalEntries';
import { Card } from '../ui/Card';
import { colors, radii, spacing, typography } from '../../lib/theme';

interface JournalComposerProps {
  date: string;
}

export function JournalComposer({ date }: JournalComposerProps) {
  const router = useRouter();
  const { data: existing } = useJournalEntryForDate(date);
  const createEntry = useCreateJournalPhotoEntry();
  const deleteEntry = useDeleteJournalEntry();
  const [capturing, setCapturing] = useState(false);

  const isToday = date === dayjs().format('YYYY-MM-DD');
  const { data: photoUrl, isError: photoFailed } = useJournalPhotoUrl(existing?.photo_path);

  const onCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', "Enable camera access in Settings to take today's photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;

    setCapturing(true);
    createEntry.mutate(
      { uri: result.assets[0].uri, date },
      {
        onSettled: () => setCapturing(false),
        onError: (error) => Alert.alert('Save failed', error.message),
      }
    );
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete photo', "Remove today's journal photo? You won't be able to retake it.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEntry.mutate({ id: existing.id, photoPath: existing.photo_path }),
      },
    ]);
  };

  return (
    <Card onPress={() => router.push('/(tabs)/calendar/journal')}>
      <Text style={typography.eyebrow}>Journal</Text>

      {existing ? (
        <View style={styles.photoWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : photoFailed ? (
            <View style={[styles.photo, styles.photoLoading]}>
              <Ionicons name="image-outline" size={18} color={colors.textMuted} />
            </View>
          ) : (
            <View style={[styles.photo, styles.photoLoading]}>
              <ActivityIndicator color={colors.accent} size="small" />
            </View>
          )}
          <View style={styles.captionRow}>
            <Text style={typography.caption}>
              {isToday ? "Today's moment — captured." : dayjs(date).format('MMM D, YYYY')}
            </Text>
            <Pressable onPress={onDelete} hitSlop={8} disabled={deleteEntry.isPending}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      ) : isToday ? (
        <>
          <Text style={[typography.caption, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            One photo a day — no retakes once it's saved.
          </Text>
          <Pressable style={styles.button} onPress={onCapture} disabled={capturing || createEntry.isPending}>
            <Ionicons name="camera" size={18} color={colors.onAccent} />
            <Text style={styles.buttonText}>
              {capturing || createEntry.isPending ? 'Saving…' : "Take today's photo"}
            </Text>
          </Pressable>
        </>
      ) : (
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          No photo captured on {dayjs(date).format('MMM D')}.
        </Text>
      )}
    </Card>
  );
}

const THUMBNAIL_SIZE = 56;

const styles = StyleSheet.create({
  photoWrap: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photo: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  photoLoading: { alignItems: 'center', justifyContent: 'center' },
  captionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '600',
    fontSize: 16,
  },
});
