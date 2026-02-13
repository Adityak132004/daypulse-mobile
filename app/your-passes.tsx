import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchUserBookings } from '@/lib/listings';
import { getMockAuthenticated } from '@/lib/mock-auth';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

type BookingWithListing = {
  id: string;
  pass_date: string;
  pass_count: number;
  status: string;
  listings: { id: string; title: string; location: string } | null;
};

function formatPassDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function YourPassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');

  const loadBookings = useCallback(async () => {
    if (getMockAuthenticated()) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const data = await fetchUserBookings(user.id);
    setBookings((data ?? []) as BookingWithListing[]);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText type="subtitle">Your passes</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  if (bookings.length === 0) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText type="subtitle">Your passes</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContent}>
          <MaterialIcons name="confirmation-number" size={64} color={secondaryTextColor} />
          <ThemedText type="title" style={styles.emptyTitle}>
            No passes yet
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Buy a day pass in Explore and it will appear here.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderPassCard = ({ item }: { item: BookingWithListing }) => {
    const gymName = item.listings?.title ?? 'Unknown gym';
    return (
      <View style={[styles.passCard, { borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.passCardTitle}>
          {gymName}
        </ThemedText>
        <ThemedText style={[styles.passCardDate, { color: secondaryTextColor }]}>
          {formatPassDate(item.pass_date)}
          {item.pass_count > 1 ? ` · ${item.pass_count} passes` : ''}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText type="subtitle">Your passes</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderPassCard}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  passCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  passCardTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  passCardDate: {
    fontSize: 14,
  },
});
