// src/store/tripStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripRecord, TripStatus, Coordinates, TripWaypoint, TripDangerZone } from '@/types/trip.types';
import type { SupplyDrop, SupplyDropStatus, SupplyDropItem } from '@/types/supply_drop.types';

export type { TripRecord, TripStatus, Coordinates, SupplyDrop, SupplyDropStatus, SupplyDropItem, TripWaypoint, TripDangerZone };

// ─── IDs fijos de recursos (del SQL seed) ─────────────────
export const RESOURCE_IDS = {
  OXIGENO:       'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  AGUA:          'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  RACIONES:      'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  COMBUSTIBLE:   'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  BOTIQUIN:      'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  BATERIAS:      'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  PILDORAS_RADIO:'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
} as const;

// ─── Tipos ────────────────────────────────────────────────
export interface TripPackItem {
  base_resource_id: string;
  name: string;
  unit: string;
  amount: number;     // cantidad actual en la mochila
  initial: number;    // cantidad con la que se salió (para calcular gasto)
}

export type DropCostItem = {
  base_resource_id: string;
  name: string;
  unit: string;
  amount: number;
};

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

  // ── tripPack (solo memoria, no persiste) ──────────────────
  tripPack: TripPackItem[];

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

  // ── tripPack actions ──────────────────────────────────────
  setTripPack: (pack: TripPackItem[]) => void;
  /** Descuenta recursos. Retorna false si no hay suficiente. */
  spendTripResource: (base_resource_id: string, amount: number) => boolean;
  drainTripOxygen: (amount: number) => void;
  clearTripPack: () => void;
  getTripPackResource: (base_resource_id: string) => TripPackItem | undefined;
}

// ─── LÓGICA DE COSTO ──────────────────────────────────────
// Se calcula en cliente, nunca se guarda en DB.
// Tier según cantidad de items del drop:
//   Bajo  (1 item)  → 1 recurso no-vital, cantidad baja
//   Medio (2 items) → 2 recursos no-vitales, cantidad media
//   Alto  (3 items) → 3 recursos no-vitales, cantidad alta

const COST_POOL = [
  { base_resource_id: RESOURCE_IDS.BATERIAS,       name: 'Baterías',       unit: 'UNITS' },
  { base_resource_id: RESOURCE_IDS.BOTIQUIN,       name: 'Botiquín',       unit: 'UNITS' },
  { base_resource_id: RESOURCE_IDS.COMBUSTIBLE,    name: 'Combustible',    unit: 'LITERS' },
  { base_resource_id: RESOURCE_IDS.PILDORAS_RADIO, name: 'Píldoras Radio', unit: 'UNITS' },
  { base_resource_id: RESOURCE_IDS.AGUA,           name: 'Agua',           unit: 'LITERS' },
  { base_resource_id: RESOURCE_IDS.RACIONES,       name: 'Raciones',       unit: 'CALORIES' },
];

const COST_AMOUNTS: Record<'LOW' | 'MED' | 'HIGH', Record<string, number>> = {
  LOW:  { UNITS: 1,   LITERS: 2,   CALORIES: 200 },
  MED:  { UNITS: 2,   LITERS: 4,   CALORIES: 400 },
  HIGH: { UNITS: 3,   LITERS: 6,   CALORIES: 800 },
};

function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) / 2147483647;
}

export function computeDropCost(itemCount: number, dropId: string): DropCostItem[] {
  const tier = itemCount <= 1 ? 'LOW' : itemCount === 2 ? 'MED' : 'HIGH';
  const count = (Math.floor(seededRandom(dropId, 0) * 3) + 1); // 1, 2 o 3 — fijo por drop

  // Shuffle determinístico basado en el ID del drop
  const shuffled = [...COST_POOL].sort((a, b) => {
    return seededRandom(dropId + a.base_resource_id, 1) - seededRandom(dropId + b.base_resource_id, 2);
  });

  return shuffled.slice(0, count).map((r) => ({
    ...r,
    amount: COST_AMOUNTS[tier][r.unit] ?? 1,
  }));
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
      tripPack: [],   // ← no persiste (ver partialize abajo)
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
              ? { ...d, status: 'COLLECTED' as SupplyDropStatus, trip_id: tripId, collected_at: new Date().toISOString() }
              : d
          ),
        })),

      updateDrop: (drop) =>
        set((state) => ({
          supplyDrops: state.supplyDrops.map((d) => (d.id === drop.id ? drop : d)),
        })),

      addRoutePoint: (coords) =>
        set((state) => ({ routePoints: [...state.routePoints, coords] })),

      clearRoute: () => set({ routePoints: [] }),

      tickOxygen: () => {
        const { oxygen } = get();
        if (!oxygen.isConsuming) return;
        const newLevel = Math.max(0, parseFloat((oxygen.level - oxygen.ratePerSecond).toFixed(3)));
        set({ oxygen: { ...oxygen, level: newLevel } });
      },

      setOxygenConsuming: (consuming) =>
        set((state) => ({ oxygen: { ...state.oxygen, isConsuming: consuming } })),

      setOxygenLevel: (level) =>
        set((state) => ({ oxygen: { ...state.oxygen, level } })),

      resetOxygen: () =>
        set((state) => ({ oxygen: { ...state.oxygen, level: 100, isConsuming: false } })),

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

      // ── tripPack ────────────────────────────────────────────
      setTripPack: (pack) => set({ tripPack: pack }),

      spendTripResource: (base_resource_id, amount) => {
        const { tripPack } = get();
        const item = tripPack.find((r) => r.base_resource_id === base_resource_id);
        if (!item || item.amount < amount) return false;

        set({
          tripPack: tripPack.map((r) =>
            r.base_resource_id === base_resource_id
              ? { ...r, amount: parseFloat((r.amount - amount).toFixed(3)) }
              : r
          ),
        });
        return true;
      },

      drainTripOxygen: (amount) => {
        const { tripPack } = get();
        set({
          tripPack: tripPack.map((r) =>
            r.base_resource_id === RESOURCE_IDS.OXIGENO
              ? { ...r, amount: Math.max(0, parseFloat((r.amount - amount).toFixed(3))) }
              : r
          ),
        });
      },

      clearTripPack: () => set({ tripPack: [] }),

      getTripPackResource: (base_resource_id) => {
        return get().tripPack.find((r) => r.base_resource_id === base_resource_id);
      },
    }),
    {
      name: 'last-signal-trip-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        supplyDrops: state.supplyDrops,
        lastFetchedAt: state.lastFetchedAt,
        oxygen: state.oxygen,
        activeTrip: state.activeTrip,
        dangerZones: state.dangerZones,
        waypoints: state.waypoints,
        // tripPack NO se incluye → nunca persiste en AsyncStorage
      }),
    }
  )
);