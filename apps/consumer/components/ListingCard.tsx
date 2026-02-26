import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Listing } from '@/data/listings';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getPlaceStatus } from '@/lib/hours';

type ListingCardProps = {
  listing: Listing;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
};

/**
 * Reusable card component for displaying a single gym listing.
 * Shows image, favorite button, title, distance, daily price, stars, and reviews.
 */
const MAX_TITLE_LENGTH = 50;

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
        <ThemedText
          type="defaultSemiBold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.title}>
          {listing.title.length > MAX_TITLE_LENGTH
            ? `${listing.title.slice(0, MAX_TITLE_LENGTH)}…`
            : listing.title}
        </ThemedText>
        {listing.hoursOfOperation ? (
          <View style={styles.statusRow}>
            <MaterialIcons name="schedule" size={14} color={iconColor} />
            {(() => {
              const status = getPlaceStatus(listing.hoursOfOperation);
              if (status?.isOpen === true) {
                return (
                  <ThemedText numberOfLines={1} style={styles.statusLine}>
                    <ThemedText style={styles.statusOpen}>Open</ThemedText>
                    <ThemedText style={styles.statusPipe}> | Closes {status.closesAt}</ThemedText>
                  </ThemedText>
                );
              }
              if (status?.isOpen === false) {
                return (
                  <ThemedText numberOfLines={1} style={styles.statusLine}>
                    <ThemedText style={styles.statusClosed}>Closed</ThemedText>
                    <ThemedText style={styles.statusPipe}> | Opens {status.opensAt}</ThemedText>
                  </ThemedText>
                );
              }
              return null;
            })()}
          </View>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <ThemedText type="defaultSemiBold" style={styles.rating}>
              {listing.rating}
            </ThemedText>
            <MaterialIcons name="star" size={14} color="#EAB308" />
            <ThemedText style={styles.reviewCount}>
              ({listing.reviewCount})
            </ThemedText>
            <ThemedText style={styles.distanceInFooter}>
              {' · '}{(listing.distanceFromMe ?? 0).toFixed(1)} mi
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statusLine: {
    fontSize: 11,
    flex: 1,
    opacity: 0.9,
  },
  statusOpen: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  statusClosed: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  statusPipe: {
    fontSize: 11,
    opacity: 0.85,
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
  distanceInFooter: {
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
