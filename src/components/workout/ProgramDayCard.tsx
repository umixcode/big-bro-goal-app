import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../lib/theme';

interface ProgramDayCardProps {
  dayName: string;
  exerciseCount: number;
  onPress: () => void;
}

export function ProgramDayCard({ dayName, exerciseCount, onPress }: ProgramDayCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={typography.heading}>{dayName}</Text>
          <Text style={typography.caption}>{exerciseCount} exercises</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
