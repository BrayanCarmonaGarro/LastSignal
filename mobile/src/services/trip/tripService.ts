//src/services/trip/tripService.ts
import type { TripRecord } from "@/types/trip.types";
import type { SupplyDrop } from "@/types/supply_drop.types";
import { apiRequest } from "@/services/api/client";
export const tripService = {
  // ── Supply Drops ────────────────────────────────────────────────────────────

  /** GET /supply-drops/available — suministros disponibles con GPS */
  getAvailableDrops: (): Promise<SupplyDrop[]> =>
    apiRequest<SupplyDrop[]>("/supply-drops/available"),

  /** GET /supply-drops — todos (disponibles + recolectados) */
  getAllDrops: (): Promise<SupplyDrop[]> =>
    apiRequest<SupplyDrop[]>("/supply-drops"),

  /**
   * POST /supply-drops/:id/collect
   * Marca un suministro como recolectado y lo asocia al viaje activo.
   */
  collectDrop: (dropId: string, tripId: string): Promise<SupplyDrop> =>
    apiRequest<SupplyDrop>(`/supply-drops/${dropId}/collect`, {
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
    apiRequest<TripRecord>("/trips", {
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
    apiRequest<TripRecord>(`/trips/${tripId}`, {
      method: "PATCH",
      body: JSON.stringify({ oxygen_consumed: oxygenConsumed }),
    }),

  /**
   * POST /trips/:id/complete — cierra el viaje.
   * El backend pone status=COMPLETED y ended_at=now().
   */
  completeTrip: (tripId: string): Promise<TripRecord> =>
    apiRequest<TripRecord>(`/trips/${tripId}/complete`, { method: "POST" }),

  /** GET /trips/active — recupera el viaje activo si existe (útil al reabrir la app) */
  getActiveTrip: async (): Promise<TripRecord | null> => {
    try {
      return await apiRequest<TripRecord>("/trips/active");
    } catch {
      return null;
    }
  },

  createDrop: (
    latitude: number,
    longitude: number,
    items: Array<{ base_resource_id: string; amount: number }>, // ← cambiado
  ): Promise<SupplyDrop> =>
    apiRequest<SupplyDrop>("/supply-drops", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, items }),
    }),
};
