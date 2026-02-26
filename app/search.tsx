import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AIRBNB_RED = '#FF5A5F';

const SUGGESTED = [
  { id: 'nearby', label: 'Nearby', sublabel: 'Find gyms around you', value: 'Nearby' },
  { id: 'ny', label: 'New York', sublabel: 'Gyms in New York', value: 'New York' },
  { id: 'sf', label: 'San Francisco', sublabel: 'Gyms in San Francisco', value: 'San Francisco' },
  { id: 'la', label: 'Los Angeles', sublabel: 'Gyms in Los Angeles', value: 'Los Angeles' },
];

const AMENITY_OPTIONS = [
  'Free weights',
  'Cardio machines',
  'Pool',
  'Showers',
  'Locker rooms',
  '24/7 access',
  'Yoga',
  'Personal training',
  'Sauna',
  'Parking',
];

const PRICE_DEFAULT_MIN = '5';
const PRICE_DEFAULT_MAX = '30';

type ExpandedTab = 'where' | 'amenities' | 'prices' | null;

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialQuery?: string }>();
  const [query, setQuery] = useState(params.initialQuery ?? '');
  const [expanded, setExpanded] = useState<ExpandedTab>('where');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(PRICE_DEFAULT_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_DEFAULT_MAX);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');
  const chipBg = useThemeColor({ light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.1)' }, 'background');

  const toggleExpand = (tab: ExpandedTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => (prev === tab ? null : tab));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSearch = () => {
    const min = priceMin.trim();
    const max = priceMax.trim();
    const locationQuery = query.trim();
    const searchParams: Record<string, string> = {
      q: locationQuery,
    };
    if (min) searchParams.priceMin = min;
    if (max) searchParams.priceMax = max;
    if (selectedAmenities.length > 0) searchParams.amenities = selectedAmenities.join(',');
    router.replace({
      pathname: '/(tabs)/explore',
      params: searchParams,
    });
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedAmenities([]);
    setPriceMin(PRICE_DEFAULT_MIN);
    setPriceMax(PRICE_DEFAULT_MAX);
  };

  const handleSuggestion = (value: string) => {
    setQuery(value);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded('amenities');
  };

  const handleAmenitiesNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded('prices');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Search
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={12}>
          <MaterialIcons name="close" size={28} color={iconColor} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Where */}
          <Pressable style={[styles.tabRow, { borderBottomColor: borderColor }]} onPress={() => toggleExpand('where')}>
            <ThemedText type="defaultSemiBold" style={styles.tabLabel}>
              Where or which gym?
            </ThemedText>
            <MaterialIcons
              name={expanded === 'where' ? 'expand-less' : 'expand-more'}
              size={24}
              color={iconColor}
            />
          </Pressable>
          {expanded === 'where' && (
            <View style={styles.tabContent}>
              <View style={[styles.searchInputRow, { borderColor }]}>
                <MaterialIcons name="search" size={22} color={iconColor} />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="City, area, or gym name"
                  placeholderTextColor={secondaryTextColor}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.subsectionTitle}>
                Suggested
              </ThemedText>
              {SUGGESTED.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.suggestionRow}
                  onPress={() => handleSuggestion(item.value)}>
                  <View style={[styles.suggestionIcon, { backgroundColor: chipBg }]}>
                    <MaterialIcons
                      name={item.value ? 'location-on' : 'near-me'}
                      size={22}
                      color={iconColor}
                    />
                  </View>
                  <View style={styles.suggestionText}>
                    <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
                    <ThemedText style={[styles.suggestionSublabel, { color: secondaryTextColor }]}>
                      {item.sublabel}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Amenities */}
          <Pressable style={[styles.tabRow, { borderBottomColor: borderColor }]} onPress={() => toggleExpand('amenities')}>
            <ThemedText type="defaultSemiBold" style={styles.tabLabel}>
              Amenities
            </ThemedText>
            <MaterialIcons
              name={expanded === 'amenities' ? 'expand-less' : 'expand-more'}
              size={24}
              color={iconColor}
            />
          </Pressable>
          {expanded === 'amenities' && (
            <View style={styles.tabContent}>
              {AMENITY_OPTIONS.map((a) => {
                const checked = selectedAmenities.includes(a);
                return (
                  <Pressable
                    key={a}
                    style={styles.amenityRow}
                    onPress={() => toggleAmenity(a)}>
                    <MaterialIcons
                      name={checked ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={checked ? AIRBNB_RED : iconColor}
                    />
                    <ThemedText style={styles.amenityLabel}>{a}</ThemedText>
                  </Pressable>
                );
              })}
              <Pressable style={styles.nextButton} onPress={handleAmenitiesNext}>
                <ThemedText style={styles.nextButtonText}>Next</ThemedText>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Prices */}
          <Pressable style={[styles.tabRow, { borderBottomColor: borderColor }]} onPress={() => toggleExpand('prices')}>
            <ThemedText type="defaultSemiBold" style={styles.tabLabel}>
              Prices
            </ThemedText>
            <MaterialIcons
              name={expanded === 'prices' ? 'expand-less' : 'expand-more'}
              size={24}
              color={iconColor}
            />
          </Pressable>
          {expanded === 'prices' && (
            <View style={styles.tabContent}>
              <ThemedText style={[styles.sliderLabel, { color: secondaryTextColor }]}>
                Daily entry price ($)
              </ThemedText>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.priceInput, { color: textColor, borderColor }]}
                  placeholder="Min"
                  placeholderTextColor={secondaryTextColor}
                  value={priceMin}
                  onChangeText={setPriceMin}
                  keyboardType="numeric"
                />
                <ThemedText style={[styles.priceSeparator, { color: secondaryTextColor }]}>to</ThemedText>
                <TextInput
                  style={[styles.priceInput, { color: textColor, borderColor }]}
                  placeholder="Max"
                  placeholderTextColor={secondaryTextColor}
                  value={priceMax}
                  onChangeText={setPriceMax}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleClearAll} style={styles.clearButton}>
          <ThemedText style={styles.clearText}>Clear all</ThemedText>
        </Pressable>
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <MaterialIcons name="search" size={20} color="#fff" />
          <ThemedText style={styles.searchButtonText}>Search</ThemedText>
        </Pressable>
      </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tabLabel: {
    fontSize: 18,
  },
  tabContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionSublabel: {
    fontSize: 14,
    marginTop: 2,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  amenityLabel: {
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AIRBNB_RED,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  priceSeparator: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  clearButton: {
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AIRBNB_RED,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
