//src/store/tripStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TripStatus = 'ACTIVE' | 'COMPLETED';
export type SupplyDropStatus = 'AVAILABLE' | 'COLLECTED';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type ResourceCategory = 'VITAL' | 'FOOD' | 'EQUIPMENT' | 'MEDICAL' | 'FUEL';
export type ResourceUnit = 'LITERS' | 'KILOGRAMS' | 'UNITS' | 'PERCENTAGE' | 'GRAMS' | 'CALORIES';

export interface BaseResource {
  id: string;
  name: string;
  category: ResourceCategory;
  unit: ResourceUnit;
  min_threshold: number;
  is_critical: boolean;
}

export interface SupplyDropItem {
  id: string;
  base_resource_id: string;
  amount: number;
  base_resource: BaseResource;
}

export interface SupplyDrop {
  id: string;
  latitude: number;
  longitude: number;
  status: SupplyDropStatus;
  trip_id: string | null;
  collected_by: string | null;
  collected_at: string | null;
  created_at: string;
  items: SupplyDropItem[];
}

export interface TripRecord {
  id: string;
  destination: string | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  initial_oxygen: number;
  oxygen_consumed: number;
  status: TripStatus;
  user_id: string;
}

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
  updateDrop: (drop: SupplyDrop) => void;          // ← nuevo
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