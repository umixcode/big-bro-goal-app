import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/lib/theme';

const tabs = [
  { name: 'index', label: 'Dashboard', icon: 'home' },
  { name: 'trackers', label: 'Trackers', icon: 'stats-chart' },
  { name: 'workout', label: 'Workout', icon: 'barbell' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar' },
  { name: 'mentor', label: 'Mentor', icon: 'sparkles' },
] as const;

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.accent} iconColor={{ default: colors.textMuted, selected: colors.accent }}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name={tab.icon} />} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
      <NativeTabs.Trigger name="brain" hidden />
    </NativeTabs>
  );
}
