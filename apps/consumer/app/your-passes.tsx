import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchReviewsByUser, fetchUserBookings, insertReview } from '@/lib/listings';
import { getMockAuthenticated } from '@/lib/mock-auth';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';

const REVIEW_BUTTON_RED = '#FF5A5F';

type BookingWithListing = {
  id: string;
  pass_date: string;
  pass_count: number;
  status: string;
  listings: { id: string; title: string; location: string } | null;
};

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  const [reviewedListingIds, setReviewedListingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<BookingWithListing | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');
  const contentBg = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');

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

    const [bookingsData, reviewsData] = await Promise.all([
      fetchUserBookings(user.id),
      fetchReviewsByUser(user.id),
    ]);
    setBookings((bookingsData ?? []) as BookingWithListing[]);
    setReviewedListingIds(new Set((reviewsData ?? []).map((r) => r.listing_id)));
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

  const today = getTodayLocal();
  const openReviewModal = useCallback((booking: BookingWithListing) => {
    setBookingToReview(booking);
    setReviewRating(5);
    setReviewComment('');
  }, []);
  const closeReviewModal = useCallback(() => {
    setBookingToReview(null);
  }, []);

  const submitReview = useCallback(async () => {
    const booking = bookingToReview;
    if (!booking?.listings?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setIsSubmittingReview(true);
    const result = await insertReview({
      userId: user.id,
      listingId: booking.listings.id,
      bookingId: booking.id,
      rating: reviewRating,
      comment: reviewComment || undefined,
    });
    setIsSubmittingReview(false);
    if (result) {
      setReviewedListingIds((prev) => new Set([...prev, booking.listings!.id]));
      closeReviewModal();
    }
  }, [bookingToReview, reviewRating, reviewComment, closeReviewModal]);

  const sections = useMemo(() => {
    const today = getTodayLocal();
    const active: BookingWithListing[] = [];
    const past: BookingWithListing[] = [];
    for (const b of bookings) {
      if (b.pass_date >= today) active.push(b);
      else past.push(b);
    }
    const result: { title: string; data: BookingWithListing[] }[] = [];
    if (active.length > 0) {
      result.push({ title: 'Active passes', data: active });
    }
    if (past.length > 0) {
      result.push({ title: 'Past visits', data: past });
    }
    return result;
  }, [bookings]);

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
    const isPast = item.pass_date < today;
    const listingId = item.listings?.id;
    const canReview = isPast && listingId && !reviewedListingIds.has(listingId);
    return (
      <View style={[styles.passCard, { borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.passCardTitle}>
          {gymName}
        </ThemedText>
        <ThemedText style={[styles.passCardDate, { color: secondaryTextColor }]}>
          {formatPassDate(item.pass_date)}
          {item.pass_count > 1 ? ` · ${item.pass_count} passes` : ''}
        </ThemedText>
        {canReview && (
          <Pressable
            style={styles.leaveReviewBtn}
            onPress={() => openReviewModal(item)}>
            <MaterialIcons name="star" size={18} color="#fff" />
            <ThemedText style={styles.leaveReviewBtnText}>Leave a review</ThemedText>
          </Pressable>
        )}
        {isPast && listingId && reviewedListingIds.has(listingId) && (
          <ThemedText style={[styles.reviewedLabel, { color: secondaryTextColor }]}>
            Reviewed
          </ThemedText>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <ThemedText
      type="subtitle"
      style={[
        styles.sectionHeader,
        { color: secondaryTextColor },
        sections[0]?.title === section.title && { marginTop: 0 },
      ]}>
      {section.title}
    </ThemedText>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <ThemedText type="subtitle">Your passes</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderPassCard}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        stickySectionHeadersEnabled={false}
      />

      {/* Review modal */}
      <Modal
        visible={bookingToReview != null}
        transparent
        animationType="fade"
        onRequestClose={closeReviewModal}>
        <Pressable style={styles.reviewModalOverlay} onPress={closeReviewModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.reviewModalKeyboardWrap}>
            <Pressable
              style={[styles.reviewModalCard, { backgroundColor: contentBg, borderColor }]}
              onPress={(e) => e.stopPropagation()}>
              <Pressable style={styles.reviewModalCardInner} onPress={Keyboard.dismiss}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.reviewModalScrollContent}>
                  <ThemedText type="subtitle" style={styles.reviewModalTitle}>
                    How was your visit?
                  </ThemedText>
                  {bookingToReview?.listings?.title && (
                    <ThemedText style={[styles.reviewModalGym, { color: secondaryTextColor }]}>
                      {bookingToReview.listings.title}
                    </ThemedText>
                  )}
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        onPress={() => setReviewRating(star)}
                        style={styles.reviewStarBtn}
                        hitSlop={8}>
                        <MaterialIcons
                          name={star <= reviewRating ? 'star' : 'star-border'}
                          size={36}
                          color={star <= reviewRating ? '#FFB800' : secondaryTextColor}
                        />
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.reviewCommentInput, { borderColor, color: textColor }]}
                    placeholder="Add a comment (optional)"
                    placeholderTextColor={secondaryTextColor}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                  <Pressable
                    onPress={Keyboard.dismiss}
                    style={styles.reviewDoneKeyboardBtn}>
                    <ThemedText style={[styles.reviewDoneKeyboardText, { color: secondaryTextColor }]}>
                      Done
                    </ThemedText>
                  </Pressable>
                  <View style={styles.reviewModalActions}>
                    <Pressable onPress={closeReviewModal} style={styles.reviewCancelBtn}>
                      <ThemedText style={[styles.reviewCancelText, { color: secondaryTextColor }]}>Cancel</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={submitReview}
                      disabled={isSubmittingReview}
                      style={[styles.reviewSubmitBtn, isSubmittingReview && styles.reviewSubmitBtnDisabled]}>
                      {isSubmittingReview ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <ThemedText style={styles.reviewSubmitText}>Submit</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
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
  sectionHeader: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
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
  leaveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: REVIEW_BUTTON_RED,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  leaveReviewBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewedLabel: {
    fontSize: 13,
    marginTop: 8,
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  reviewModalKeyboardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  reviewModalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '85%',
  },
  reviewModalCardInner: {
    padding: 24,
  },
  reviewModalScrollContent: {
    paddingBottom: 24,
  },
  reviewModalTitle: {
    marginBottom: 4,
  },
  reviewModalGym: {
    fontSize: 15,
    marginBottom: 20,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 20,
  },
  reviewStarBtn: {
    padding: 4,
  },
  reviewCommentInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  reviewDoneKeyboardBtn: {
    paddingVertical: 10,
    marginTop: 8,
  },
  reviewDoneKeyboardText: {
    fontSize: 14,
  },
  reviewModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  reviewCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  reviewCancelText: {
    fontSize: 16,
  },
  reviewSubmitBtn: {
    backgroundColor: REVIEW_BUTTON_RED,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  reviewSubmitBtnDisabled: {
    opacity: 0.7,
  },
  reviewSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
