# Add Real Gyms to DayPulse

The `fetch-gyms.js` script pulls real gym data from **OpenStreetMap** (free, no API key) and generates SQL to seed your database.

## Quick start

```bash
node scripts/fetch-gyms.js "San Francisco"
```

This creates `supabase/migrations/seed_real_gyms.sql` with real gyms.

## Apply the data

**Option A – Supabase Dashboard**
1. Open your project → **SQL Editor**
2. Open `supabase/migrations/seed_real_gyms.sql`
3. Copy all contents and paste into the SQL Editor
4. Click **Run**

**Option B – Supabase CLI**
```bash
npx supabase db execute < supabase/migrations/seed_real_gyms.sql
```

## Try different cities

```bash
node scripts/fetch-gyms.js "New York City"
node scripts/fetch-gyms.js "Austin, TX"
node scripts/fetch-gyms.js "Los Angeles"
node scripts/fetch-gyms.js "Chicago"
node scripts/fetch-gyms.js "Miami"
```

## What it fetches

- **Name** – From OpenStreetMap
- **Address** – Street, city, state (when available)
- **Location** – City/area for display
- **Coordinates** – Lat/lng for maps
- **Price, rating, etc.** – Assigned defaults (you can edit the SQL)

## Limits

- Uses OSM data only (no Google/Yelp)
- Images are placeholders (picsum.photos)
- Run once per city to avoid duplicates
- If you get few results, try a larger area (e.g. state or region)
