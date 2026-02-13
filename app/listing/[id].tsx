import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListings } from '@/contexts/ListingsContext';
import { useThemeColor } from '@/hooks/use-theme-color';

const AIRBNB_RED = '#FF5A5F';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getListingById } = useListings();
  const listing = id ? getListingById(id) : undefined;

  const imageUrls =
    listing?.imageUrls?.length
      ? listing.imageUrls
      : listing?.imageUrl
        ? [listing.imageUrl]
        : ['https://picsum.photos/seed/placeholder/400/300'];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / width);
      setActiveImageIndex(Math.min(index, imageUrls.length - 1));
    },
    [width, imageUrls.length]
  );

  const iconColor = useThemeColor({}, 'icon');
  const reserveBarBg = useThemeColor(
    { light: 'rgba(255,255,255,0.98)', dark: 'rgba(21,23,24,0.98)' },
    'background',
  );
  const reserveBarBorder = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.08)' },
    'background',
  );

  if (!listing) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Listing not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={{ width }}>
                <Image
                  source={{ uri: item }}
                  style={[styles.image, { width, height: width * (3 / 4) }]}
                  contentFit="cover"
                />
              </View>
            )}
          />
          {imageUrls.length > 1 && (
            <View style={styles.pagination}>
              {imageUrls.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, { paddingBottom: 24 }]}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title}>
              {listing.title}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={18} color={iconColor} />
              <ThemedText style={styles.location}>{listing.location}</ThemedText>
            </View>
            <View style={styles.distanceRow}>
              <MaterialIcons name="near-me" size={18} color={iconColor} />
              <ThemedText style={styles.distance}>
                {listing.distanceFromMe} mi away
              </ThemedText>
            </View>
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={18} color={iconColor} />
              <ThemedText type="defaultSemiBold">
                {listing.rating} · {listing.reviewCount} reviews
              </ThemedText>
            </View>
          </View>

          <View style={styles.priceRow}>
            <ThemedText type="defaultSemiBold" style={styles.price}>
              ${listing.price}
            </ThemedText>
            <ThemedText style={styles.priceUnit}> daily entry</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            About this gym
          </ThemedText>
          <ThemedText style={styles.description}>
            {listing.description ?? 'No description available.'}
          </ThemedText>

          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Amenities
              </ThemedText>
              <View style={styles.amenitiesList}>
                {listing.amenities.map((a) => (
                  <View key={a} style={styles.amenityRow}>
                    <MaterialIcons name="check-circle" size={18} color={iconColor} />
                    <ThemedText style={styles.amenityText}>{a}</ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Reserve bar - inside ScrollView */}
        <View style={styles.reserveBarSpacer} />
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.reserveBar,
            {
              backgroundColor: reserveBarBg,
              borderTopColor: reserveBarBorder,
              marginHorizontal: 24,
              marginBottom: insets.bottom + 16,
            },
          ]}
          onPress={() => router.push(`/confirm-pay?id=${listing.id}`)}>
          <View style={styles.reserveRow}>
            <View>
              <ThemedText type="defaultSemiBold" style={styles.reservePrice}>
                ${listing.price}
              </ThemedText>
              <ThemedText style={styles.reserveUnit}> daily entry</ThemedText>
            </View>
            <View style={styles.reserveButton}>
              <ThemedText style={styles.reserveButtonText}>Get day pass</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
      {/* Fixed back button - stays visible when scrolling */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.replace('/(tabs)/explore')}
          style={styles.backButton}
          hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
  },
  image: {
    width: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 16,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  price: {
    fontSize: 22,
  },
  priceUnit: {
    fontSize: 16,
    opacity: 0.8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  amenitiesList: {
    marginBottom: 24,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 16,
  },
  reserveBarSpacer: {
    flex: 1,
    minHeight: 24,
  },
  reserveBar: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  reserveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reservePrice: {
    fontSize: 18,
  },
  reserveUnit: {
    fontSize: 14,
    opacity: 0.8,
  },
  reserveButton: {
    backgroundColor: AIRBNB_RED,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});