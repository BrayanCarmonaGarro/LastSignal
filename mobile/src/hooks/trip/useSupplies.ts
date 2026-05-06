import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SupplyDrop, useTripStore } from '@/store/tripStore';
import { tripService } from '@/services/trip/tripService';

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_NEARBY_RADIUS_KM = 2;

// Haversine: distancia en km entre dos coordenadas
function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseSuppliesOptions {
  userLocation?: { latitude: number; longitude: number } | null;
  nearbyRadiusKm?: number;
}

export interface UseSuppliesReturn {
  supplyDrops: SupplyDrop[];
  availableDrops: SupplyDrop[];
  collectedDrops: SupplyDrop[];
  nearbyDrops: SupplyDrop[];         // ← nuevo
  isLoading: boolean;
  isOffline: boolean;
  isStale: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSupplies(options: UseSuppliesOptions = {}): UseSuppliesReturn {
  const {
    userLocation = null,
    nearbyRadiusKm = DEFAULT_NEARBY_RADIUS_KM,
  } = options;

  const { supplyDrops, lastFetchedAt, setSupplyDrops } = useTripStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStale =
    !lastFetchedAt ||
    Date.now() - new Date(lastFetchedAt).getTime() > CACHE_TTL_MS;

  const fetchDrops = useCallback(async () => {
    const netState = await NetInfo.fetch();
    const online = netState.isConnected && netState.isInternetReachable;

    if (!online) {
      setIsOffline(true);
      return;
    }

    setIsOffline(false);
    setIsLoading(true);
    setError(null);

    try {
      const data = await tripService.getAllDrops();
      setSupplyDrops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar suministros');
    } finally {
      setIsLoading(false);
    }
  }, [setSupplyDrops]);

  useEffect(() => {
    if (isStale) fetchDrops();
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOffline(!online);
      if (online && isStale) fetchDrops();
    });
    return unsub;
  }, [isStale, fetchDrops]);

  const availableDrops = supplyDrops.filter((d) => d.status === 'AVAILABLE');
  const collectedDrops = supplyDrops.filter((d) => d.status === 'COLLECTED');

  // Si no hay ubicación aún, nearbyDrops muestra todos los disponibles
  // para no mostrar lista vacía mientras carga el GPS
  const nearbyDrops = userLocation
    ? availableDrops.filter((d) =>
        getDistanceKm(
          userLocation.latitude, userLocation.longitude,
          d.latitude, d.longitude
        ) <= nearbyRadiusKm
      )
    : availableDrops;

  return {
    supplyDrops,
    availableDrops,
    collectedDrops,
    nearbyDrops,
    isLoading,
    isOffline,
    isStale,
    error,
    refresh: fetchDrops,
  };
}