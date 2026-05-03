//src/store/tripStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripRecord, TripStatus, Coordinates } from '@/types/trip.types';
import type { SupplyDrop, SupplyDropStatus, SupplyDropItem } from '@/types/supply_drop.types';

export type { TripRecord, TripStatus, Coordinates, SupplyDrop, SupplyDropStatus, SupplyDropItem };

interface OxygenState {
  level: number;
  ratePerSecond: number;
  isConsuming: boolean;
}

interface TripStoreState {
  activeTrip: TripRecord | null;
  supplyDrops: SupplyDrop[];
  lastFetchedAt: string | null;
  routePoints: Coordinates[];
  oxygen: OxygenState;

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
}

export const useTripStore = create<TripStoreState>()(
  persist(
    (set, get) => ({
      activeTrip: null,
      supplyDrops: [],
      lastFetchedAt: null,
      routePoints: [],
      oxygen: {
        level: 100,
        ratePerSecond: 0.05,
        isConsuming: false,
      },

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
    }),
    {
      name: 'last-signal-trip-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        supplyDrops: state.supplyDrops,
        lastFetchedAt: state.lastFetchedAt,
        oxygen: state.oxygen,
        activeTrip: state.activeTrip,
      }),
    }
  )
);
