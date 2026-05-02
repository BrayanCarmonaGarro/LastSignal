//src/services/trip/tripService.ts
import type { SupplyDrop, TripRecord } from "@/store/tripStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const API_PREFIX = "/api/v1";

import { useAuthStore } from "@/store/authStore";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${API_PREFIX}${path}`;

  const tokens = useAuthStore.getState().tokens;

  //console.log('Para mostrar el token en consola (solo para desarrollo):', tokens);
  //console.log(`[API] ${options?.method ?? 'GET'} ${url} (auth: ${!!tokens?.accessToken})`);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(tokens?.accessToken && {
        Authorization: `Bearer ${tokens.accessToken}`,
      }),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
export const tripService = {
  // ── Supply Drops ────────────────────────────────────────────────────────────

  /** GET /supply-drops/available — suministros disponibles con GPS */
  getAvailableDrops: (): Promise<SupplyDrop[]> =>
    request<SupplyDrop[]>("/supply-drops/available"),

  /** GET /supply-drops — todos (disponibles + recolectados) */
  getAllDrops: (): Promise<SupplyDrop[]> =>
    request<SupplyDrop[]>("/supply-drops"),

  /**
   * POST /supply-drops/:id/collect
   * Marca un suministro como recolectado y lo asocia al viaje activo.
   */
  collectDrop: (dropId: string, tripId: string): Promise<SupplyDrop> =>
    request<SupplyDrop>(`/supply-drops/${dropId}/collect`, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId }),
    }),

  // ── Trips ────────────────────────────────────────────────────────────────────

  /**
   * POST /trips — inicia un nuevo viaje.
   * initial_oxygen es el nivel actual (0–100).
   */
  startTrip: (
    initialOxygen: number,
    destination?: string,
  ): Promise<TripRecord> =>
    request<TripRecord>("/trips", {
      method: "POST",
      body: JSON.stringify({ initial_oxygen: initialOxygen, destination }),
    }),

  /**
   * PATCH /trips/:id — actualiza el oxígeno consumido durante el viaje.
   * Llamar periódicamente o al finalizar.
   */
  updateOxygenConsumed: (
    tripId: string,
    oxygenConsumed: number,
  ): Promise<TripRecord> =>
    request<TripRecord>(`/trips/${tripId}`, {
      method: "PATCH",
      body: JSON.stringify({ oxygen_consumed: oxygenConsumed }),
    }),

  /**
   * POST /trips/:id/complete — cierra el viaje.
   * El backend pone status=COMPLETED y ended_at=now().
   */
  completeTrip: (tripId: string): Promise<TripRecord> =>
    request<TripRecord>(`/trips/${tripId}/complete`, { method: "POST" }),

  /** GET /trips/active — recupera el viaje activo si existe (útil al reabrir la app) */
  getActiveTrip: async (): Promise<TripRecord | null> => {
    try {
      return await request<TripRecord>("/trips/active");
    } catch {
      return null;
    }
  },

  createDrop: (
    latitude: number,
    longitude: number,
    items: Array<{ base_resource_id: string; amount: number }>, // ← cambiado
  ): Promise<SupplyDrop> =>
    request<SupplyDrop>("/supply-drops", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, items }),
    }),
};
