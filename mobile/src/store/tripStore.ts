// src/store/tripStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripRecord, TripStatus, Coordinates, TripWaypoint, TripDangerZone } from '@/types/trip.types';
import type { SupplyDrop, SupplyDropStatus, SupplyDropItem } from '@/types/supply_drop.types';

export type { TripRecord, TripStatus, Coordinates, SupplyDrop, SupplyDropStatus, SupplyDropItem, TripWaypoint, TripDangerZone };

interface OxygenState {
  level: number;
  ratePerSecond: number;
  isConsuming: boolean;
}

interface TripStoreState {
  _hasHydrated: boolean;
  activeTrip: TripRecord | null;
  supplyDrops: SupplyDrop[];
  lastFetchedAt: string | null;
  routePoints: Coordinates[];
  oxygen: OxygenState;
  waypoints: TripWaypoint[];
  dangerZones: TripDangerZone[];

  setHasHydrated: (val: boolean) => void;
  setActiveTrip: (trip: TripRecord | null) => void;
  setSupplyDrops: (drops: SupplyDrop[]) => void;
  markDropCollected: (dropId: string, tripId: string) => void;
  updateDrop: (drop: SupplyDrop) => void;
  addRoutePoint: (coords: Coordinates) => void;
  clearRoute: () => void;
  tickOxygen: () => void;
  setOxygenConsuming: (consuming: boolean) => void;
  setOxygenLevel: (level: number) => void;
  resetOxygen: () => void;
  setWaypoints: (waypoints: TripWaypoint[]) => void;
  setDangerZones: (zones: TripDangerZone[]) => void;
  markWaypointReached: (waypointId: string) => void;
}

export const useTripStore = create<TripStoreState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      activeTrip: null,
      supplyDrops: [],
      lastFetchedAt: null,
      routePoints: [],
      waypoints: [],
      dangerZones: [],
      oxygen: {
        level: 100,
        ratePerSecond: 0.05,
        isConsuming: false,
      },

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      setActiveTrip: (trip) => set({ activeTrip: trip }),

      setSupplyDrops: (drops) =>
        set({ supplyDrops: drops, lastFetchedAt: new Date().toISOString() }),

      markDropCollected: (dropId, tripId) =>
        set((state) => ({
          supplyDrops: state.supplyDrops.map((d) =>
            d.id === dropId
              ? {
                  ...d,
                  status: 'COLLECTED' as SupplyDropStatus,
                  trip_id: tripId,
                  collected_at: new Date().toISOString(),
                }
              : d
          ),
        })),

      updateDrop: (drop) =>
        set((state) => ({
          supplyDrops: state.supplyDrops.map((d) =>
            d.id === drop.id ? drop : d
          ),
        })),

      addRoutePoint: (coords) =>
        set((state) => ({ routePoints: [...state.routePoints, coords] })),

      clearRoute: () => set({ routePoints: [] }),

      tickOxygen: () => {
        const { oxygen } = get();
        if (!oxygen.isConsuming) return;
        const newLevel = Math.max(
          0,
          parseFloat((oxygen.level - oxygen.ratePerSecond).toFixed(3))
        );
        set({ oxygen: { ...oxygen, level: newLevel } });
      },

      setOxygenConsuming: (consuming) =>
        set((state) => ({ oxygen: { ...state.oxygen, isConsuming: consuming } })),

      setOxygenLevel: (level) =>
        set((state) => ({ oxygen: { ...state.oxygen, level } })),

      resetOxygen: () =>
        set((state) => ({
          oxygen: { ...state.oxygen, level: 100, isConsuming: false },
        })),

      setWaypoints: (waypoints) => set({ waypoints }),

      setDangerZones: (zones) => set({ dangerZones: zones }),

      markWaypointReached: (waypointId) =>
        set((state) => ({
          waypoints: state.waypoints.map((w) =>
            w.id === waypointId
              ? { ...w, status: 'REACHED' as const, reached_at: new Date().toISOString() }
              : w
          ),
        })),
    }),
    {
      name: 'last-signal-trip-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log("[tripStore rehydration] Loaded state from AsyncStorage:", {
          hasActiveTrip: !!state?.activeTrip,
          dangerZonesCount: state?.dangerZones?.length ?? 0,
          waypointsCount: state?.waypoints?.length ?? 0,
          supplyDropsCount: state?.supplyDrops?.length ?? 0,
        });
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        supplyDrops: state.supplyDrops,
        lastFetchedAt: state.lastFetchedAt,
        oxygen: state.oxygen,
        activeTrip: state.activeTrip,
        dangerZones: state.dangerZones,
        waypoints: state.waypoints,
      }),
    }
  )
);