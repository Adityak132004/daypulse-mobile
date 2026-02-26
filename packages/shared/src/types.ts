/**
 * Shared DB row types for listings and bookings.
 * Used by both consumer and gym apps.
 */

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
  updated_at?: string;
};

export type DbBooking = {
  id: string;
  user_id: string;
  listing_id: string;
  pass_date: string;
  pass_count: number;
  status: string;
  created_at: string;
};
