// src/hooks/trip/useOxygen.ts
import { useEffect, useRef, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';

const TICK_INTERVAL_MS = 1000; // 1 segundo
const CRITICAL_THRESHOLD = 15; // % para alerta crítica
const WARNING_THRESHOLD = 30;  // % para alerta de advertencia

export type OxygenStatus = 'safe' | 'warning' | 'critical' | 'empty';

export interface UseOxygenReturn {
  level: number;
  oxygenStatus: OxygenStatus;
  isConsuming: boolean;
  minutesRemaining: number;
  startConsuming: () => void;
  stopConsuming: () => void;
  refill: (amount: number) => void;
}

export function useOxygen(): UseOxygenReturn {
  const { oxygen, tickOxygen, setOxygenConsuming, setOxygenLevel, activeTrip } =
  useTripStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calcular minutos restantes basados en el nivel actual y la tasa
  const minutesRemaining = Math.floor(
    oxygen.level / (oxygen.ratePerSecond * 60)
  );

  const oxygenStatus: OxygenStatus =
    oxygen.level <= 0
      ? 'empty'
      : oxygen.level <= CRITICAL_THRESHOLD
        ? 'critical'
        : oxygen.level <= WARNING_THRESHOLD
          ? 'warning'
          : 'safe';

  // Arrancar el intervalo cuando el viaje está activo
  useEffect(() => {
    if (activeTrip?.status === 'ACTIVE' && oxygen.isConsuming) {
      intervalRef.current = setInterval(() => {
        tickOxygen();
      }, TICK_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTrip?.status, oxygen.isConsuming, tickOxygen]);

  const startConsuming = useCallback(() => {
    setOxygenConsuming(true);
  }, [setOxygenConsuming]);

  const stopConsuming = useCallback(() => {
    setOxygenConsuming(false);
  }, [setOxygenConsuming]);

  const refill = useCallback(
    (amount: number) => {
      setOxygenLevel(Math.min(100, oxygen.level + amount));
    },
    [setOxygenLevel, oxygen.level]
  );

  return {
    level: oxygen.level,
    oxygenStatus,
    isConsuming: oxygen.isConsuming,
    minutesRemaining,
    startConsuming,
    stopConsuming,
    refill,
  };
}