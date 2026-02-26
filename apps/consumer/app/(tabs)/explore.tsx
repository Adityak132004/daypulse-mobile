import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useGlobalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/ListingCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  type Listing,
  type ListingCategory,
} from '@/data/listings';
import { useListings } from '@/contexts/ListingsContext';
import { useSavedGyms } from '@/contexts/SavedGymsContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserLocation } from '@/lib/location';

/** Default max distance (mi) when we have location and user isn't searching a specific place. */
const DEFAULT_MAX_DISTANCE_MI = 50;

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
  maxDistance: number | null,
  minRating: number | null,
  amenities: string[]
): Listing[] {
  const q = searchQuery.trim().toLowerCase();
  let filtered = listings;

  if (q && q !== 'nearby') {
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
  if (minRating != null && minRating > 0) {
    filtered = filtered.filter((l) => l.rating >= minRating);
  }
  if (amenities.length > 0) {
    filtered = filtered.filter((l) => {
      const listAmenities = (l.amenities ?? []).map((a) => a.toLowerCase());
      return amenities.every((a) =>
        listAmenities.some((la) => la.includes(a.toLowerCase()))
      );
    });
  }

  return filtered;
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { listings, refreshListings } = useListings();
  const { isSaved, toggleSaved } = useSavedGyms();
  const { location: userLocation } = useUserLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory>('All');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [searchAmenities, setSearchAmenities] = useState<string[]>([]);
  const params = useGlobalSearchParams<{
    q?: string;
    priceMin?: string;
    priceMax?: string;
    minRating?: string;
    amenities?: string;
  }>();

  // When returning from search screen (or URL has search params), apply them
  useFocusEffect(
    useCallback(() => {
      if (params.q !== undefined && params.q !== null) {
        setSearchQuery(typeof params.q === 'string' ? params.q : params.q[0] ?? '');
      }
      if (params.priceMin !== undefined && params.priceMin !== null) {
        setPriceMin(typeof params.priceMin === 'string' ? params.priceMin : params.priceMin[0] ?? '');
      }
      if (params.priceMax !== undefined && params.priceMax !== null) {
        setPriceMax(typeof params.priceMax === 'string' ? params.priceMax : params.priceMax[0] ?? '');
      }
      if (params.minRating !== undefined && params.minRating !== null) {
        const r = typeof params.minRating === 'string' ? params.minRating : params.minRating[0] ?? '0';
        setMinRating(parseFloat(r) || 0);
      }
      if (params.amenities !== undefined && params.amenities !== null) {
        const a = typeof params.amenities === 'string' ? params.amenities : params.amenities[0] ?? '';
        setSearchAmenities(a ? a.split(',').map((s) => s.trim()).filter(Boolean) : []);
      }
    }, [params.q, params.priceMin, params.priceMax, params.minRating, params.amenities])
  );

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

  // When user is searching a place (e.g. "San Francisco" for a trip), don't apply default
    // distance—show all matching gyms. When not searching and we have location, default to nearby.
    const hasSearch = searchQuery.trim().length > 0;
    const effectiveMaxDistance =
      hasSearch
        ? (maxDistance ? parseFloat(maxDistance) : null)
        : (maxDistance ? parseFloat(maxDistance) : (userLocation ? DEFAULT_MAX_DISTANCE_MI : null));

    const filteredListings = useMemo(() => {
      const filtered = filterListings(
        listings,
        searchQuery,
        selectedCategory,
        priceMin ? parseFloat(priceMin) : null,
        priceMax ? parseFloat(priceMax) : null,
        effectiveMaxDistance,
        minRating > 0 ? minRating : null,
        searchAmenities
      );
      return sortListings(filtered, sortBy);
    }, [listings, searchQuery, selectedCategory, priceMin, priceMax, effectiveMaxDistance, minRating, searchAmenities, sortBy]);

  const cardWidth = width - 48;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshListings();
    setRefreshing(false);
  }, [refreshListings]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header: search bar */}
      <View style={styles.header}>
        <Pressable
          style={[styles.searchBar, { borderColor }]}
          onPress={() =>
            router.push({
              pathname: '/search',
              params: { initialQuery: searchQuery },
            })
          }>
          <View style={styles.searchBarContent}>
            <MaterialIcons name="search" size={20} color={iconColor} />
            <View style={styles.searchBarText}>
              <ThemedText
                style={[styles.searchInput, { color: searchQuery ? textColor : secondaryTextColor }]}
                numberOfLines={1}>
                {searchQuery.trim().toLowerCase() === 'nearby'
                  ? 'Gyms nearby'
                  : searchQuery || 'Find a gym...'}
              </ThemedText>
              <ThemedText
                style={[styles.searchSecondary, { color: secondaryTextColor }]}
                numberOfLines={1}>
                Search by name or location
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Sort options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
        style={styles.sortScroll}>
        {[
          { key: 'distance' as const, label: 'Distance' },
          { key: 'price-low' as const, label: 'Price ↑' },
          { key: 'price-high' as const, label: 'Price ↓' },
          { key: 'rating' as const, label: 'Rating' },
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
              style={styles.sortChipText}
              includeFontPadding={false}>
              {opt.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Listings grid */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
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

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 4,
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
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  searchSecondary: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  sortScroll: {
    marginBottom: 8,
    minHeight: 48,
  },
  sortRow: {
    paddingHorizontal: 24,
    gap: 8,
    paddingRight: 24,
    alignItems: 'center',
    minHeight: 48,
  },
  sortChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  sortChipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  cardWrapper: {
    marginBottom: 24,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
