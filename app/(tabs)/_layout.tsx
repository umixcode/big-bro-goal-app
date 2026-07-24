import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/lib/theme';

const tabs = [
  { href: '/(tabs)', match: '/', label: 'Dashboard', icon: 'home' },
  { href: '/(tabs)/trackers', match: '/trackers', label: 'Trackers', icon: 'stats-chart' },
  { href: '/(tabs)/workout', match: '/workout', label: 'Workout', icon: 'barbell' },
  { href: '/(tabs)/calendar', match: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/(tabs)/mentor', match: '/mentor', label: 'Mentor', icon: 'sparkles' },
] as const;

function TopTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.xs }]}>
      {tabs.map((tab) => {
        const isActive = tab.match === '/' ? pathname === '/' : pathname.startsWith(tab.match);
        const tint = isActive ? colors.accent : colors.textMuted;
        return (
          <Pressable key={tab.href} style={styles.item} onPress={() => router.push(tab.href)}>
            <Ionicons name={tab.icon} size={20} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <TopTabBar />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="trackers" />
          <Tabs.Screen name="workout" />
          <Tabs.Screen name="calendar" />
          <Tabs.Screen name="mentor" />
          <Tabs.Screen name="brain" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});
