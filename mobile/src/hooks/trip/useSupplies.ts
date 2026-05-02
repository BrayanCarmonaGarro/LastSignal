// src/hooks/trip/useSupplies.ts
import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SupplyDrop, useTripStore } from '@/store/tripStore';
import { tripService } from '@/services/trip/tripService';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export interface UseSuppliesReturn {
  supplyDrops: SupplyDrop[];
  availableDrops: SupplyDrop[];
  collectedDrops: SupplyDrop[];
  isLoading: boolean;
  isOffline: boolean;
  isStale: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSupplies(): UseSuppliesReturn {
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
      return; // Usar caché
    }

    setIsOffline(false);
    setIsLoading(true);
    setError(null);

    try {
      // Trae todos para mostrar también los ya recolectados en el mapa
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

  return {
    supplyDrops,
    availableDrops: supplyDrops.filter((d) => d.status === 'AVAILABLE'),
    collectedDrops: supplyDrops.filter((d) => d.status === 'COLLECTED'),
    isLoading,
    isOffline,
    isStale,
    error,
    refresh: fetchDrops,
  };
}