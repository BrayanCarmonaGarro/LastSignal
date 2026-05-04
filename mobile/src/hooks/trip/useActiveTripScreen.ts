// src/hooks/trip/useActiveTripScreen.ts
import { useRef, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";

import { useTrip } from "@/hooks/trip/useTrip";
import { useOxygen } from "@/hooks/trip/useOxygen";
import { useSupplies } from "@/hooks/trip/useSupplies";
import { useTripStore } from "@/store/tripStore";
import { tripService } from "@/services/trip/tripService";
import type { SupplyDrop } from "@/store/tripStore";

export function useActiveTripScreen() {
  const mapRef = useRef<MapView>(null);

  const { canEnd, end, collectDrop, logPosition } = useTrip();
  const oxygen = useOxygen();
  const { supplyDrops } = useSupplies();

  const routePoints = useTripStore((s) => s.routePoints);
  const activeTrip = useTripStore((s) => s.activeTrip);
  const waypoints = useTripStore((s) => s.waypoints);
  const dangerZones = useTripStore((s) => s.dangerZones);
  const setWaypoints = useTripStore((s) => s.setWaypoints);
  const setDangerZones = useTripStore((s) => s.setDangerZones);

  // ── Cargar waypoints y danger zones al montar ─────────────────────────────
  // Siempre fetcha desde el backend — garantiza datos frescos tanto en trips
  // nuevos (donde generateDangerZones ya los creó) como al reabrir la app.
  useEffect(() => {
    if (!activeTrip?.id) return;
    
    tripService
      .getWaypoints(activeTrip.id)
      .then(setWaypoints)
      .catch((err) =>
        console.error("[useActiveTripScreen] Error al cargar waypoints:", err),
      );

    tripService
      .getDangerZones(activeTrip.id)
      .then((zones) => {
        console.log(
          "[useActiveTripScreen] danger zones cargadas:",
          zones.length,
          zones,
        );
        setDangerZones(zones);
      })
      .catch((err) =>
        console.error(
          "[useActiveTripScreen] Error al cargar danger zones:",
          err,
        ),
      );
  }, [activeTrip?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── GPS tracking ──────────────────────────────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // menos agresivo
          distanceInterval: 10, // solo cada 10 metros
          timeInterval: 5000, // mínimo cada 5 segundos
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          logPosition(coords);
          mapRef.current?.animateCamera({ center: coords }, { duration: 800 });
        },
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [logPosition]);

  // ── Alertas de oxígeno ────────────────────────────────────────────────────
  useEffect(() => {
    if (oxygen.oxygenStatus === "critical") {
      Alert.alert(
        "⚠️ OXÍGENO CRÍTICO",
        `Solo quedan ${oxygen.minutesRemaining} minutos. Regresa a la nave inmediatamente.`,
        [{ text: "Entendido" }],
      );
    }
    if (oxygen.oxygenStatus === "empty") {
      Alert.alert(
        "🚨 OXÍGENO AGOTADO",
        "El viaje se ha terminado por seguridad.",
        [{ text: "OK", onPress: end }],
      );
    }
  }, [oxygen.oxygenStatus, oxygen.minutesRemaining, end]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEndTrip = useCallback(() => {
    Alert.alert(
      "Finalizar viaje",
      "¿Seguro que quieres terminar la exploración y regresar a la nave?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Terminar", style: "destructive", onPress: end },
      ],
    );
  }, [end]);

  const handleDropPress = useCallback(
    (drop: SupplyDrop) => {
      if (drop.collected_at) return;
      Alert.alert(
        `Recolectar: ${drop.id}`,
        `Contiene ${drop.items.length} tipo(s) de recurso.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Recolectar ✓", onPress: () => collectDrop(drop.id) },
        ],
      );
    },
    [collectDrop],
  );

  const collectedCount = supplyDrops.filter(
    (d) => d.status === "COLLECTED",
  ).length;

  return {
    mapRef,
    oxygen,
    canEnd,
    routePoints,
    supplyDrops,
    waypoints,
    dangerZones,
    collectedCount,
    totalSupplies: supplyDrops.length,
    handleEndTrip,
    handleDropPress,
  };
}
