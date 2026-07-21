import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../src/hooks/useProfile';
import { Card } from '../../src/components/ui/Card';
import { supabase } from '../../src/api/supabaseClient';
import { colors, spacing, typography } from '../../src/lib/theme';

const dashboardLinks = [
  { href: '/(tabs)/trackers', icon: 'moon', label: 'Sleep, Food, Water & Weight' },
  { href: '/(tabs)/workout', icon: 'barbell', label: 'Workout' },
  { href: '/(tabs)/calendar', icon: 'calendar', label: 'Calendar & Planner' },
  { href: '/(tabs)/brain', icon: 'book', label: 'Brain Tracker' },
  { href: '/(tabs)/mentor', icon: 'sparkles', label: 'AI Mentor' },
] as const;

export default function DashboardScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.title}>
        {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Welcome back'}
      </Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg }]}>Let's level up today.</Text>

      {dashboardLinks.map((link) => (
        <Card key={link.href} onPress={() => router.push(link.href)} style={{ marginBottom: spacing.sm }}>
          <View style={styles.row}>
            <Ionicons name={link.icon as any} size={22} color={colors.accent} />
            <Text style={[typography.body, { marginLeft: spacing.sm }]}>{link.label}</Text>
          </View>
        </Card>
      ))}

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={{ color: colors.danger }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOut: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    padding: spacing.md,
  },
});
