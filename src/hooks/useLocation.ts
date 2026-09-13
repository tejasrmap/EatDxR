import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export interface Location {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const detectPosition = async () => {
      // 1. Try Capacitor native Geolocation first (Android / iOS)
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        });
        if (isMounted && pos?.coords) {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLoading(false);
          return;
        }
      } catch (nativeErr) {
        // Fallback to web navigator
      }

      // 2. Fallback to browser navigator.geolocation
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isMounted) {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              setLoading(false);
            }
          },
          (err) => {
            if (isMounted) {
              setError(err.message);
              setLoading(false);
            }
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        if (isMounted) {
          setError('Geolocation is not supported');
          setLoading(false);
        }
      }
    };

    detectPosition();

    return () => {
      isMounted = false;
    };
  }, []);

  return { location, error, loading };
}
