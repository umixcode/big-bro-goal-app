import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateLoggedSet, useDeleteLoggedSet, usePreviousTopSet } from '../../hooks/useLoggedSets';
import { useExerciseNote, useSaveExerciseNote } from '../../hooks/useExerciseNotes';
import { useMachineSettings, useSaveMachineSettings } from '../../hooks/useMachineSettings';
import { useProfile } from '../../hooks/useProfile';
import { useSwapPhaseExercise } from '../../hooks/useWorkoutProgram';
import { classifyEquipment } from '../../lib/equipment';
import { compareOverload, parseRestSeconds, parseTargetReps, toKg } from '../../lib/workoutStats';
import { spacing, workoutTheme } from '../../lib/theme';
import { OverloadIndicator } from './OverloadIndicator';
import { SwipeableSetRow } from './SwipeableSetRow';
import type { LoggedSet } from '../../api/loggedSets';
import type { WorkoutPhaseExercise } from '../../api/workoutPrograms';

interface ExerciseLoggerProps {
  sessionId: string;
  phaseExercise: WorkoutPhaseExercise;
  sessionSets: LoggedSet[];
  onSetLogged: (exerciseName: string, restSeconds: number) => void;
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

interface SetDraft {
  weight: string;
  reps: string;
}

export function ExerciseLogger({ sessionId, phaseExercise, sessionSets, onSetLogged }: ExerciseLoggerProps) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: previousTopSet } = usePreviousTopSet(phaseExercise.exercise_name, sessionId);
  const createSet = useCreateLoggedSet(sessionId);
  const deleteSet = useDeleteLoggedSet(sessionId);
  const swapExercise = useSwapPhaseExercise(phaseExercise.phase_day_id);

  const equipment = classifyEquipment(phaseExercise.exercise_name);
  const { data: machineSettings } = useMachineSettings(phaseExercise.exercise_name, equipment !== null);
  const saveMachineSettings = useSaveMachineSettings(phaseExercise.exercise_name);
  const { data: exerciseNote } = useExerciseNote(phaseExercise.exercise_name);
  const saveExerciseNote = useSaveExerciseNote(phaseExercise.exercise_name);

  const [drafts, setDrafts] = useState<Record<number, SetDraft>>({});
  const [newRecordBanner, setNewRecordBanner] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [heightDraft, setHeightDraft] = useState('');
  const [widthDraft, setWidthDraft] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  const unitsPreference = profile?.units_preference ?? 'imperial';
  const weightUnit: 'lb' | 'kg' = unitsPreference === 'metric' ? 'kg' : 'lb';

  const loggedSets = useMemo(
    () => sessionSets.filter((set) => set.exercise_name === phaseExercise.exercise_name),
    [sessionSets, phaseExercise.exercise_name]
  );

  const currentTopKg = useMemo(() => {
    const withWeight = loggedSets.filter((set) => set.weight != null);
    if (withWeight.length === 0) return null;
    return Math.max(...withWeight.map((set) => toKg(set.weight as number, set.weight_unit)));
  }, [loggedSets]);

  const previousTopKg = previousTopSet ? toKg(previousTopSet.weight, previousTopSet.weight_unit) : null;
  const overloadDirection = compareOverload(currentTopKg, previousTopKg);

  const targetReps = parseTargetReps(phaseExercise.reps_range);
  const defaultWeight = previousTopSet
    ? String(
        weightUnit === previousTopSet.weight_unit
          ? previousTopSet.weight
          : Math.round(toKg(previousTopSet.weight, previousTopSet.weight_unit) * (weightUnit === 'kg' ? 1 : 2.2046))
      )
    : '';

  const workingSets = phaseExercise.working_sets ?? loggedSets.length;
  const pendingSetNumbers = Array.from(
    { length: Math.max(0, workingSets - loggedSets.length) },
    (_, i) => loggedSets.length + i + 1
  );


  const getDraft = (setNumber: number): SetDraft =>
    drafts[setNumber] ?? { weight: defaultWeight, reps: String(targetReps) };

  const updateDraft = (setNumber: number, patch: Partial<SetDraft>) => {
    setDrafts((prev) => ({ ...prev, [setNumber]: { ...getDraft(setNumber), ...patch } }));
  };

  const onLog = (setNumber: number, outcome: 'hit' | 'miss') => {
    const draft = getDraft(setNumber);
    const weightNum = Number(draft.weight);
    const repsNum = Number(draft.reps);
    if (!weightNum || !repsNum) return;

    createSet.mutate(
      {
        phase_exercise_id: phaseExercise.id,
        exercise_name: phaseExercise.exercise_name,
        set_number: setNumber,
        is_warmup: false,
        is_miss: outcome === 'miss',
        weight: weightNum,
        weight_unit: weightUnit,
        reps: outcome === 'hit' ? repsNum : Math.max(0, repsNum - 1),
        rpe: null,
      },
      {
        onSuccess: ({ newOneRepMax }) => {
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[setNumber];
            return next;
          });
          if (newOneRepMax) {
            setNewRecordBanner(true);
            setTimeout(() => setNewRecordBanner(false), 3000);
          }
          onSetLogged(phaseExercise.exercise_name, parseRestSeconds(phaseExercise.rest));
        },
      }
    );
  };

  const originalExerciseName = phaseExercise.original_exercise_name ?? phaseExercise.exercise_name;
  const swapCandidates = Array.from(
    new Set(
      [originalExerciseName, phaseExercise.substitution_option_1, phaseExercise.substitution_option_2].filter(
        (name): name is string => !!name && name !== phaseExercise.exercise_name
      )
    )
  );

  const onSwap = () => {
    if (swapCandidates.length === 0) {
      Alert.alert('Swap', 'No substitutions listed for this exercise.');
      return;
    }
    Alert.alert(
      'Swap exercise',
      `Currently: ${phaseExercise.exercise_name}${
        phaseExercise.original_exercise_name ? ` (originally ${originalExerciseName})` : ''
      }`,
      [
        ...swapCandidates.map((name) => ({
          text: name === originalExerciseName ? `${name} (original)` : name,
          onPress: () =>
            swapExercise.mutate(
              { phaseExerciseId: phaseExercise.id, newExerciseName: name, originalExerciseName },
              { onError: (error) => Alert.alert('Swap failed', error.message) }
            ),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const onTune = () => {
    Alert.alert(
      'Set scheme',
      `${phaseExercise.working_sets ?? '?'} sets · ${phaseExercise.reps_range ?? '?'} reps\nRPE ${
        phaseExercise.early_set_rpe ?? '?'
      }–${phaseExercise.last_set_rpe ?? '?'} · rest ${phaseExercise.rest ?? '?'}`
    );
  };

  const onInfo = () => {
    Alert.alert(phaseExercise.exercise_name, phaseExercise.notes || 'No notes for this exercise.');
  };

  const onOpenSettings = () => {
    setHeightDraft(machineSettings?.height ?? '');
    setWidthDraft(machineSettings?.width ?? '');
    setSettingsOpen(true);
  };

  const onSaveSettings = () => {
    saveMachineSettings.mutate(
      { height: heightDraft.trim() || null, width: equipment === 'cable' ? widthDraft.trim() || null : null },
      { onSuccess: () => setSettingsOpen(false), onError: (error) => Alert.alert('Save failed', error.message) }
    );
  };

  const onOpenNotes = () => {
    setNoteDraft(exerciseNote?.notes ?? '');
    setNotesOpen(true);
  };

  const onSaveNote = () => {
    saveExerciseNote.mutate(noteDraft.trim() || null, {
      onSuccess: () => setNotesOpen(false),
      onError: (error) => Alert.alert('Save failed', error.message),
    });
  };

  const settingsSummary =
    machineSettings?.height || machineSettings?.width
      ? [machineSettings.height && `h ${machineSettings.height}`, machineSettings.width && `w ${machineSettings.width}`]
          .filter(Boolean)
          .join(' · ')
      : 'settings';

  type SetOutcome = 'miss' | 'regression' | 'belowTarget' | 'improvement' | 'none';

  const getOutcome = (set: LoggedSet): SetOutcome => {
    if (set.is_miss) return 'miss';
    if (set.weight == null || set.reps == null) return 'none';

    const setKg = toKg(set.weight, set.weight_unit);

    if (previousTopSet) {
      const belowPreviousWeight = previousTopKg != null && setKg < previousTopKg;
      const belowPreviousReps = set.reps < previousTopSet.reps;
      if (belowPreviousWeight || belowPreviousReps) return 'regression';
    }

    if (set.reps < targetReps) return 'belowTarget';

    if (previousTopSet) {
      const abovePreviousWeight = previousTopKg != null && setKg > previousTopKg;
      const abovePreviousReps = set.reps > previousTopSet.reps;
      if (abovePreviousWeight || abovePreviousReps) return 'improvement';
    }

    return 'none';
  };

  const onUndo = (set: LoggedSet) => {
    Alert.alert('Undo set', `Remove ${set.weight} ${set.weight_unit} × ${set.reps}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: () => deleteSet.mutate(set) },
    ]);
  };

  const isSwapped = !!phaseExercise.original_exercise_name;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name={isSwapped ? 'swap-horizontal' : 'infinite-outline'}
          size={20}
          color={isSwapped ? workoutTheme.warning : workoutTheme.accent}
        />
        <Text style={[styles.exerciseName, isSwapped && styles.exerciseNameSwapped]}>
          {phaseExercise.exercise_name}
        </Text>
        <Pressable onPress={onInfo} hitSlop={8}>
          <Ionicons name="information-circle-outline" size={18} color={workoutTheme.textMuted} />
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {phaseExercise.working_sets ?? '?'}×{phaseExercise.reps_range ?? '?'}
          </Text>
        </View>
        {phaseExercise.last_set_intensity_technique && (
          <View style={[styles.badge, styles.intensityBadge]}>
            <Text style={[styles.badgeText, styles.intensityBadgeText]}>
              {phaseExercise.last_set_intensity_technique}
            </Text>
          </View>
        )}
        {equipment && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{equipment}</Text>
          </View>
        )}
        {!previousTopSet && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>first time</Text>
          </View>
        )}
        {isSwapped && (
          <View style={[styles.badge, styles.intensityBadge]}>
            <Ionicons name="swap-horizontal" size={11} color={workoutTheme.warning} />
            <Text style={[styles.badgeText, styles.intensityBadgeText]}>
              swapped from {phaseExercise.original_exercise_name}
            </Text>
          </View>
        )}
        {overloadDirection !== 'none' && <OverloadIndicator direction={overloadDirection} />}
      </View>

      {previousTopSet && (
        <Text style={styles.lastTime}>
          Last time: {previousTopSet.weight} {previousTopSet.weight_unit} × {previousTopSet.reps}
        </Text>
      )}
      {newRecordBanner && <Text style={styles.recordBanner}>New 1RM!</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
        style={styles.actionsScroll}
      >
        <Pressable style={styles.actionPill} onPress={onSwap}>
          <Ionicons name="swap-horizontal-outline" size={14} color={workoutTheme.accent} />
          <Text style={styles.actionPillText}>swap</Text>
        </Pressable>
        <Pressable
          style={styles.actionPill}
          onPress={() =>
            router.push({
              pathname: '/workout/exercise/[exerciseName]',
              params: { exerciseName: phaseExercise.exercise_name },
            })
          }
        >
          <Ionicons name="trending-up-outline" size={14} color={workoutTheme.accent} />
          <Text style={styles.actionPillText}>history</Text>
        </Pressable>
        <Pressable style={styles.actionPill} onPress={onTune}>
          <Ionicons name="options-outline" size={14} color={workoutTheme.accent} />
          <Text style={styles.actionPillText}>tune</Text>
        </Pressable>
        <Pressable
          style={[styles.actionPill, exerciseNote?.notes && styles.actionPillNoted]}
          onPress={onOpenNotes}
        >
          <Ionicons
            name="document-text-outline"
            size={14}
            color={exerciseNote?.notes ? workoutTheme.warning : workoutTheme.accent}
          />
          <Text style={[styles.actionPillText, exerciseNote?.notes && styles.actionPillTextNoted]}>note</Text>
        </Pressable>
        {equipment && (
          <Pressable style={styles.actionPill} onPress={onOpenSettings}>
            <Ionicons name="settings-outline" size={14} color={workoutTheme.accent} />
            <Text style={styles.actionPillText}>{settingsSummary}</Text>
          </Pressable>
        )}
      </ScrollView>

      {settingsOpen && (
        <View style={styles.settingsRow}>
          <View style={styles.settingsField}>
            <Text style={styles.settingsLabel}>height</Text>
            <TextInput
              style={styles.settingsInput}
              value={heightDraft}
              onChangeText={setHeightDraft}
              placeholder="e.g. 5"
              placeholderTextColor={workoutTheme.textMuted}
            />
          </View>
          {equipment === 'cable' && (
            <View style={styles.settingsField}>
              <Text style={styles.settingsLabel}>width</Text>
              <TextInput
                style={styles.settingsInput}
                value={widthDraft}
                onChangeText={setWidthDraft}
                placeholder="e.g. 3"
                placeholderTextColor={workoutTheme.textMuted}
              />
            </View>
          )}
          <Pressable onPress={onSaveSettings} disabled={saveMachineSettings.isPending} hitSlop={8}>
            <Text style={styles.settingsSave}>save</Text>
          </Pressable>
          <Pressable onPress={() => setSettingsOpen(false)} hitSlop={8}>
            <Ionicons name="close" size={16} color={workoutTheme.textMuted} />
          </Pressable>
        </View>
      )}

      {notesOpen && (
        <View style={styles.notesRow}>
          <TextInput
            style={styles.notesInput}
            value={noteDraft}
            onChangeText={setNoteDraft}
            placeholder="e.g. keep elbows tucked, watch the shoulder"
            placeholderTextColor={workoutTheme.textMuted}
            multiline
            autoFocus
          />
          <View style={styles.notesActions}>
            <Pressable onPress={() => setNotesOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={16} color={workoutTheme.textMuted} />
            </Pressable>
            <Pressable onPress={onSaveNote} disabled={saveExerciseNote.isPending} hitSlop={8}>
              <Text style={styles.settingsSave}>save</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.sets}>
        {loggedSets.map((set) => {
          const outcome = getOutcome(set);
          const outcomeColor =
            outcome === 'miss' || outcome === 'regression'
              ? workoutTheme.danger
              : outcome === 'belowTarget'
                ? workoutTheme.warning
                : workoutTheme.accent;
          return (
            <View
              key={set.id}
              style={[
                styles.setRow,
                styles.setRowDone,
                { borderColor: set.is_miss ? workoutTheme.danger : workoutTheme.accent },
              ]}
            >
              <Text style={styles.setIndexDone}>{toRoman(set.set_number)}</Text>
              <Text style={styles.setValuesDone}>
                {set.weight} {set.weight_unit} × {set.reps}
              </Text>
              <Pressable onPress={() => onUndo(set)} hitSlop={8} disabled={deleteSet.isPending}>
                <Ionicons
                  name={set.is_miss ? 'close-circle' : 'checkmark-circle'}
                  size={18}
                  color={outcomeColor}
                />
              </Pressable>
            </View>
          );
        })}

        {pendingSetNumbers.map((setNumber) => {
          const draft = getDraft(setNumber);
          return (
            <SwipeableSetRow
              key={setNumber}
              style={styles.setRow}
              onSwipeComplete={() => onLog(setNumber, 'hit')}
              onSwipeMiss={() => onLog(setNumber, 'miss')}
            >
              <Text style={styles.setIndex}>{toRoman(setNumber)}</Text>
              <View style={styles.setValues}>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={draft.weight}
                  onChangeText={(v) => updateDraft(setNumber, { weight: v })}
                  placeholder="0"
                  placeholderTextColor={workoutTheme.textMuted}
                />
                <Text style={styles.unitText}>{weightUnit}</Text>
                <Text style={styles.timesText}>×</Text>
                <TextInput
                  style={styles.repsInput}
                  keyboardType="numeric"
                  value={draft.reps}
                  onChangeText={(v) => updateDraft(setNumber, { reps: v })}
                />
              </View>
              <View style={styles.setActions}>
                <Pressable onPress={() => onLog(setNumber, 'hit')} disabled={createSet.isPending}>
                  <Text style={styles.hitText}>hit it →</Text>
                </Pressable>
                <Pressable onPress={() => onLog(setNumber, 'miss')} disabled={createSet.isPending}>
                  <Text style={styles.missText}>miss</Text>
                </Pressable>
              </View>
            </SwipeableSetRow>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseName: {
    flex: 1,
    fontFamily: workoutTheme.fontSerif,
    fontSize: 24,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
  },
  exerciseNameSwapped: {
    color: workoutTheme.warning,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textSecondary,
  },
  intensityBadge: {
    borderColor: workoutTheme.warning,
  },
  intensityBadgeText: {
    color: workoutTheme.warning,
  },
  lastTime: {
    marginTop: spacing.sm,
    fontFamily: workoutTheme.fontMono,
    fontSize: 12,
    color: workoutTheme.textMuted,
  },
  recordBanner: { color: workoutTheme.accent, fontWeight: '700', marginTop: spacing.xs },
  actionsScroll: { marginTop: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: workoutTheme.accentMuted,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  actionPillText: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 13,
    color: workoutTheme.accent,
  },
  actionPillNoted: {
    borderColor: workoutTheme.warning,
  },
  actionPillTextNoted: {
    color: workoutTheme.warning,
  },
  notesRow: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesInput: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 15,
    color: workoutTheme.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 0,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingsField: { flex: 1 },
  settingsLabel: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
    marginBottom: 2,
  },
  settingsInput: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 16,
    color: workoutTheme.textPrimary,
    padding: 0,
  },
  settingsSave: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.accent,
  },
  sets: { marginTop: spacing.md, gap: spacing.sm },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: workoutTheme.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  setRowDone: {
    borderColor: workoutTheme.surfaceRaised,
    backgroundColor: workoutTheme.surface,
  },
  setIndex: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 16,
    color: workoutTheme.textMuted,
    width: 24,
  },
  setIndexDone: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 16,
    color: workoutTheme.textMuted,
    width: 24,
  },
  setValues: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  setValuesDone: {
    flex: 1,
    fontFamily: workoutTheme.fontSerif,
    fontSize: 18,
    fontWeight: '700',
    color: workoutTheme.textSecondary,
  },
  weightInput: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 20,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    minWidth: 40,
    padding: 0,
  },
  unitText: { fontSize: 13, color: workoutTheme.textMuted, fontStyle: 'italic' },
  timesText: { fontSize: 18, color: workoutTheme.textMuted },
  repsInput: {
    fontFamily: workoutTheme.fontSerif,
    fontSize: 20,
    fontWeight: '700',
    color: workoutTheme.textPrimary,
    minWidth: 28,
    padding: 0,
  },
  setActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hitText: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.accent,
  },
  missText: {
    fontFamily: workoutTheme.fontSerif,
    fontStyle: 'italic',
    fontSize: 14,
    color: workoutTheme.textMuted,
  },
});
