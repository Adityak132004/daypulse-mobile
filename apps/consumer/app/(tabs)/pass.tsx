import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchUserBookings } from '@/lib/listings';
import { getMockAuthenticated } from '@/lib/mock-auth';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

const PLACEHOLDER_QR_VALUE = 'daypulse:ready';

type BookingWithListing = {
  id: string;
  pass_date: string;
  pass_count: number;
  listings: { id: string; title: string } | null;
};

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getActivePasses(bookings: BookingWithListing[]): BookingWithListing[] {
  const today = toLocalDateStr(new Date());
  return bookings.filter((b) => b.pass_date >= today);
}

function encodePasses(passes: BookingWithListing[]): string {
  const payload = passes.map((p) => ({
    bookingId: p.id,
    listingId: p.listings?.id ?? '',
    passDate: p.pass_date,
  }));
  return JSON.stringify({ passes: payload });
}

export default function PassScreen() {
  const insets = useSafeAreaInsets();
  const [todaysPasses, setTodaysPasses] = useState<BookingWithListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  const loadPass = useCallback(async () => {
    if (getMockAuthenticated()) {
      setTodaysPasses([]);
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTodaysPasses([]);
      setIsLoading(false);
      return;
    }

    const data = await fetchUserBookings(user.id);
    const typed = (data ?? []) as BookingWithListing[];
    const passes = getActivePasses(typed);
    setTodaysPasses(passes);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPass();
    }, [loadPass])
  );

  const qrValue = useMemo(() => {
    if (todaysPasses.length > 0) {
      return encodePasses(todaysPasses);
    }
    return PLACEHOLDER_QR_VALUE;
  }, [todaysPasses]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.qrContainer}>
          <QRCode
            key={qrValue}
            value={qrValue}
            size={220}
            backgroundColor="white"
            color="black"
          />
        </View>
        <ThemedText style={styles.hint}>
          {todaysPasses.length > 0
            ? todaysPasses.length === 1
              ? `Show this at ${todaysPasses[0].listings?.title ?? 'the gym'}`
              : `Valid at ${todaysPasses.map((p) => p.listings?.title ?? 'gym').join(', ')}`
            : 'Buy a day pass to show your QR code at the gym'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  qrContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 24,
    textAlign: 'center',
  },
});
