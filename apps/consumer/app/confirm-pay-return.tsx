/**
 * Handles return from Stripe after 3DS or redirect. Creates booking and redirects to Pass tab.
 * Only used on web when Stripe redirects back with payment success.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { insertBooking } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

export default function ConfirmPayReturnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    listingId?: string;
    passDate?: string;
    passCount?: string;
    redirect_status?: string;
  }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const listingId = params.listingId ?? params.listingId?.[0];
      const passDate = params.passDate ?? params.passDate?.[0];
      const passCountStr = params.passCount ?? params.passCount?.[0];
      const redirectStatus = params.redirect_status ?? params.redirect_status?.[0];

      if (redirectStatus !== 'succeeded') {
        setStatus('error');
        setErrorMsg(redirectStatus === 'failed' ? 'Payment was not successful.' : 'Invalid redirect.');
        return;
      }

      if (!listingId || !passDate || !passCountStr) {
        setStatus('error');
        setErrorMsg('Missing booking details.');
        return;
      }

      const passCount = 1;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        setErrorMsg('Please sign in to complete your purchase.');
        return;
      }

      const booking = await insertBooking(user.id, listingId, passDate, passCount);
      if (booking) {
        setStatus('success');
        router.dismissAll();
        router.replace('/(tabs)/pass');
      } else {
        setStatus('error');
        setErrorMsg('Payment succeeded but we couldn\'t create your pass. Please contact support.');
      }
    };

    run();
  }, [params, router]);

  if (status === 'loading') {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Completing your purchase...</ThemedText>
      </ThemedView>
    );
  }

  if (status === 'error') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.errorTitle}>
          Something went wrong
        </ThemedText>
        <ThemedText style={styles.errorMsg}>{errorMsg}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" />
      <ThemedText style={styles.loadingText}>Redirecting to your pass...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 16,
    textAlign: 'center',
  },
});
