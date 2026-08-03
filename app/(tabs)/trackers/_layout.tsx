import { Stack } from 'expo-router';
import { colors } from '../../../src/lib/theme';

export default function TrackersLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
