import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/lib/theme';

// NativeTabs (used in _layout.tsx) renders the real native OS tab bar, which
// has no web implementation at all — it crashes trying to rasterize icons
// via expo-font's native-only renderToImageAsync. Expo Router picks this
// file over _layout.tsx automatically when bundling for web, so mobile is
// unaffected; this uses the regular JS tab navigator instead.
const tabs = [
  { name: 'index', label: 'Dashboard', icon: 'home' },
  { name: 'trackers', label: 'Trackers', icon: 'stats-chart' },
  { name: 'workout', label: 'Workout', icon: 'barbell' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar' },
  { name: 'mentor', label: 'Mentor', icon: 'sparkles' },
] as const;

export default function TabsLayoutWeb() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
      <Tabs.Screen name="brain" options={{ href: null }} />
    </Tabs>
  );
}
