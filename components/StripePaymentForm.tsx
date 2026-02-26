/**
 * Stripe Payment Element for web. Renders only when Platform.OS === 'web'.
 * Requires EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
 */

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { createPaymentIntent, getStripePublishableKey, isStripeConfigured } from '@/lib/stripe';

const stripePromise = getStripePublishableKey()
  ? loadStripe(getStripePublishableKey())
  : null;

type PaymentFormProps = {
  amountCents: number;
  listingTitle: string;
  returnUrlParams?: { listingId: string; passDate: string; passCount: string };
  onSuccess: () => void;
  onError: (message: string) => void;
};

function PaymentFormInner({
  returnUrlParams,
  onSuccess,
  onError,
}: Pick<PaymentFormProps, 'returnUrlParams' | 'onSuccess' | 'onError'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setIsSubmitting(true);
      try {
        let returnUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}/confirm-pay-return`
            : undefined;
        if (returnUrl && returnUrlParams) {
          const qs = new URLSearchParams(returnUrlParams).toString();
          returnUrl = `${returnUrl}?${qs}`;
        }

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl,
          },
        });
        if (error) {
          onError(error.message ?? 'Payment failed');
          return;
        }
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Payment failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    [stripe, elements, returnUrlParams, onSuccess, onError]
  );

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        style={{
          ...styles.submitButton,
          opacity: !stripe || isSubmitting ? 0.7 : 1,
        }}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
        ) : (
          'Pay now'
        )}
      </button>
    </form>
  );
}

export function StripePaymentForm({
  amountCents,
  listingTitle,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    createPaymentIntent(amountCents)
      .then((secret) => {
        setClientSecret(secret);
        setInitError(null);
      })
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : 'Failed to initialize payment');
      })
      .finally(() => setLoading(false));
  }, [amountCents]);

  if (Platform.OS !== 'web') return null;
  if (!isStripeConfigured() || !stripePromise) {
    return (
      <ThemedText style={styles.errorText}>
        Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env for card payments.
      </ThemedText>
    );
  }

  if (initError && !clientSecret) {
    return <ThemedText style={styles.errorText}>{initError}</ThemedText>;
  }

  if (loading || !clientSecret) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Preparing payment...</ThemedText>
      </View>
    );
  }

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' as const },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner
        returnUrlParams={props.returnUrlParams}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#FF5A5F',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    border: 'none',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  spinner: {
    marginVertical: 4,
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: 14,
    marginVertical: 16,
  },
  loading: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
