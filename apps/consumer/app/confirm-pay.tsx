import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StripePaymentForm } from '@/components/StripePaymentForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListings } from '@/contexts/ListingsContext';
import { insertBooking } from '@/lib/listings';
import { getMockAuthenticated } from '@/lib/mock-auth';
import { isStripeConfigured } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { useThemeColor } from '@/hooks/use-theme-color';
const AIRBNB_RED = '#FF5A5F';

type PaymentMethod = 'apple-pay' | 'paypal' | 'card' | 'bank';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStartOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type CalendarCell =
  | { type: 'empty' }
  | { type: 'day'; day: number; date: Date; isPast: boolean };

function getCalendarCells(year: number, month: number, today: Date): CalendarCell[] {
  // Use noon local to avoid UTC boundary shifting the weekday in some timezones
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const last = new Date(year, month + 1, 0, 12, 0, 0, 0);
  const startWeekday = first.getDay(); // 0 = Sunday (matches DAY_HEADERS order)
  const daysInMonth = last.getDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ type: 'empty' });
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day, 12, 0, 0, 0);
    const isPast = getStartOfDay(date) < today;
    cells.push({ type: 'day', day, date, isPast });
  }
  return cells;
}

export default function ConfirmPayScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = (typeof params.id === 'string' ? params.id : params.id?.[0]) ?? '';
  const { getListingById } = useListings();
  const listing = id ? getListingById(id) : undefined;

  if (!listing) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Listing not found</ThemedText>
      </ThemedView>
    );
  }

  return <ConfirmPayContentWithFallback listing={listing} />;
}

function ConfirmPayContentWithFallback({ listing }: { listing: { id: string; title: string; price: number } }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [passCount, setPassCount] = useState(1);
  const isWebWithStripe = Platform.OS === 'web' && isStripeConfigured();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isWebWithStripe ? 'card' : 'apple-pay'
  );
  const [moreOptionsExpanded, setMoreOptionsExpanded] = useState(isWebWithStripe);
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');
  const textColor = useThemeColor({}, 'text');
  const total = listing.price * passCount;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBookingAndNavigate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const passDate = `${y}-${m}-${d}`;
    const booking = await insertBooking(user.id, listing.id, passDate, passCount);
    if (booking) {
      router.dismissAll();
      router.replace('/(tabs)/pass');
      return true;
    }
    return false;
  };

  const handlePay = async () => {
    if (getMockAuthenticated()) {
      Alert.alert(
        'Demo mode',
        'Sign in with a real account to create day passes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to buy a day pass.');
      return;
    }

    setIsSubmitting(true);
    const ok = await createBookingAndNavigate();
    setIsSubmitting(false);

    if (!ok) {
      Alert.alert(
        'Something went wrong',
        'Could not create your pass. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStripeSuccess = async () => {
    const ok = await createBookingAndNavigate();
    if (!ok) {
      Alert.alert(
        'Payment succeeded',
        'Your payment went through, but we couldn\'t create your pass. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStripeError = (msg: string) => {
    Alert.alert('Payment failed', msg);
  };

  const passDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return (
    <ConfirmPayContent
      listing={listing}
      router={router}
      date={date}
      setDate={setDate}
      showDatePicker={showDatePicker}
      setShowDatePicker={setShowDatePicker}
      passCount={passCount}
      setPassCount={setPassCount}
      paymentMethod={paymentMethod}
      setPaymentMethod={setPaymentMethod}
      moreOptionsExpanded={moreOptionsExpanded}
      setMoreOptionsExpanded={setMoreOptionsExpanded}
      total={total}
      handlePay={handlePay}
      handleStripeSuccess={handleStripeSuccess}
      handleStripeError={handleStripeError}
      returnUrlParams={{
        listingId: listing.id,
        passDate: passDateStr,
        passCount: String(passCount),
      }}
      isSubmitting={isSubmitting}
      insets={insets}
      borderColor={borderColor}
      secondaryTextColor={secondaryTextColor}
      textColor={textColor}
    />
  );
}

type ConfirmPayContentProps = {
  listing: { id: string; title: string; price: number };
  router: ReturnType<typeof useRouter>;
  date: Date;
  setDate: (d: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (s: boolean) => void;
  passCount: number;
  setPassCount: (n: number | ((n: number) => number)) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  moreOptionsExpanded: boolean;
  setMoreOptionsExpanded: (s: boolean) => void;
  total: number;
  handlePay: () => void | Promise<void>;
  handleStripeSuccess?: () => void | Promise<void>;
  handleStripeError?: (msg: string) => void;
  returnUrlParams?: { listingId: string; passDate: string; passCount: string };
  isSubmitting: boolean;
  insets: { top: number; bottom: number };
  borderColor: string;
  secondaryTextColor: string;
  textColor: string;
};

function ConfirmPayContent({
  listing,
  router,
  date,
  setDate,
  showDatePicker,
  setShowDatePicker,
  passCount,
  setPassCount,
  paymentMethod,
  setPaymentMethod,
  moreOptionsExpanded,
  setMoreOptionsExpanded,
  total,
  handlePay,
  handleStripeSuccess,
  handleStripeError,
  returnUrlParams,
  isSubmitting,
  insets,
  borderColor,
  secondaryTextColor,
  textColor,
}: ConfirmPayContentProps) {
  const showStripeForm = Platform.OS === 'web' && paymentMethod === 'card' && isStripeConfigured();
  const { width } = useWindowDimensions();
  const cellSize = Math.min(44, (width - 40) / 7);
  const [selectedInModal, setSelectedInModal] = useState(date);
  const today = useMemo(() => getStartOfDay(new Date()), []);
  const modalBg = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');

  useEffect(() => {
    if (showDatePicker) setSelectedInModal(date);
  }, [showDatePicker, date]);

  const handleSaveDate = () => {
    setDate(selectedInModal);
    setShowDatePicker(false);
  };
  const handleClearDates = () => {
    setDate(today);
    setSelectedInModal(today);
    setShowDatePicker(false);
  };

  const getPayButtonLabel = () => {
    if (isSubmitting) return 'Adding pass...';
    switch (paymentMethod) {
      case 'apple-pay':
        return 'Pay with Apple Pay';
      case 'paypal':
        return 'Pay with PayPal';
      case 'card':
        return 'Pay with card';
      case 'bank':
        return 'Pay with bank account';
      default:
        return 'Confirm and pay';
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color={textColor} />
        </Pressable>
        <ThemedText type="subtitle">Confirm and pay</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Booking summary */}
        <View style={[styles.card, { borderColor }]}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            {listing.title}
          </ThemedText>
          <Pressable
            style={styles.summaryRow}
            onPress={() => setShowDatePicker(true)}>
            <ThemedText style={[styles.summaryLabel, { color: secondaryTextColor }]}>
              Date
            </ThemedText>
            <View style={styles.dateRow}>
              <ThemedText>{formatDate(date)}</ThemedText>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={secondaryTextColor} />
            </View>
          </Pressable>

          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade">
            <Pressable
              style={styles.calendarOverlay}
              onPress={() => setShowDatePicker(false)}>
              <Pressable
                style={[styles.calendarModal, { backgroundColor: modalBg }]}
                onPress={(e) => e.stopPropagation()}>
                <View style={styles.calendarHeader}>
                  <ThemedText type="subtitle">Change dates</ThemedText>
                  <Pressable onPress={() => setShowDatePicker(false)} hitSlop={12}>
                    <MaterialIcons name="close" size={24} color={textColor} />
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.calendarScroll}
                  contentContainerStyle={styles.calendarScrollContent}
                  showsVerticalScrollIndicator={false}>
                  {[0, 1, 2].map((monthOffset) => {
                    const d = new Date(today);
                    d.setMonth(d.getMonth() + monthOffset);
                    const year = d.getFullYear();
                    const month = d.getMonth();
                    const cells = getCalendarCells(year, month, today);
                    const isSelected = (dayDate: Date) =>
                      selectedInModal.getFullYear() === dayDate.getFullYear() &&
                      selectedInModal.getMonth() === dayDate.getMonth() &&
                      selectedInModal.getDate() === dayDate.getDate();
                    // Chunk into rows of 7 so columns always align with S M T W T F S
                    const rows: CalendarCell[][] = [];
                    for (let r = 0; r < cells.length; r += 7) {
                      rows.push(cells.slice(r, r + 7));
                    }
                    return (
                      <View key={`${year}-${month}`} style={styles.calendarMonth}>
                        <ThemedText type="defaultSemiBold" style={styles.calendarMonthTitle}>
                          {MONTH_NAMES[month]} {year}
                        </ThemedText>
                        <View style={styles.calendarDayHeaders}>
                          {DAY_HEADERS.map((h, i) => (
                            <Text key={`${year}-${month}-h-${i}`} style={[styles.calendarDayHeader, { color: secondaryTextColor, width: cellSize }]}>
                              {h}
                            </Text>
                          ))}
                        </View>
                        <View style={styles.calendarGrid}>
                          {rows.map((rowCells, rowIdx) => (
                            <View key={`row-${year}-${month}-${rowIdx}`} style={styles.calendarGridRow}>
                              {rowCells.map((cell, idx) => {
                                const cellIdx = rowIdx * 7 + idx;
                                if (cell.type === 'empty') {
                                  return <View key={`empty-${year}-${month}-${cellIdx}`} style={[styles.calendarCell, { width: cellSize, height: cellSize }]} />;
                                }
                                const { day, date, isPast } = cell;
                                const selected = isSelected(date);
                                const disabled = isPast;
                                return (
                                  <Pressable
                                    key={`${year}-${month}-${day}`}
                                    style={[
                                      styles.calendarCell,
                                      { width: cellSize, height: cellSize },
                                      selected && styles.calendarCellSelected,
                                      selected && { backgroundColor: AIRBNB_RED },
                                    ]}
                                    onPress={() => {
                                      if (!disabled) setSelectedInModal(date);
                                    }}
                                    disabled={disabled}>
                                    <ThemedText
                                      style={[
                                        styles.calendarCellText,
                                        disabled && { color: secondaryTextColor, textDecorationLine: 'line-through' },
                                        selected && styles.calendarCellTextSelected,
                                      ]}>
                                      {day}
                                    </ThemedText>
                                  </Pressable>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={[styles.calendarFooter, { borderTopColor: borderColor }]}>
                  <Pressable onPress={handleClearDates} style={styles.calendarClearBtn}>
                    <ThemedText style={styles.calendarClearText}>Clear dates</ThemedText>
                  </Pressable>
                  <Pressable style={styles.calendarSaveBtn} onPress={handleSaveDate}>
                    <ThemedText style={styles.calendarSaveText}>Save</ThemedText>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: secondaryTextColor }]}>
              Passes
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.passCountValue}>
              1
            </ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText type="defaultSemiBold">Total</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.totalValue}>
              ${total}
            </ThemedText>
          </View>
        </View>

        {/* Payment methods */}
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Payment method
        </ThemedText>

        <View style={[styles.card, { borderColor }]}>
          {/* Apple Pay */}
          <Pressable
            style={[styles.paymentRow, { borderBottomColor: borderColor }]}
            onPress={() => setPaymentMethod('apple-pay')}>
            <MaterialCommunityIcons name="apple" size={24} color={textColor} />
            <ThemedText type="defaultSemiBold" style={styles.paymentLabel}>
              Apple Pay
            </ThemedText>
            <View style={styles.radioOuter}>
              {paymentMethod === 'apple-pay' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </Pressable>

          {/* PayPal */}
          <Pressable
            style={[styles.paymentRow, { borderBottomColor: borderColor }]}
            onPress={() => setPaymentMethod('paypal')}>
            <MaterialCommunityIcons name="paypal" size={24} color="#003087" />
            <ThemedText type="defaultSemiBold" style={styles.paymentLabel}>
              PayPal
            </ThemedText>
            <View style={styles.radioOuter}>
              {paymentMethod === 'paypal' && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          {/* More options */}
          <Pressable
            style={[styles.paymentRow, styles.moreOptionsRow]}
            onPress={() => setMoreOptionsExpanded(!moreOptionsExpanded)}>
            <ThemedText type="defaultSemiBold" style={styles.paymentLabel}>
              More options
            </ThemedText>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color={secondaryTextColor}
              style={{
                transform: [{ rotate: moreOptionsExpanded ? '90deg' : '0deg' }],
              }}
            />
          </Pressable>

          {moreOptionsExpanded && (
            <>
              {/* Credit or debit card */}
              <Pressable
                style={[styles.paymentRow, styles.nestedRow, { borderBottomColor: borderColor }]}
                onPress={() => setPaymentMethod('card')}>
                <MaterialIcons name="credit-card" size={22} color={textColor} />
                <ThemedText style={styles.paymentLabel}>
                  Credit or debit card
                </ThemedText>
                <View style={styles.radioOuter}>
                  {paymentMethod === 'card' && <View style={styles.radioInner} />}
                </View>
              </Pressable>

              {/* Bank account */}
              <Pressable
                style={[styles.paymentRow, styles.nestedRow]}
                onPress={() => setPaymentMethod('bank')}>
                <MaterialIcons name="account-balance" size={22} color={textColor} />
                <ThemedText style={styles.paymentLabel}>Bank account</ThemedText>
                <View style={styles.radioOuter}>
                  {paymentMethod === 'bank' && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            </>
          )}
        </View>

        {/* Stripe card form (web only) */}
        {showStripeForm && handleStripeSuccess && handleStripeError && (
          <View style={[styles.stripeFormWrap, { borderColor }]}>
            <StripePaymentForm
              amountCents={Math.round(total * 100)}
              listingTitle={listing.title}
              returnUrlParams={returnUrlParams}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
            />
          </View>
        )}
      </ScrollView>

      {/* Pay button (hidden when Stripe form is shown) */}
      {!showStripeForm && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 16,
              borderTopColor: borderColor,
            },
          ]}>
          <Pressable
            style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={isSubmitting}>
            <ThemedText style={styles.payButtonText}>{getPayButtonLabel()}</ThemedText>
          </Pressable>
        </View>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  calendarScroll: {
    maxHeight: 400,
  },
  calendarScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarMonth: {
    marginBottom: 24,
  },
  calendarMonthTitle: {
    fontSize: 17,
    marginBottom: 12,
  },
  calendarDayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayHeader: {
    fontSize: 12,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'column',
  },
  calendarGridRow: {
    flexDirection: 'row',
  },
  calendarCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  calendarCellSelected: {
    backgroundColor: AIRBNB_RED,
  },
  calendarCellText: {
    fontSize: 16,
  },
  calendarCellTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  calendarClearBtn: {
    paddingVertical: 12,
  },
  calendarClearText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  calendarSaveBtn: {
    backgroundColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  calendarSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dateDoneBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateDoneText: {
    color: AIRBNB_RED,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    marginTop: 4,
  },
  totalValue: {
    fontSize: 18,
  },
  passCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passCountBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passCountValue: {
    minWidth: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
  },
  moreOptionsRow: {
    borderBottomWidth: 0,
  },
  nestedRow: {
    paddingLeft: 40,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AIRBNB_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AIRBNB_RED,
  },
  stripeFormWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  payButton: {
    backgroundColor: AIRBNB_RED,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
