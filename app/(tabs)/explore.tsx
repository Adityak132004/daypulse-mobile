import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/ListingCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DUMMY_LISTINGS } from '@/data/listings';
import { useThemeColor } from '@/hooks/use-theme-color';

const FILTER_TABS = ['Stays', 'Experiences', 'Cars'] as const;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('Stays');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor(
    { light: '#E0E0E0', dark: '#3A3A3C' },
    'background',
  );
  const tabActiveBg = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.12)' },
    'background',
  );

  const cardWidth = (width - 48) / 2;

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Explore</ThemedText>
          <ThemedText style={styles.subtitle}>Find your next stay</ThemedText>
        </View>
      </View>

      {/* Search bar */}
      <Pressable style={[styles.searchBar, { borderColor }]}>
        <MaterialIcons name="search" size={24} color={iconColor} />
        <ThemedText style={styles.searchPlaceholder}>
          Where to? · Any week · Add guests
        </ThemedText>
      </Pressable>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: tabActiveBg },
            ]}>
            <ThemedText
              type={activeTab === tab ? 'defaultSemiBold' : 'default'}
              style={activeTab === tab ? styles.tabTextActive : styles.tabText}>
              {tab}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Listings grid */}
      <FlatList
        data={DUMMY_LISTINGS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <ListingCard
              listing={item}
              isFavorite={favorites.has(item.id)}
              onFavoritePress={() => toggleFavorite(item.id)}
            />
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchPlaceholder: {
    fontSize: 16,
    opacity: 0.7,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    fontSize: 14,
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
});
