# Supabase Backend Setup

This guide walks you through setting up the listings and bookings tables in Supabase.

## 1. Run the migrations

### Option A: Supabase Dashboard (easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Open **SQL Editor**
3. Copy the contents of `supabase/migrations/20250209120000_create_listings_bookings.sql`
4. Paste and click **Run**
5. (Optional) Copy contents of `supabase/migrations/20250209120001_seed_listings.sql` and run to add sample gym listings

### Option B: Supabase CLI

If you have [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked:

```bash
supabase db push
```

## 2. Verify tables

In the Supabase Dashboard → **Table Editor**, you should see:

- **profiles** – extends auth users (first_name, last_name, date_of_birth)
- **listings** – gym listings for day passes
- **bookings** – day pass purchases

## 3. App behavior

- **Listings**: Fetched from Supabase on app load. If the DB is empty or unreachable, the app falls back to dummy data.
- **Add gym** (Host tab): New listings are saved to Supabase (requires sign-in).
- **Bookings**: Ready for use when you integrate payments. Use `insertBooking()` from `lib/listings.ts`.
