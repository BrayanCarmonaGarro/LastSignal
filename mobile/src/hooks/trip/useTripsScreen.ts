// src/hooks/trip/useTripsScreen.ts
import { useRef, useState, useCallback, useEffect } from "react";
import MapView from "react-native-maps";
import * as Location from "expo-location";

import { useTrip } from "@/hooks/trip/useTrip";
import { useOxygen } from "@/hooks/trip/useOxygen";
import { useSupplies } from "@/hooks/trip/useSupplies";
import { tripService } from "@/services/trip/tripService";
import { useTripStore } from "@/store/tripStore";
import type { SupplyDrop } from "@/store/tripStore";

type TabView = "map" | "list";

export function useTripsScreen() {
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>("map");

  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const markDropCollected = useTripStore((s) => s.markDropCollected);

  const { activeTrip, canStart, start, end } = useTrip();
  const oxygen = useOxygen();
  const supplies = useSupplies();

  useEffect(() => {
    tripService
      .getActiveTrip()
      .then((trip) => setActiveTrip(trip))
      .catch(() => setActiveTrip(null));
  }, [setActiveTrip]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const handleDropPress = useCallback((drop: SupplyDrop) => {
    setActiveTab("map");
    setTimeout(() => {
      mapRef.current?.animateCamera(
        {
          center: { latitude: drop.latitude, longitude: drop.longitude },
          zoom: 16,
        },
        { duration: 700 },
      );
    }, 50);
  }, []);

  const handleCollect = useCallback(
    async (supply: SupplyDrop) => {
      if (!activeTrip?.id) return;
      markDropCollected(supply.id, activeTrip.id);
      try {
        await tripService.collectDrop(supply.id, activeTrip.id);
      } catch {
        supplies.refresh();
      }
    },
    [activeTrip, markDropCollected, supplies],
  );

  return {
    mapRef,
    userLocation,
    activeTab,
    setActiveTab,
    handleDropPress,
    handleCollect,
    handleStartTrip: start,
    handleEndTrip: end,
    tripStatus: activeTrip?.status ?? null,
    canStart,
    oxygen,
    supplies,
  };
}
