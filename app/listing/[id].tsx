import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListings } from '@/contexts/ListingsContext';
import { useSavedGyms } from '@/contexts/SavedGymsContext';
import { getAmenityIcon } from '@/lib/amenity-icons';
import { getHoursByDayStartingToday, getPlaceStatus } from '@/lib/hours';
import { fetchListingReviews, type ListingReview } from '@/lib/listings';
import { useThemeColor } from '@/hooks/use-theme-color';

const AIRBNB_RED = '#FF5A5F';
const DESCRIPTION_PREVIEW_LENGTH = 120;

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getListingById } = useListings();
  const { isSaved, toggleSaved } = useSavedGyms();
  const listing = id ? getListingById(id) : undefined;

  const imageUrls =
    listing?.imageUrls?.length
      ? listing.imageUrls
      : listing?.imageUrl
        ? [listing.imageUrl]
        : ['https://picsum.photos/seed/placeholder/400/300'];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const reviewsSectionRef = useRef<View>(null);
  const exitProgress = useSharedValue(0);
  const [isExiting, setIsExiting] = useState(false);

  const goToExplore = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/explore');
    }
  }, [router]);

  const handleBack = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    exitProgress.value = withTiming(
      1,
      {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) runOnJS(goToExplore)();
      }
    );
  }, [isExiting, exitProgress, goToExplore]);

  const backdropStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    opacity: 1 - exitProgress.value,
  }));

  const zoomOutStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: 1 - exitProgress.value,
    transform: [{ scale: 1 - 0.14 * exitProgress.value }],
  }));

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / width);
      setActiveImageIndex(Math.min(index, imageUrls.length - 1));
    },
    [width, imageUrls.length]
  );

  const iconColor = useThemeColor({}, 'icon');
  const contentBg = useThemeColor(
    { light: '#fff', dark: '#1a1a1a' },
    'background',
  );
  const reserveBarBg = useThemeColor(
    { light: 'rgba(255,255,255,0.98)', dark: 'rgba(21,23,24,0.98)' },
    'background',
  );
  const reserveBarBorder = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.08)' },
    'background',
  );

  const openDirections = useCallback(() => {
    const loc = listing;
    if (!loc) return;
    const hasCoords = loc.latitude != null && loc.longitude != null;
    const dest = hasCoords ? `${loc.latitude},${loc.longitude}` : encodeURIComponent(loc.location ?? '');
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    const url =
      Platform.OS === 'ios'
        ? `comgooglemaps://?daddr=${dest}&directionsmode=driving`
        : Platform.OS === 'android'
          ? `google.navigation:q=${dest}`
          : webUrl;
    Linking.openURL(url).catch(() => Linking.openURL(webUrl));
  }, [listing?.latitude, listing?.longitude, listing?.location]);

  useEffect(() => {
    if (!id) return;
    fetchListingReviews(id).then(setReviews);
  }, [id]);

  const openMap = useCallback(() => {
    const loc = listing;
    if (!loc) return;
    const hasCoords = loc.latitude != null && loc.longitude != null;
    const dest = hasCoords ? `${loc.latitude},${loc.longitude}` : encodeURIComponent(loc.location ?? '');
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
    Linking.openURL(webUrl);
  }, [listing?.latitude, listing?.longitude, listing?.location]);

  const description = listing?.description ?? 'No description available.';
  const descriptionPreview =
    description.length <= DESCRIPTION_PREVIEW_LENGTH
      ? description
      : description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim() + '...';

  if (!listing) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Listing not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Animated.View style={backdropStyle} pointerEvents={isExiting ? 'none' : 'auto'} />
      <Animated.View style={[zoomOutStyle, { backgroundColor: contentBg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + 80 + insets.bottom }]}
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
            renderItem={({ item, index }) => (
              <View style={{ width }}>
                <Image
                  source={{ uri: item }}
                  style={[styles.image, { width, height: width * (3 / 4) }]}
                  contentFit="cover"
                />
                <View style={styles.imageCounterBadge}>
                  <ThemedText style={styles.imageCounterText}>
                    {index + 1}/{imageUrls.length}
                  </ThemedText>
                </View>
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
            {/* Name - big bold */}
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.listingName}>
                {listing.title}
              </ThemedText>
            </View>

            {/* Hours of operation: status line + expandable daily hours */}
            {listing.hoursOfOperation && (() => {
              const status = getPlaceStatus(listing.hoursOfOperation);
              const dayHours = getHoursByDayStartingToday(listing.hoursOfOperation);
              return (
                <View style={styles.hoursSection}>
                  <MaterialIcons name="schedule" size={20} color={iconColor} />
                  <View style={styles.hoursTextWrap}>
                    <Pressable
                      style={styles.hoursHeaderRow}
                      onPress={() => setHoursExpanded((e) => !e)}
                    >
                      <View style={styles.hoursStatusWrap}>
                        {status?.isOpen === true ? (
                          <>
                            <ThemedText style={styles.hoursStatusOpen}>Open</ThemedText>
                            <ThemedText style={[styles.hoursStatusPipe, { color: iconColor }]}>
                              {' | Closes '}{status.closesAt}
                            </ThemedText>
                          </>
                        ) : status?.isOpen === false ? (
                          <>
                            <ThemedText style={styles.hoursStatusClosed}>Closed</ThemedText>
                            <ThemedText style={[styles.hoursStatusPipe, { color: iconColor }]}>
                              {' | Opens '}{status.opensAt}
                            </ThemedText>
                          </>
                        ) : (
                          <ThemedText style={[styles.hoursStatusFallback, { color: iconColor }]}>
                            Hours
                          </ThemedText>
                        )}
                      </View>
                      <MaterialIcons
                        name={hoursExpanded ? 'expand-less' : 'expand-more'}
                        size={24}
                        color={iconColor}
                      />
                    </Pressable>
                    {hoursExpanded && dayHours.length > 0 && (
                      <View style={[styles.hoursDropdown, { borderTopColor: reserveBarBorder }]}>
                        {dayHours.map(({ dayName, hoursText }) => (
                          <View key={dayName} style={styles.hoursDayRow}>
                            <ThemedText type="defaultSemiBold" style={styles.hoursDayName}>
                              {dayName}
                            </ThemedText>
                            <ThemedText style={[styles.hoursDayValue, { color: iconColor }]}>
                              {hoursText}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* What this place offers - amenities with icons */}
            {listing.amenities && listing.amenities.length > 0 && (
              <>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  What this place offers
                </ThemedText>
                <View style={styles.amenitiesList}>
                  {listing.amenities.map((a) => (
                    <View key={a} style={styles.amenityRow}>
                      <MaterialIcons
                        name={getAmenityIcon(a) as never}
                        size={22}
                        color={iconColor}
                      />
                      <ThemedText style={styles.amenityText}>{a}</ThemedText>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* About - description with Show more */}
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              About this gym
            </ThemedText>
            <ThemedText style={styles.description}>
              {descriptionExpanded ? description : descriptionPreview}
            </ThemedText>
            {description.length > DESCRIPTION_PREVIEW_LENGTH && (
              <Pressable
                style={styles.showMoreWrap}
                onPress={() => setDescriptionExpanded((e) => !e)}>
                <ThemedText style={styles.showMoreText}>
                  {descriptionExpanded ? 'Show less' : 'Show more'}
                </ThemedText>
              </Pressable>
            )}

            {/* Reviews - Airbnb-style */}
            <View ref={reviewsSectionRef} style={styles.reviewsSection} collapsable={false}>
              <View style={styles.reviewsHeaderRow}>
                <ThemedText type="defaultSemiBold" style={styles.ratingBig}>
                  {listing.rating.toFixed(2)}
                </ThemedText>
                <MaterialIcons name="star" size={20} color="#000" style={styles.starIcon} />
                <ThemedText type="defaultSemiBold" style={styles.reviewsSectionTitle}>
                  · {listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'}
                </ThemedText>
              </View>
              {reviews.length === 0 ? (
                <ThemedText style={[styles.noReviews, { color: iconColor }]}>
                  No reviews yet. Be the first to review after your visit.
                </ThemedText>
              ) : (
                <View style={styles.reviewList}>
                  {reviews.map((r) => (
                    <View key={r.id} style={[styles.reviewCard, { borderColor: iconColor }]}>
                      <View style={styles.reviewCardHeader}>
                        <View style={[styles.reviewAvatar, { backgroundColor: iconColor }]} />
                        <View>
                          <ThemedText type="defaultSemiBold">Guest</ThemedText>
                          <View style={styles.reviewStarsRow}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <MaterialIcons
                                key={i}
                                name={i <= r.rating ? 'star' : 'star-border'}
                                size={14}
                                color={iconColor}
                              />
                            ))}
                            <ThemedText style={[styles.reviewDate, { color: iconColor }]}>
                              {' '}
                              {new Date(r.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      {r.comment ? (
                        <ThemedText style={styles.reviewComment}>{r.comment}</ThemedText>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Where you'll be - map + location */}
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Where you'll be
            </ThemedText>
            <ThemedText style={styles.whereLocationText}>{listing.location}</ThemedText>
            {listing.latitude != null && listing.longitude != null && Platform.OS !== 'web' ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.inAppMap}
                  initialRegion={{
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                    }}
                    title={listing.title}
                  />
                </MapView>
              </View>
            ) : (
              <Pressable style={styles.mapPlaceholder} onPress={openMap}>
                <MaterialIcons name="map" size={40} color={iconColor} />
                <ThemedText type="defaultSemiBold" style={styles.viewMapText}>
                  View on map
                </ThemedText>
              </Pressable>
            )}
            <Pressable style={styles.directionsButton} onPress={openDirections}>
              <MaterialIcons name="directions" size={20} color="#fff" />
              <ThemedText style={styles.directionsButtonText}>Get directions</ThemedText>
            </Pressable>
            <ThemedText style={[styles.exactLocationNote, { color: iconColor }]}>
              Exact location will be provided after booking.
            </ThemedText>
          </View>
      </ScrollView>

      {/* Fixed bottom bar - $x daily entry + Get day pass */}
      <View
        style={[
          styles.reserveBarFixed,
          {
            backgroundColor: reserveBarBg,
            borderTopColor: reserveBarBorder,
            paddingBottom: insets.bottom + 16,
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.reserveBarInner}
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
      </View>
      {/* Fixed back button - stays visible when scrolling */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={handleBack}
          disabled={isExiting}
          style={styles.backButton}
          hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        {listing ? (
          <Pressable
            onPress={() => toggleSaved(listing.id)}
            style={styles.favoriteButton}
            hitSlop={12}>
            <MaterialIcons
              name={isSaved(listing.id) ? 'favorite' : 'favorite-border'}
              size={24}
              color={isSaved(listing.id) ? '#FF385C' : '#fff'}
            />
          </Pressable>
        ) : (
          <View style={styles.favoriteButtonPlaceholder} />
        )}
      </View>
      </Animated.View>
    </View>
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
  imageCounterBadge: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  favoriteButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  titleRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
  },
  listingName: {
    fontSize: 28,
    fontWeight: '700',
  },
  ratingReviewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBig: {
    fontSize: 18,
  },
  ratingDot: {
    fontSize: 18,
  },
  reviewsCountText: {
    fontSize: 16,
  },
  hoursSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  hoursTextWrap: {
    flex: 1,
  },
  hoursHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  hoursStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hoursStatusOpen: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  hoursStatusClosed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  hoursStatusPipe: {
    fontSize: 16,
  },
  hoursStatusFallback: {
    fontSize: 16,
  },
  hoursDropdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  hoursDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hoursDayName: {
    fontSize: 15,
  },
  hoursDayValue: {
    fontSize: 15,
  },
  showMoreWrap: {
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 16,
    color: AIRBNB_RED,
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starIcon: {
    marginLeft: 4,
  },
  reviewsSectionTitle: {
    fontSize: 18,
    marginLeft: 4,
  },
  noReviews: {
    fontSize: 15,
  },
  reviewList: {
    gap: 16,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.5,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 13,
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
  },
  whereLocationText: {
    fontSize: 16,
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  inAppMap: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewMapText: {
    marginTop: 8,
    fontSize: 16,
  },
  exactLocationNote: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AIRBNB_RED,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  reserveBarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  reserveBarInner: {
    paddingHorizontal: 0,
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