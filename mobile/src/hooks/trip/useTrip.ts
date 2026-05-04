// src/hooks/trip/useTrip.ts
import { useCallback, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { TripRecord, useTripStore } from "@/store/tripStore";
import { tripService } from "@/services/trip/tripService";
import { offlineQueue } from "@/services/trip/offlineQueue";
import { ensureSupplyDrops } from "@/services/trip/supplyDropService";
import { generateDangerZones } from "@/services/trip/dangerZoneService";
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
  const endInProgress = useRef(false);

  const {
    activeTrip,
    oxygen,
    setActiveTrip,
    markDropCollected,
    updateDrop,
    addRoutePoint,
    setOxygenConsuming,
    setDangerZones,
    clearRoute,
    resetOxygen,
  } = useTripStore();

  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const canStart = !activeTrip && oxygen.level > 20;
  const canEnd = !!activeTrip && activeTrip.status === "ACTIVE";

  // ── Iniciar viaje ──────────────────────────────────────────────────────────
  // src/hooks/trip/useTrip.ts — start()
  const start = useCallback(async () => {
    console.log("[useTrip] Intentando iniciar viaje...");
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

      // Lee del store directamente en lugar del closure
      const currentOxygen = useTripStore.getState().oxygen.level;
      if (currentOxygen <= 20) return;

      const trip = await tripService.startTrip(currentOxygen);
      setActiveTrip(trip);
      setOxygenConsuming(true);

      const locationResult = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationResult.coords;

      await ensureSupplyDrops(latitude, longitude).catch((err) =>
        console.error("[useTrip] Error al generar drops iniciales:", err),
      );

      const zones = await generateDangerZones(
        trip.id,
        latitude,
        longitude,
      ).catch((err) => {
        console.error("[useTrip] Error al generar danger zones:", err);
        return [];
      });
      setDangerZones(zones);

      router.push("/(app)/(tabs)/trips/active");
    } catch (err) {
      console.error("[useTrip] Error al iniciar viaje:", err);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, setActiveTrip, setOxygenConsuming, setDangerZones, router]);
  // ↑ canStart y oxygen.level ya no están en las dependencias

  // ── Finalizar viaje ────────────────────────────────────────────────────────
  const end = useCallback(async () => {
    console.log(
      "[end] llamado — endInProgress:",
      endInProgress.current,
      "activeTrip:",
      activeTrip?.id,
    );
    if (endInProgress.current || !activeTrip) return;
    endInProgress.current = true;
    setIsEnding(true);

    // En end() de useTrip.ts — reemplaza el try block
    try {
      const oxygenConsumed = parseFloat(
        (activeTrip.initial_oxygen - oxygen.level).toFixed(2),
      );
      await tripService.updateOxygenConsumed(activeTrip.id, oxygenConsumed);
      await tripService.completeTrip(activeTrip.id);

      setOxygenConsuming(false);
      // El tripStatus cambia a COMPLETED → index.tsx muestra TripSummaryView automáticamente
      setActiveTrip({ ...activeTrip, status: "COMPLETED" });
      endInProgress.current = false;
    } catch {
      await offlineQueue.enqueueComplete(activeTrip.id, oxygen.level);
      setOxygenConsuming(false);
      setActiveTrip({ ...activeTrip, status: "COMPLETED" });
      endInProgress.current = false;
    } finally {
      setIsEnding(false);
    }
  }, [activeTrip, oxygen.level, setActiveTrip, setOxygenConsuming, router]);

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
        const updatedDrop = await tripService.collectDrop(
          dropId,
          activeTrip.id,
        );
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
