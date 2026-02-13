import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DUMMY_LISTINGS, type Listing } from '@/data/listings';
import { fetchListings, insertListing } from '@/lib/listings';

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

  const refreshListings = useCallback(async () => {
    const fromDb = await fetchListings();
    if (fromDb.length > 0) {
      setListings(fromDb);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

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
