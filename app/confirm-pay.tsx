import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListings } from '@/contexts/ListingsContext';
import { insertBooking } from '@/lib/listings';
import { getMockAuthenticated } from '@/lib/mock-auth';
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('apple-pay');
  const [moreOptionsExpanded, setMoreOptionsExpanded] = useState(false);
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#717171', dark: '#A1A1A1' }, 'text');
  const textColor = useThemeColor({}, 'text');
  const total = listing.price * passCount;

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const passDate = `${y}-${m}-${d}`;
    const booking = await insertBooking(user.id, listing.id, passDate, passCount);

    setIsSubmitting(false);

    if (booking) {
      Alert.alert(
        'Pass added!',
        `Your day pass for ${listing.title} is ready. Show the QR code at the gym.`,
        [{ text: 'View pass', onPress: () => router.replace('/(tabs)/pass') }]
      );
    } else {
      Alert.alert(
        'Something went wrong',
        'Could not create your pass. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
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
  isSubmitting,
  insets,
  borderColor,
  secondaryTextColor,
  textColor,
}: ConfirmPayContentProps) {
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
          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (d) setDate(d);
                  if (Platform.OS === 'android') setShowDatePicker(false);
                }}
                minimumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  style={styles.dateDoneBtn}
                  onPress={() => setShowDatePicker(false)}>
                  <ThemedText type="defaultSemiBold" style={styles.dateDoneText}>
                    Done
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: secondaryTextColor }]}>
              Passes
            </ThemedText>
            <View style={styles.passCountRow}>
              <Pressable
                onPress={() => setPassCount((c) => Math.max(1, c - 1))}
                style={styles.passCountBtn}>
                <MaterialIcons name="remove" size={20} color={textColor} />
              </Pressable>
              <ThemedText type="defaultSemiBold" style={styles.passCountValue}>
                {passCount}
              </ThemedText>
              <Pressable
                onPress={() => setPassCount((c) => c + 1)}
                style={styles.passCountBtn}>
                <MaterialIcons name="add" size={20} color={textColor} />
              </Pressable>
            </View>
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
      </ScrollView>

      {/* Pay button */}
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
