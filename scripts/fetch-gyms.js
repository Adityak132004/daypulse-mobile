#!/usr/bin/env node
/**
 * Fetch real gyms from Google Places API and output SQL to seed the database.
 * Usage: node scripts/fetch-gyms.js "San Francisco"
 *        node scripts/fetch-gyms.js "San Francisco" "Herndon, Virginia"
 *        node scripts/fetch-gyms.js "New York City" "Austin, TX"
 *
 * Requires GOOGLE_PLACES_API_KEY in .env
 * 5,000 free Text Search requests/month. ~60 gyms per city (3 pages).
 * Photo URLs include the API key - ensure key is restricted to Places API only.
 */

const fs = require('fs');
const path = require('path');

const cities = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['San Francisco'];

function loadApiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (key) return key;
  try {
    const envPath = path.join(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^GOOGLE_PLACES_API_KEY=(.+)$/);
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (_) {}
  throw new Error('GOOGLE_PLACES_API_KEY not found. Add it to .env');
}

async function fetchPlacesTextSearch(query, key, pageToken = null) {
  const body = { textQuery: query, pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,nextPageToken',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Places API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  return data;
}

async function fetchAllGyms(cityName, key) {
  const query = `gym in ${cityName}`;
  const gyms = [];
  let pageToken = null;

  do {
    const data = await fetchPlacesTextSearch(query, key, pageToken);
    const places = data.places || [];
    for (const p of places) {
      const loc = p.location;
      if (loc?.latitude == null || loc?.longitude == null) continue;
      const name = p.displayName?.text || p.displayName || 'Unknown';
      const photoNames = (p.photos || []).map((ph) => ph.name).filter(Boolean);
      gyms.push({
        title: name,
        location: p.formattedAddress || '',
        lat: loc.latitude,
        lon: loc.longitude,
        rating: p.rating ?? 4.5,
        reviewCount: p.userRatingCount ?? 0,
        photoNames,
      });
    }
    pageToken = data.nextPageToken || null;
    if (pageToken) {
      console.log(`  Fetched ${gyms.length} so far, getting next page...`);
      await new Promise((r) => setTimeout(r, 200));
    }
  } while (pageToken);

  return gyms;
}

function escapeSql(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function generateSql(gyms, cityNames, apiKey) {
  const categories = ['24/7', 'CrossFit', 'Yoga', 'Boutique', 'Budget'];
  const defaultAmenities = ['Free weights', 'Cardio machines', 'Locker rooms'];

  const values = gyms.map((g, i) => {
    const price = 15 + Math.floor(Math.random() * 25);
    const rating = (g.rating ?? 4.5).toFixed(2);
    const reviewCount = g.reviewCount ?? 0;
    const category = categories[i % categories.length];
    const seed = (g.title || 'gym').replace(/\s/g, '').slice(0, 10);
    const imageUrls = (g.photoNames || []).length > 0
      ? (g.photoNames || []).map(
          (name) => `https://places.googleapis.com/v1/${name}/media?maxWidthPx=400&key=${apiKey}`
        )
      : [`https://picsum.photos/seed/${seed}/400/300`];
    const imageUrlsSql = imageUrls.map((u) => escapeSql(u)).join(',');
    const description = `${g.title} - Fitness center with modern equipment and amenities.`;

    return `(
  ${escapeSql(g.title)},
  ${escapeSql(g.location)},
  ${price},
  ${rating},
  ${reviewCount},
  array[${imageUrlsSql}],
  ${escapeSql(description)},
  ${escapeSql(category)},
  array[${defaultAmenities.map(escapeSql).join(',')}],
  ${g.lat},
  ${g.lon}
)`;
  });

  return `-- Real gyms from Google Places (${cityNames.join(', ')})
-- Run in Supabase SQL Editor (set Role to postgres)
-- Deletes existing listings, then inserts new ones with real photos

DELETE FROM public.listings;

INSERT INTO public.listings (title, location, price, rating, review_count, image_urls, description, category, amenities, latitude, longitude)
VALUES
${values.join(',\n')}
;
`;
}

async function main() {
  const apiKey = loadApiKey();
  const seen = new Set();
  const allGyms = [];

  for (const city of cities) {
    console.log(`Fetching gyms in ${city}...`);
    const gyms = await fetchAllGyms(city, apiKey);
    let added = 0;
    for (const g of gyms) {
      const key = `${g.title.toLowerCase()}|${g.lat.toFixed(5)}|${g.lon.toFixed(5)}`;
      if (!seen.has(key)) {
        seen.add(key);
        allGyms.push(g);
        added++;
      }
    }
    console.log(`  Added ${added} gyms (${gyms.length - added} duplicates skipped)`);
  }

  console.log(`\nTotal: ${allGyms.length} gyms`);

  if (allGyms.length === 0) {
    console.log('No gyms found. Try different cities.');
    process.exit(1);
  }

  const sql = generateSql(allGyms, cities, apiKey);
  const outPath = 'supabase/migrations/seed_real_gyms.sql';
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`\nSaved to ${outPath}`);
  console.log('\nTo apply: Copy the SQL and run it in Supabase Dashboard → SQL Editor');
  console.log('Or run: npx supabase db execute < supabase/migrations/seed_real_gyms.sql');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
