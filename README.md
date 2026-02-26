# DayPulse Monorepo

Two apps, one Supabase backend:

- **Consumer app** (`apps/consumer`) – DayPulse: browse gyms, buy day passes, your passes, profile.
- **Gym app** (`apps/gym`) – DayPulse Gym: for gym owners to manage listings and view bookings.

Shared code:

- **`packages/shared`** – Supabase client factory and shared types (`@daypulse/shared`).
- **`supabase/`** – Migrations and config (single project at repo root).

## Setup

1. **Install (from repo root)**

   ```bash
   npm install
   ```

2. **Consumer app**

   - Copy `.env` into `apps/consumer/` (same as before: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, Stripe keys if needed).
   - From root: `npm run consumer`  
   - Or: `cd apps/consumer && npm run start`

3. **Gym app**

   - Copy the same Supabase env vars into `apps/gym/.env` (create the file).
   - From root: `npm run gym`  
   - Or: `cd apps/gym && npm run start`

## Root scripts

- `npm run consumer` – start the consumer (DayPulse) app.
- `npm run gym` – start the gym app.

## Folder layout

- `apps/consumer/` – Expo app (consumer).
- `apps/gym/` – Expo app (gym owners).
- `packages/shared/` – `@daypulse/shared` (Supabase client, types).
- `supabase/` – migrations, seed, local config.

The consumer app still has its own `lib/supabase.ts` for now; it can be switched to `@daypulse/shared` later. The gym app already uses `@daypulse/shared`.
