import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DUMMY_LISTINGS, type Listing } from '@/data/listings';
import { fetchListings, insertListing } from '@/lib/listings';
import { distanceMiles, useUserLocation } from '@/lib/location';

export type NewListingInput = {
  title: string;
  location: string;
  price: number;
  description: string;
  imageUrl?: string;
  imageUrls?: string[];
  category?: import('@/data/listings').ListingCategory;
  amenities?: string[];
};

type ListingsContextValue = {
  listings: Listing[];
  isLoading: boolean;
  addListing: (input: NewListingInput) => Promise<void>;
  getListingById: (id: string) => Listing | undefined;
  refreshListings: () => Promise<void>;
};

const ListingsContext = createContext<ListingsContextValue | null>(null);

const DEFAULT_IMAGES = [
  'https://picsum.photos/seed/new1/400/300',
  'https://picsum.photos/seed/new2/400/300',
  'https://picsum.photos/seed/new3/400/300',
];

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(DUMMY_LISTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { location: userLocation } = useUserLocation();

  const refreshListings = useCallback(async () => {
    const userLat = userLocation?.latitude ?? null;
    const userLon = userLocation?.longitude ?? null;
    const fromDb = await fetchListings(userLat, userLon);
    if (fromDb.length > 0) {
      setListings(fromDb);
    }
    setIsLoading(false);
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  // When user location becomes available, update distances on existing listings
  // so we don't show 0.0 mi if the initial fetch happened before location was ready.
  useEffect(() => {
    if (userLocation == null) return;
    setListings((prev) =>
      prev.map((listing) => {
        const lat = listing.latitude;
        const lon = listing.longitude;
        if (lat == null || lon == null) return listing;
        const distanceFromMe =
          Math.round(distanceMiles(userLocation.latitude, userLocation.longitude, lat, lon) * 10) / 10;
        return { ...listing, distanceFromMe };
      })
    );
  }, [userLocation?.latitude, userLocation?.longitude]);

  const addListing = useCallback(async (input: NewListingInput) => {
    const imageUrls = input.imageUrls ?? (input.imageUrl ? [input.imageUrl] : DEFAULT_IMAGES);
    const inserted = await insertListing({
      title: input.title,
      location: input.location,
      price: input.price,
      description: input.description,
      category: input.category,
      amenities: input.amenities,
      imageUrls,
    });
    if (inserted) {
      setListings((prev) => [inserted, ...prev]);
    } else {
      const fallback: Listing = {
        ...input,
        imageUrls,
        category: input.category ?? 'Boutique',
        amenities: input.amenities ?? [],
        distanceFromMe: 0,
        id: `local-${Date.now()}`,
        rating: 5,
        reviewCount: 0,
      };
      setListings((prev) => [fallback, ...prev]);
    }
  }, []);

  const getListingById = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings]
  );

  return (
    <ListingsContext.Provider value={{ listings, isLoading, addListing, getListingById, refreshListings }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
}
