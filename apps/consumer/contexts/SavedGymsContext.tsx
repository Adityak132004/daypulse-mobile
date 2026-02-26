import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  addSavedListing,
  getSavedListingIds,
  removeSavedListing,
} from '@/lib/saved-gyms';
import { supabase } from '@/lib/supabase';

type SavedGymsContextValue = {
  savedIds: Set<string>;
  isLoading: boolean;
  refreshSaved: () => Promise<void>;
  toggleSaved: (listingId: string) => Promise<void>;
  isSaved: (listingId: string) => boolean;
};

const SavedGymsContext = createContext<SavedGymsContextValue | null>(null);

export function SavedGymsProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refreshSaved = useCallback(async () => {
    setIsLoading(true);
    const ids = await getSavedListingIds();
    setSavedIds(new Set(ids));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshSaved();
    });
    return () => subscription.unsubscribe();
  }, [refreshSaved]);

  const toggleSaved = useCallback(
    async (listingId: string) => {
      const current = new Set(savedIds);
      if (current.has(listingId)) {
        current.delete(listingId);
        setSavedIds(new Set(current));
        const ok = await removeSavedListing(listingId);
        if (!ok) setSavedIds(new Set(savedIds));
      } else {
        current.add(listingId);
        setSavedIds(new Set(current));
        const ok = await addSavedListing(listingId);
        if (!ok) setSavedIds(new Set(savedIds));
      }
    },
    [savedIds]
  );

  const isSaved = useCallback(
    (listingId: string) => savedIds.has(listingId),
    [savedIds]
  );

  return (
    <SavedGymsContext.Provider
      value={{
        savedIds,
        isLoading,
        refreshSaved,
        toggleSaved,
        isSaved,
      }}>
      {children}
    </SavedGymsContext.Provider>
  );
}

export function useSavedGyms() {
  const ctx = useContext(SavedGymsContext);
  if (!ctx) throw new Error('useSavedGyms must be used within SavedGymsProvider');
  return ctx;
}
