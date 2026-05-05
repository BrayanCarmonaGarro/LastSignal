  //src/services/trip/tripService.ts
  import type {
    TripRecord,
    TripWaypoint,
    TripDangerZone,
    DangerSeverity,
  } from "@/types/trip.types";
  import type { SupplyDrop } from "@/types/supply_drop.types";
  import { apiRequest } from "@/services/api/client";

  export const tripService = {
    // ── Supply Drops ────────────────────────────────────────────────────────────

    getAvailableDrops: (): Promise<SupplyDrop[]> =>
      apiRequest<SupplyDrop[]>("/supply-drops/available"),

    getAllDrops: (): Promise<SupplyDrop[]> =>
      apiRequest<SupplyDrop[]>("/supply-drops"),

    collectDrop: (dropId: string, tripId: string): Promise<SupplyDrop> =>
      apiRequest<SupplyDrop>(`/supply-drops/${dropId}/collect`, {
        method: "POST",
        body: JSON.stringify({ trip_id: tripId }),
      }),

    // ── Trips ────────────────────────────────────────────────────────────────────

    startTrip: (
      initialOxygen: number,
      destination?: string,
    ): Promise<TripRecord> =>
      apiRequest<TripRecord>("/trips", {
        method: "POST",
        body: JSON.stringify({ initial_oxygen: initialOxygen, destination }),
      }),

    updateOxygenConsumed: (
      tripId: string,
      oxygenConsumed: number,
    ): Promise<TripRecord> =>
      apiRequest<TripRecord>(`/trips/${tripId}`, {
        method: "PATCH",
        body: JSON.stringify({ oxygen_consumed: oxygenConsumed }),
      }),

    completeTrip: (tripId: string): Promise<TripRecord> =>
      apiRequest<TripRecord>(`/trips/${tripId}/complete`, { method: "POST" }),

    getActiveTrip: async (): Promise<TripRecord | null> => {
      try {
        const trip = await apiRequest<TripRecord>("/trips/active");
        console.log("[tripService] getActiveTrip:", trip?.id, trip?.status);
        return trip;
      } catch (e) {
        console.log("[tripService] getActiveTrip error:", e);
        return null;
      }
    },

    createDrop: (
      latitude: number,
      longitude: number,
      items: Array<{ base_resource_id: string; amount: number }>,
    ): Promise<SupplyDrop> =>
      apiRequest<SupplyDrop>("/supply-drops", {
        method: "POST",
        body: JSON.stringify({ latitude, longitude, items }),
      }),

    // ── Waypoints & Danger Zones ─────────────────────────────────────────────────

    /** GET /trips/:id/waypoints — waypoints del viaje ordenados por creación */
    getWaypoints: (tripId: string): Promise<TripWaypoint[]> =>
      apiRequest<TripWaypoint[]>(`/trips/${tripId}/waypoints`),

    /** GET /trips/:id/danger-zones — zonas de peligro del viaje */
    getDangerZones: (tripId: string): Promise<TripDangerZone[]> =>
      apiRequest<TripDangerZone[]>(`/trips/${tripId}/danger-zones`),

    /** PATCH /trips/:tripId/waypoints/:waypointId/reach — marca un waypoint como alcanzado */
    markWaypointReached: (
      tripId: string,
      waypointId: string,
    ): Promise<TripWaypoint> =>
      apiRequest<TripWaypoint>(`/trips/${tripId}/waypoints/${waypointId}/reach`, {
        method: "PATCH",
      }),

    /** POST /trips/:id/danger-zones */
    createDangerZone: (
      tripId: string,
      data: {
        latitude: number;
        longitude: number;
        severity: DangerSeverity;
        description: string;
      },
    ): Promise<TripDangerZone> =>
      apiRequest<TripDangerZone>(`/trips/${tripId}/danger-zones`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    /** POST /trips/:id/waypoints */
    createWaypoint: (
      tripId: string,
      data: { latitude: number; longitude: number; name: string | null },
    ): Promise<TripWaypoint> =>
      apiRequest<TripWaypoint>(`/trips/${tripId}/waypoints`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };