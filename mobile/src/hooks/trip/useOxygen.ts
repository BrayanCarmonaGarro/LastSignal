// src/hooks/trip/useOxygen.ts
import { useEffect, useRef, useCallback } from "react";
import { useTripStore, RESOURCE_IDS } from "@/store/tripStore";

const TICK_INTERVAL_MS = 1000;
const CRITICAL_THRESHOLD = 15;
const WARNING_THRESHOLD = 30;
const O2_DRAIN_PER_SECOND = 0.05; // % por segundo — ajustá este valor a tu gusto

export type OxygenStatus = "safe" | "warning" | "critical" | "empty";

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
  const activeTrip = useTripStore((s) => s.activeTrip);
  const tripPack = useTripStore((s) => s.tripPack);
  const drainTripOxygen = useTripStore((s) => s.drainTripOxygen);
  const getTripPackResource = useTripStore((s) => s.getTripPackResource);

  // ── Fallback al oxygen del store para cuando no hay tripPack ──
  const oxygen = useTripStore((s) => s.oxygen);
  const setOxygenConsuming = useTripStore((s) => s.setOxygenConsuming);
  const setOxygenLevel = useTripStore((s) => s.setOxygenLevel);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fuente de verdad del O₂ ───────────────────────────────────
  // Si hay tripPack cargado, el nivel viene de ahí.
  // Si no (fuera de viaje o antes de equiparse), viene del store legacy.
  const oxygenInPack = getTripPackResource(RESOURCE_IDS.OXIGENO);

  // Solo consideramos que hay tripPack válido si el oxígeno ya está cargado en él
  const hasTripPack = tripPack.length > 0 && oxygenInPack !== undefined;

  const level = hasTripPack ? oxygenInPack!.amount : oxygen.level;

  const isConsuming = hasTripPack
    ? activeTrip?.status === "ACTIVE"
    : oxygen.isConsuming;

  // ── Derivados ─────────────────────────────────────────────────
  const minutesRemaining = Math.floor(level / (O2_DRAIN_PER_SECOND * 60));

  const oxygenStatus: OxygenStatus =
    level <= 0
      ? "empty"
      : level <= CRITICAL_THRESHOLD
        ? "critical"
        : level <= WARNING_THRESHOLD
          ? "warning"
          : "safe";

  // ── Tick ──────────────────────────────────────────────────────
  useEffect(() => {
    // No arrancar si el nivel ya es 0 al montar — evita falso empty al inicio
    if (level <= 0 && !hasTripPack) return;

    const shouldConsume = activeTrip?.status === "ACTIVE" && isConsuming;

    if (shouldConsume) {
      intervalRef.current = setInterval(() => {
        if (hasTripPack) {
          drainTripOxygen(O2_DRAIN_PER_SECOND);
        } else {
          useTripStore.getState().tickOxygen();
        }
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
  }, [activeTrip?.status, isConsuming, hasTripPack, level]);

  // ── Acciones ──────────────────────────────────────────────────
  // Estas siguen existiendo para compatibilidad con el resto del código
  const startConsuming = useCallback(() => {
    if (!hasTripPack) setOxygenConsuming(true);
  }, [hasTripPack, setOxygenConsuming]);

  const stopConsuming = useCallback(() => {
    if (!hasTripPack) setOxygenConsuming(false);
  }, [hasTripPack, setOxygenConsuming]);

  const refill = useCallback(
    (amount: number) => {
      if (!hasTripPack) {
        setOxygenLevel(Math.min(100, level + amount));
      }
      // Con tripPack, el refill se haría via spendTripResource negativo —
      // no es un caso de uso por ahora
    },
    [hasTripPack, setOxygenLevel, level],
  );

  return {
    level,
    oxygenStatus,
    isConsuming,
    minutesRemaining,
    startConsuming,
    stopConsuming,
    refill,
  };
}
