/**
 * Supabase queries for listings and bookings.
 * Maps DB rows to the app's Listing type.
 */

import type { Listing, ListingCategory } from '@/data/listings';
import { distanceMiles } from './location';
import { supabase } from './supabase';

export type DbListing = {
  id: string;
  host_id: string | null;
  title: string;
  location: string;
  price: number;
  rating: number;
  review_count: number;
  image_urls: string[];
  description: string | null;
  category: string;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  hours_of_operation: string | null;
  created_at: string;
};

const VALID_CATEGORIES = ['All', '24/7', 'CrossFit', 'Yoga', 'Pool', 'Boutique', 'Budget'] as const;

function mapDbListingToApp(row: DbListing, userLat?: number | null, userLon?: number | null): Listing {
  const category = VALID_CATEGORIES.includes(row.category as ListingCategory)
    ? (row.category as ListingCategory)
    : 'Boutique';
  const lat = row.latitude != null ? Number(row.latitude) : null;
  const lon = row.longitude != null ? Number(row.longitude) : null;
  let distanceFromMe = 0;
  if (userLat != null && userLon != null && lat != null && lon != null) {
    distanceFromMe = Math.round(distanceMiles(userLat, userLon, lat, lon) * 10) / 10;
  }
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    price: Number(row.price),
    rating: Number(row.rating) || 5,
    reviewCount: row.review_count ?? 0,
    imageUrls: Array.isArray(row.image_urls) && row.image_urls.length > 0
      ? row.image_urls
      : ['https://picsum.photos/seed/placeholder/400/300'],
    description: row.description ?? undefined,
    category,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    distanceFromMe,
    latitude: lat,
    longitude: lon,
    hoursOfOperation: row.hours_of_operation ?? undefined,
  };
}

export async function fetchListings(userLat?: number | null, userLon?: number | null): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listings] fetch error:', error);
    return [];
  }

  const mapped = (data ?? []).map((row) => mapDbListingToApp(row as DbListing, userLat, userLon));
  return mapped;
}

export type InsertListingInput = {
  title: string;
  location: string;
  price: number;
  description: string;
  category?: string;
  amenities?: string[];
  imageUrls?: string[];
};

export async function insertListing(input: InsertListingInput): Promise<Listing | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[listings] insert: not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      host_id: user.id,
      title: input.title,
      location: input.location,
      price: input.price,
      description: input.description,
      category: input.category ?? 'Boutique',
      amenities: input.amenities ?? [],
      image_urls: input.imageUrls ?? ['https://picsum.photos/seed/new/400/300'],
      rating: 5,
      review_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[listings] insert error:', error);
    return null;
  }

  return mapDbListingToApp(data as DbListing);
}

export type DbBooking = {
  id: string;
  user_id: string;
  listing_id: string;
  pass_date: string;
  pass_count: number;
  status: string;
  created_at: string;
};

export async function fetchUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listings (*)
    `)
    .eq('user_id', userId)
    .order('pass_date', { ascending: false });

  if (error) {
    console.error('[bookings] fetch error:', error);
    return [];
  }

  return data ?? [];
}

export async function insertBooking(
  userId: string,
  listingId: string,
  passDate: string,
  passCount: number
) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      listing_id: listingId,
      pass_date: passDate,
      pass_count: passCount,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) {
    console.error('[bookings] insert error:', error);
    return null;
  }

  return data as DbBooking;
}

export type ListingReview = {
  id: string;
  user_id: string;
  listing_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export async function fetchListingReviews(listingId: string): Promise<ListingReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, listing_id, rating, comment, created_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[reviews] fetch error:', error);
    return [];
  }
  return (data ?? []) as ListingReview[];
}

/** Fetch all reviews written by the user (to know which listings they have already reviewed). */
export async function fetchReviewsByUser(userId: string): Promise<{ listing_id: string }[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[reviews] fetchByUser error:', error);
    return [];
  }
  return (data ?? []) as { listing_id: string }[];
}

export type InsertReviewInput = {
  userId: string;
  listingId: string;
  bookingId?: string | null;
  rating: number;
  comment?: string | null;
};

/** Insert a review for a listing (e.g. after a visit). One review per user per listing (unique constraint). */
export async function insertReview(input: InsertReviewInput): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: input.userId,
      listing_id: input.listingId,
      booking_id: input.bookingId ?? null,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      comment: input.comment?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[reviews] insert error:', error);
    return null;
  }
  return data as { id: string };
}
