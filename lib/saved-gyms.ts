/**
 * Supabase persistence for saved gyms (favorites).
 * Requires authenticated user; returns empty / no-op when not signed in.
 */

import { supabase } from './supabase';

export async function getSavedListingIds(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id);

  if (error) return [];
  return (data ?? []).map((row) => row.listing_id as string);
}

export async function addSavedListing(listingId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from('saved_listings').insert({
    user_id: user.id,
    listing_id: listingId,
  });

  return !error;
}

export async function removeSavedListing(listingId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId);

  return !error;
}

export async function toggleSavedListing(listingId: string): Promise<'added' | 'removed' | null> {
  const ids = await getSavedListingIds();
  const isSaved = ids.includes(listingId);
  if (isSaved) {
    const ok = await removeSavedListing(listingId);
    return ok ? 'removed' : null;
  }
  const ok = await addSavedListing(listingId);
  return ok ? 'added' : null;
}
