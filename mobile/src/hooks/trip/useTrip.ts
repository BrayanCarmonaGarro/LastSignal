// src/hooks/trip/useTrip.ts
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { TripRecord, useTripStore } from "@/store/tripStore";
import { tripService } from "@/services/trip/tripService";
import { offlineQueue } from "@/services/trip/offlineQueue";
import { ensureSupplyDrops } from "@/services/trip/supplyDropService";
import * as Location from "expo-location";

export interface UseTripReturn {
  activeTrip: TripRecord | null;
  isStarting: boolean;
  isEnding: boolean;
  canStart: boolean;
  canEnd: boolean;
  start: () => Promise<void>;
  end: () => Promise<void>;
  completeReturn: () => Promise<void>;
  collectDrop: (dropId: string) => Promise<void>;
  logPosition: (coords: { latitude: number; longitude: number }) => void;
}

export function useTrip(): UseTripReturn {
  const router = useRouter();
  const {
    activeTrip,
    oxygen,
    setActiveTrip,
    markDropCollected,
    updateDrop,
    addRoutePoint,
    setOxygenConsuming,
    clearRoute,
    resetOxygen,
  } = useTripStore();

  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const canStart = !activeTrip && oxygen.level > 20;
  const canEnd = !!activeTrip && activeTrip.status === "ACTIVE";

  // ── Iniciar viaje ──────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    console.log("ACTIVE TRIP:", activeTrip);
    if (isStarting) return;
    setIsStarting(true);

    try {
      const existingTrip = await tripService.getActiveTrip();

      if (existingTrip) {
        console.log("[useTrip] Usando viaje activo existente");
        setActiveTrip(existingTrip);
        setOxygenConsuming(true);

        const locationResult = await Location.getCurrentPositionAsync({});
        await ensureSupplyDrops(
          locationResult.coords.latitude,
          locationResult.coords.longitude,
        ).catch((err) =>
          console.error("[useTrip] Error al generar drops iniciales:", err),
        );

        router.push("/(app)/(tabs)/trips/active");
        return;
      }

      if (!canStart) return;

      const trip = await tripService.startTrip(oxygen.level);
      setActiveTrip(trip);
      setOxygenConsuming(true);

      const locationResult = await Location.getCurrentPositionAsync({});
      await ensureSupplyDrops(
        locationResult.coords.latitude,
        locationResult.coords.longitude,
      ).catch((err) =>
        console.error("[useTrip] Error al generar drops iniciales:", err),
      );

      router.push("/(app)/(tabs)/trips/active");
    } catch (err) {
      console.error("[useTrip] Error al iniciar viaje:", err);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, [
    isStarting,
    canStart,
    oxygen.level,
    setActiveTrip,
    setOxygenConsuming,
    router,
  ]);

  // ── Finalizar viaje (llega a la nave) ─────────────────────────────────────
  const end = useCallback(async () => {
    if (!canEnd || isEnding || !activeTrip) return;
    setIsEnding(true);
    try {
      const oxygenConsumed = parseFloat(
        (activeTrip.initial_oxygen - oxygen.level).toFixed(2),
      );

      // 1. Actualiza oxígeno consumido
      await tripService.updateOxygenConsumed(activeTrip.id, oxygenConsumed);
      // 2. Completa el viaje en el backend
      const completed = await tripService.completeTrip(activeTrip.id);

      setActiveTrip(completed);
      setOxygenConsuming(false);
      router.push("/(app)/(tabs)/trips/summary");
    } catch (err) {
      // Sin conexión: encolar para cuando vuelva
      await offlineQueue.enqueueComplete(activeTrip.id, oxygen.level);
      setOxygenConsuming(false);
      router.push("/(app)/(tabs)/trips/summary");
    } finally {
      setIsEnding(false);
    }
  }, [
    canEnd,
    isEnding,
    activeTrip,
    oxygen.level,
    setActiveTrip,
    setOxygenConsuming,
    router,
  ]);

  

  // ── Confirmar regreso y limpiar estado ────────────────────────────────────
  const completeReturn = useCallback(async () => {
    setActiveTrip(null);
    clearRoute();
    resetOxygen();
    router.replace("/(app)/(tabs)/trips");
  }, [setActiveTrip, clearRoute, resetOxygen, router]);

  // ── Recolectar suministro ─────────────────────────────────────────────────
  const collectDrop = useCallback(
      async (dropId: string) => {
        if (!activeTrip) return;

        markDropCollected(dropId, activeTrip.id);

        try {
          const updatedDrop = await tripService.collectDrop(dropId, activeTrip.id);
          updateDrop(updatedDrop);
        } catch {
          await offlineQueue.enqueueCollect(dropId, activeTrip.id);
        }
      },
      [activeTrip, markDropCollected, updateDrop],
    );

  const logPosition = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      addRoutePoint(coords);
    },
    [addRoutePoint],
  );

  return {
    activeTrip,
    isStarting,
    isEnding,
    canStart,
    canEnd,
    start,
    end,
    completeReturn,
    collectDrop,
    logPosition,
  };
}
