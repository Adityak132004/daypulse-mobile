import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/ListingCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  LISTING_CATEGORIES,
  type Listing,
  type ListingCategory,
} from '@/data/listings';
import { useListings } from '@/contexts/ListingsContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SortOption =
  | 'distance'
  | 'price-low'
  | 'price-high'
  | 'rating';

function sortListings(listings: Listing[], sortBy: SortOption): Listing[] {
  const sorted = [...listings];
  switch (sortBy) {
    case 'distance':
      return sorted.sort((a, b) => (a.distanceFromMe ?? 0) - (b.distanceFromMe ?? 0));
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
}

function filterListings(
  listings: Listing[],
  searchQuery: string,
  category: ListingCategory,
  priceMin: number | null,
  priceMax: number | null,
  maxDistance: number | null
): Listing[] {
  const q = searchQuery.trim().toLowerCase();
  let filtered = listings;

  if (q) {
    filtered = filtered.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
    );
  }

  if (category !== 'All') {
    filtered = filtered.filter(
      (l) => (l.category ?? 'Boutique') === category
    );
  }

  if (priceMin != null && !Number.isNaN(priceMin)) {
    filtered = filtered.filter((l) => l.price >= priceMin);
  }
  if (priceMax != null && !Number.isNaN(priceMax)) {
    filtered = filtered.filter((l) => l.price <= priceMax);
  }
  if (maxDistance != null && !Number.isNaN(maxDistance)) {
    filtered = filtered.filter(
      (l) => (l.distanceFromMe ?? 0) <= maxDistance
    );
  }

  return filtered;
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { listings, refreshListings } = useListings();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory>('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor(
    { light: '#E0E0E0', dark: '#3A3A3C' },
    'background',
  );
  const optionActiveBg = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.12)' },
    'background',
  );
  const secondaryTextColor = useThemeColor(
    { light: '#717171', dark: '#A1A1A1' },
    'text',
  );
  const textColor = useThemeColor({}, 'text');
  const modalBg = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');

  const filteredListings = useMemo(() => {
    const filtered = filterListings(
      listings,
      searchQuery,
      selectedCategory,
      priceMin ? parseFloat(priceMin) : null,
      priceMax ? parseFloat(priceMax) : null,
      maxDistance ? parseFloat(maxDistance) : null
    );
    return sortListings(filtered, sortBy);
  }, [listings, searchQuery, selectedCategory, priceMin, priceMax, maxDistance, sortBy]);

  const cardWidth = (width - 48) / 2;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshListings();
    setRefreshing(false);
  }, [refreshListings]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setPriceMin('');
    setPriceMax('');
    setMaxDistance('');
    setFilterModalVisible(false);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header: search bar + filter */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { borderColor }]}>
          <View style={styles.searchBarContent}>
            <MaterialIcons name="search" size={20} color={iconColor} />
            <View style={styles.searchBarText}>
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Find a gym..."
                placeholderTextColor={secondaryTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ThemedText
                style={[styles.searchSecondary, { color: secondaryTextColor }]}
                numberOfLines={1}>
                Search by name or location
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}>
            <MaterialIcons name="tune" size={22} color={iconColor} />
          </Pressable>
        </View>
      </View>

      {/* Sort options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
        style={styles.sortScroll}>
        {[
          { key: 'distance' as const, label: 'Distance' },
          { key: 'price-low' as const, label: 'Price: Low to high' },
          { key: 'price-high' as const, label: 'Price: High to low' },
          { key: 'rating' as const, label: 'Highest rating' },
        ].map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setSortBy(opt.key)}
            style={[
              styles.sortChip,
              { borderColor },
              sortBy === opt.key && { backgroundColor: optionActiveBg },
            ]}>
            <ThemedText
              type={sortBy === opt.key ? 'defaultSemiBold' : 'default'}
              style={styles.sortChipText}>
              {opt.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Listings grid */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <ListingCard
              listing={item}
              isFavorite={favorites.has(item.id)}
              onPress={() =>
                router.replace({ pathname: '/listing/[id]', params: { id: item.id } })
              }
              onFavoritePress={() => toggleFavorite(item.id)}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
              No listings match your search.
            </ThemedText>
          </View>
        }
      />

      {/* Filter modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: modalBg }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Filters
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
              Category
            </ThemedText>
            <View style={styles.categoryOptions}>
              {LISTING_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryOption,
                    selectedCategory === cat && { backgroundColor: optionActiveBg },
                  ]}>
                  <ThemedText
                    type={selectedCategory === cat ? 'defaultSemiBold' : 'default'}>
                    {cat}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
              Price range ($)
            </ThemedText>
            <View style={styles.filterRow}>
              <TextInput
                style={[styles.filterInput, { color: textColor, borderColor }]}
                placeholder="Min"
                placeholderTextColor={secondaryTextColor}
                value={priceMin}
                onChangeText={setPriceMin}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.filterInput, { color: textColor, borderColor }]}
                placeholder="Max"
                placeholderTextColor={secondaryTextColor}
                value={priceMax}
                onChangeText={setPriceMax}
                keyboardType="numeric"
              />
            </View>

            <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
              Distance from me (mi)
            </ThemedText>
            <TextInput
              style={[styles.filterInput, { color: textColor, borderColor }]}
              placeholder="Max distance (mi)"
              placeholderTextColor={secondaryTextColor}
              value={maxDistance}
              onChangeText={setMaxDistance}
              keyboardType="numeric"
            />

            <Pressable style={styles.clearButton} onPress={handleClearFilters}>
              <ThemedText type="defaultSemiBold">Clear filters</ThemedText>
            </Pressable>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}>
              <ThemedText>Close</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
  },
  searchBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  searchBarText: {
    flex: 1,
  },
  searchInput: {
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
    margin: 0,
  },
  searchSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
  filterButton: {
    padding: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 20,
  },
  sortScroll: {
    marginBottom: 8,
  },
  sortRow: {
    paddingHorizontal: 24,
    gap: 8,
    paddingRight: 24,
  },
  sortChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
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
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
});
