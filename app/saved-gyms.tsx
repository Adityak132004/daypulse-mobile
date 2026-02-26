import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/ListingCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListings } from '@/contexts/ListingsContext';
import { useSavedGyms } from '@/contexts/SavedGymsContext';
import { getMockAuthenticated } from '@/lib/mock-auth';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SavedGymsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getListingById } = useListings();
  const { savedIds, isLoading, refreshSaved, toggleSaved, isSaved } = useSavedGyms();
  const [userChecked, setUserChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');
  const iconColor = useThemeColor({}, 'icon');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (getMockAuthenticated()) {
          if (!cancelled) setSignedIn(true);
          if (!cancelled) setUserChecked(true);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) setSignedIn(!!user);
        if (!cancelled) setUserChecked(true);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const savedListings = useMemo(() => {
    const list: { id: string }[] = Array.from(savedIds).map((id) => ({ id }));
    return list
      .map(({ id }) => getListingById(id))
      .filter((l): l is NonNullable<typeof l> => l != null);
  }, [savedIds, getListingById]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSaved();
    setRefreshing(false);
  }, [refreshSaved]);

  const cardWidth = (width - 48) / 2;

  if (!userChecked) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
            Loading…
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!signedIn) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={iconColor} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Saved gyms
          </ThemedText>
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="favorite-border" size={48} color={secondaryTextColor} />
          <ThemedText style={[styles.emptyText, { color: secondaryTextColor, marginTop: 16 }]}>
            Sign in to save gyms and see them here.
          </ThemedText>
          <Pressable
            style={[styles.signInButton, { marginTop: 24 }]}
            onPress={() => router.replace('/login')}>
            <ThemedText type="defaultSemiBold" style={styles.signInButtonText}>
              Sign in
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={iconColor} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Saved gyms
        </ThemedText>
      </View>

      <FlatList
        data={savedListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <ListingCard
              listing={item}
              isFavorite={isSaved(item.id)}
              onPress={() =>
                router.push({ pathname: '/listing/[id]', params: { id: item.id } })
              }
              onFavoritePress={() => toggleSaved(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <MaterialIcons name="favorite-border" size={48} color={secondaryTextColor} />
            <ThemedText style={[styles.emptyText, { color: secondaryTextColor, marginTop: 16 }]}>
              No saved gyms yet. Tap the heart on a gym to save it.
            </ThemedText>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
  },
});
