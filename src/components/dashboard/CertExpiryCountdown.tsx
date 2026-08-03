import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, Text, View } from 'react-native';
import { getCertExpiryDate } from '../../lib/certExpiry';
import { spacing, workoutTheme } from '../../lib/theme';

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${days}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Free Apple ID builds stop opening once their signing certificate expires
// (~7 days after build) — this counts down to that moment so it's never a
// surprise.
export function CertExpiryCountdown() {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);

  const expiresAt = getCertExpiryDate();
  const msRemaining = expiresAt.diff(now);
  const expired = msRemaining <= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {expired ? 'Certificate expired — reinstall via USB' : 'App certificate expires in'}
      </Text>
      {!expired && <Text style={styles.countdown}>{formatCountdown(msRemaining)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: spacing.lg },
  label: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: workoutTheme.textMuted,
    marginBottom: spacing.xs,
  },
  countdown: {
    fontFamily: workoutTheme.fontMono,
    fontSize: 20,
    fontWeight: '700',
    color: workoutTheme.accent,
  },
});
