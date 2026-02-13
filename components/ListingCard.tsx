import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Listing } from '@/data/listings';
import { useThemeColor } from '@/hooks/use-theme-color';

type ListingCardProps = {
  listing: Listing;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
};

/**
 * Reusable card component for displaying a single gym listing.
 * Shows image, favorite button, title, location, daily price, stars, and reviews.
 */
export function ListingCard({
  listing,
  onPress,
  onFavoritePress,
  isFavorite = false,
}: ListingCardProps) {
  const iconColor = useThemeColor({}, 'icon');
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ThemedView style={styles.imageContainer}>
        <Image
          source={{ uri: listing.imageUrls?.[0] ?? listing.imageUrl ?? '' }}
          style={styles.image}
          contentFit="cover"
        />
        <Pressable
          onPress={onFavoritePress}
          style={styles.favoriteButton}
          hitSlop={8}>
          <MaterialIcons
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={24}
            color={isFavorite ? '#FF385C' : '#fff'}
          />
        </Pressable>
      </ThemedView>
      <View style={styles.info}>
        <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
          {listing.title}
        </ThemedText>
        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={14} color={iconColor} />
          <ThemedText style={styles.location} numberOfLines={1}>
            {listing.location}
          </ThemedText>
        </View>
        <View style={styles.distanceRow}>
          <MaterialIcons name="near-me" size={14} color={iconColor} />
          <ThemedText style={styles.distanceText}>
            {(listing.distanceFromMe ?? 0)} mi away
          </ThemedText>
        </View>
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={14} color={iconColor} />
            <ThemedText type="defaultSemiBold" style={styles.rating}>
              {listing.rating}
            </ThemedText>
            <ThemedText style={styles.reviewCount}>
              ({listing.reviewCount})
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={styles.price}>
            ${listing.price}
            <ThemedText style={styles.priceUnit}> / day</ThemedText>
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  info: {
    paddingTop: 8,
  },
  title: {
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 14,
  },
  reviewCount: {
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 2,
  },
  price: {
    fontSize: 14,
  },
  priceUnit: {
    fontWeight: '400',
    opacity: 0.8,
  },
});
