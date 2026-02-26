/**
 * Stripe configuration and payment helpers.
 * Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env (pk_test_... for test mode).
 * For Apple Pay, you need a development build (npx expo run:ios) - it won't work in Expo Go.
 *
 * Backend: Deploy supabase/functions/create-payment-intent and set STRIPE_SECRET_KEY.
 */

import { supabase } from './supabase';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

export function getStripePublishableKey(): string {
  return STRIPE_KEY;
}

export function isStripeConfigured(): boolean {
  return STRIPE_KEY.length > 0 && STRIPE_KEY.startsWith('pk_');
}

/** Create a PaymentIntent via Supabase Edge Function. Amount in cents. */
export async function createPaymentIntent(amountCents: number): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ clientSecret?: string; error?: string }>(
    'create-payment-intent',
    { body: { amount: amountCents } }
  );

  if (error) {
    throw new Error(error.message || 'Failed to create payment intent');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (!data?.clientSecret) {
    throw new Error('No client secret returned');
  }
  return data.clientSecret;
}
