#!/usr/bin/env node
/**
 * Fetch opening hours from Google Places API (New) for each listing and update Supabase.
 * Uses Text Search (New) to find place id, then Place Details (New) for regularOpeningHours.
 * Same API as fetch-gyms.js - requires Places API (New) enabled for the key.
 *
 * Requires in .env:
 *   GOOGLE_PLACES_API_KEY  - Google Cloud API key with Places API (New) enabled
 *   SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (to update listings)
 *
 * Usage: node scripts/fetch-google-hours.js
 *        node scripts/fetch-google-hours.js --dry-run  (fetch only, do not update DB)
 */

const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.replace(/\r$/, '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch (e) {
    return {};
  }
}

const env = loadEnv();
const GOOGLE_API_KEY = env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!GOOGLE_API_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY in .env or environment');
  process.exit(1);
}
if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for DB update. Use --dry-run to only fetch from Google.');
  process.exit(1);
}

/** Places API (New): Text Search - returns first place id for the query. */
async function findPlaceId(query, key) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({ textQuery: query }),
  });
  const data = await res.json();
  if (data.error) return null;
  const places = data.places || [];
  if (places.length === 0) return null;
  return places[0].id || null;
}

/** Places API (New): Place Details - returns regularOpeningHours.weekdayDescriptions joined. */
async function getPlaceOpeningHours(placeId, key) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'regularOpeningHours',
    },
  });
  const data = await res.json();
  if (data.error) return null;
  const hours = data.regularOpeningHours;
  if (!hours?.weekdayDescriptions?.length) return null;
  return hours.weekdayDescriptions.join(' · ');
}

async function main() {
  let listings = [];
  if (!DRY_RUN && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('listings').select('id, title, location');
    if (error) {
      console.error('Supabase fetch error:', error.message);
      process.exit(1);
    }
    listings = data || [];
  } else if (DRY_RUN) {
    console.log('Dry run: no Supabase credentials, using sample listing.');
    listings = [{ id: 'sample', title: 'Planet Fitness', location: 'San Francisco, CA' }];
  }

  console.log(`Processing ${listings.length} listing(s)...`);

  for (const row of listings) {
    const query = `${row.title} ${row.location}`.trim();
    console.log(`  ${row.title} (${row.location})`);
    try {
      const placeId = await findPlaceId(query, GOOGLE_API_KEY);
      if (!placeId) {
        console.log('    -> No place found');
        continue;
      }
      const hours = await getPlaceOpeningHours(placeId, GOOGLE_API_KEY);
      if (!hours) {
        console.log('    -> No opening hours');
        continue;
      }
      console.log('    ->', hours.substring(0, 60) + (hours.length > 60 ? '…' : ''));

      if (!DRY_RUN && row.id !== 'sample' && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { error } = await supabase.from('listings').update({ hours_of_operation: hours }).eq('id', row.id);
        if (error) console.error('    -> Update error:', error.message);
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error('    -> Error:', err.message);
    }
  }

  console.log('Done.');
}

main();
