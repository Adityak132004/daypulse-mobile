/**
 * Location utilities: distance calculation (Haversine) and user location hook.
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/** Distance between two points in miles (Haversine formula). */
export function distanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type UserLocation = {
  latitude: number;
  longitude: number;
} | null;

/** Request and track user location. Only requests when user is logged in. */
export function useUserLocation(): {
  location: UserLocation;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [location, setLocation] = useState<UserLocation>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    // On web, geolocation may require HTTPS (except localhost)
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location?.protocol === 'http:' && !window.location?.hostname?.includes('localhost')) {
        setError('Location requires HTTPS');
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLocation(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLocation(null);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get location');
      setLocation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Re-request location when user logs in (auth state changes)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchLocation();
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchLocation]);

  return { location, isLoading, error, refresh: fetchLocation };
}
