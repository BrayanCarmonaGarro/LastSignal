// src/hooks/trip/useTrip.ts
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { TripRecord, useTripStore, RESOURCE_IDS } from "@/store/tripStore";
import { tripService } from "@/services/trip/tripService";
import { resourcesApi } from "@/services/api/resources.api";
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
  const {
    activeTrip,
    oxygen,
    tripPack,
    setActiveTrip,
    setSupplyDrops,
    markDropCollected,
    updateDrop,
    addRoutePoint,
    setOxygenConsuming,
    clearRoute,
    resetOxygen,
    clearTripPack,
    setDangerZones,
  } = useTripStore();

  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // canStart es reactivo (para habilitar/deshabilitar el botón en UI)
  const oxygenForCanStart =
    tripPack.length > 0
      ? (tripPack.find((r) => r.base_resource_id === RESOURCE_IDS.OXIGENO)
          ?.amount ?? 0)
      : oxygen.level;
  const canStart = !activeTrip && oxygenForCanStart > 20;
  const canEnd = !!activeTrip && activeTrip.status === "ACTIVE";

  // ── Transferir tripPack al inventario (retorno exitoso) ──────
  const transferTripPackToInventory = useCallback(
    async (tripId: string) => {
      const currentPack = useTripStore.getState().tripPack;
      if (currentPack.length === 0) return;

      try {
        const inventory = await resourcesApi.getAll();

        await Promise.allSettled(
          currentPack.map((packItem) => {
            const invItem = inventory.find(
              (r) => r.id === packItem.base_resource_id,
            );
            if (!invItem || packItem.amount <= 0) return Promise.resolve();

            return resourcesApi.addLog(
              invItem.id,
              "INTAKE",
              packItem.amount,
              "Retorno de viaje — recursos no gastados",
              tripId,
            );
          }),
        );
      } catch (err) {
        console.error(
          "[useTrip] Error al transferir tripPack al inventario:",
          err,
        );
      }
    },
    [], // sin dependencias — lee siempre fresco del store
  );

  // ── Descartar tripPack (pérdida por O₂ agotado) ─────────────
  const discardTripPack = useCallback(
    async (tripId: string) => {
      const currentPack = useTripStore.getState().tripPack;
      if (currentPack.length === 0) return;

      try {
        const inventory = await resourcesApi.getAll();

        await Promise.allSettled(
          currentPack.map((packItem) => {
            const invItem = inventory.find(
              (r) => r.id === packItem.base_resource_id,
            );
            if (!invItem) return Promise.resolve();

            const lost = packItem.initial - packItem.amount;
            if (lost <= 0) return Promise.resolve();

            return resourcesApi.addLog(
              invItem.id,
              "CONSUMPTION",
              lost,
              "Pérdida por O₂ agotado en viaje",
              tripId,
            );
          }),
        );
      } catch (err) {
        console.error("[useTrip] Error al registrar pérdida de recursos:", err);
      }
    },
    [], // sin dependencias — lee siempre fresco del store
  );

  const start = useCallback(async () => {
    console.log("[useTrip] start() ejecutado - isStarting:", isStarting);
    if (isStarting) return;
    setIsStarting(true);

    // Leer del store en el momento de ejecutar, no del closure
    const currentPack = useTripStore.getState().tripPack;
    const hasTripPack = currentPack.length > 0;
    const oxygenLevel = hasTripPack
      ? (currentPack.find((r) => r.base_resource_id === RESOURCE_IDS.OXIGENO)
          ?.amount ?? 0)
      : useTripStore.getState().oxygen.level;

    console.log(
      "[useTrip] oxygenLevel calculado:",
      oxygenLevel,
      "| hasTripPack:",
      hasTripPack,
    );

    try {
      console.log("[useTrip] llamando getActiveTrip...");
      const existingTrip = await tripService.getActiveTrip();

      if (existingTrip) {
        setActiveTrip(existingTrip);
        setOxygenConsuming(true);

        const locationResult = await Location.getCurrentPositionAsync({});
        const drops = await ensureSupplyDrops(
          locationResult.coords.latitude,
          locationResult.coords.longitude,
        ).catch(() => []);
        setSupplyDrops(drops);

        const zones = await tripService
          .getDangerZones(existingTrip.id)
          .catch(() => []);
        setDangerZones(zones);

        router.push("/(app)/(tabs)/trips/active");
        return;
      }

      if (oxygenLevel <= 20) {
        setIsStarting(false); // ← sin esto se queda bloqueado para siempre
        return;
      }

      const trip = await tripService.startTrip(oxygenLevel);
      setActiveTrip(trip);
      setOxygenConsuming(true);

      const locationResult = await Location.getCurrentPositionAsync({});

      const drops = await ensureSupplyDrops(
        locationResult.coords.latitude,
        locationResult.coords.longitude,
      ).catch(() => []);
      setSupplyDrops(drops);

      const zones = await generateDangerZones(
        trip.id,
        locationResult.coords.latitude,
        locationResult.coords.longitude,
      ).catch(() => []);
      setDangerZones(zones);

      router.push("/(app)/(tabs)/trips/active");
    } catch (err) {
      console.error("[useTrip] Error al iniciar viaje:", err);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, [
    isStarting,
    setActiveTrip,
    setSupplyDrops,
    setOxygenConsuming,
    setDangerZones,
    router,
  ]);

  const end = useCallback(async () => {
    if (!canEnd || isEnding || !activeTrip) return;
    setIsEnding(true);

    // Leer del store en el momento de ejecutar, no del closure
    const currentPack = useTripStore.getState().tripPack;
    const hasTripPack = currentPack.length > 0;
    const oxygenLevel = hasTripPack
      ? (currentPack.find((r) => r.base_resource_id === RESOURCE_IDS.OXIGENO)
          ?.amount ?? 0)
      : useTripStore.getState().oxygen.level;

    try {
      const oxygenConsumed = parseFloat(
        (activeTrip.initial_oxygen - oxygenLevel).toFixed(2),
      );
      await tripService.updateOxygenConsumed(activeTrip.id, oxygenConsumed);

      await transferTripPackToInventory(activeTrip.id);

      const completed = await tripService.completeTrip(activeTrip.id);
      setActiveTrip(completed);
      setOxygenConsuming(false);
      clearTripPack();

      router.push("/(app)/(tabs)/trips/summary");
    } catch (err) {
      await offlineQueue.enqueueComplete(activeTrip.id, oxygenLevel);
      setOxygenConsuming(false);
      clearTripPack();
      router.push("/(app)/(tabs)/trips/summary");
    } finally {
      setIsEnding(false);
    }
  }, [
    canEnd,
    isEnding,
    activeTrip,
    transferTripPackToInventory,
    setActiveTrip,
    setOxygenConsuming,
    clearTripPack,
    router,
  ]);

  const completeReturn = useCallback(async () => {
    setActiveTrip(null);
    clearRoute();
    resetOxygen();
    clearTripPack();
    router.replace("/(app)/(tabs)/trips");
  }, [setActiveTrip, clearRoute, resetOxygen, clearTripPack, router]);

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
