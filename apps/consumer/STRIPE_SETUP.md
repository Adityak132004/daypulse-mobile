# Stripe Setup for DayPulse

## 1. Create a Stripe account

Sign up at [dashboard.stripe.com](https://dashboard.stripe.com) (free).

## 2. Get your API keys

1. Open [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
2. Make sure you're in **Test mode** (toggle in the top right)
3. Copy **Publishable key** (starts with `pk_test_`)
4. Copy **Secret key** (starts with `sk_test_`)

## 3. Add to your app

**`.env`** – add your publishable key:
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Supabase** – set the secret key as an Edge Function secret:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
```

## 4. Deploy the Edge Function

```bash
npx supabase functions deploy create-payment-intent
```

## 5. Test

1. Run the app on web: `npm run web`
2. Sign in with a real account
3. Go to a listing → Get day pass → Confirm and pay
4. Select "Credit or debit card" (under More options)
5. Use test card: **4242 4242 4242 4242**
   - Expiry: any future date
   - CVC: any 3 digits
   - ZIP: any 5 digits

## Note

- **Web only**: Real Stripe payments work on the web build (`npm run web`)
- **Native**: On iOS/Android, the demo flow still works (no charge). For native Stripe, you’d need a development build with `@stripe/stripe-react-native`
