// src/services/trip/waypointService.ts
import { tripService } from '@/services/trip/tripService';
import type { TripWaypoint } from '@/types/trip.types';

// ─── Constantes ──────────────────────────────────────────────────────────────

const MAX_WAYPOINTS_PER_TRIP = 10;

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Crea un waypoint en el mapa para el trip activo.
 * Retorna null si se alcanzó el límite o si el API falla.
 */
export async function createWaypoint(
  tripId: string,
  latitude: number,
  longitude: number,
  name: string | null,
  currentCount: number,
): Promise<TripWaypoint | null> {
  if (currentCount >= MAX_WAYPOINTS_PER_TRIP) {
    console.warn(
      `[waypointService] Límite de ${MAX_WAYPOINTS_PER_TRIP} waypoints alcanzado para trip ${tripId}`,
    );
    return null;
  }

  console.log(`[waypointService] Creando waypoint "${name ?? 'sin nombre'}" en`, { latitude, longitude });

  try {
    const waypoint = await tripService.createWaypoint(tripId, {
      latitude,
      longitude,
      name,
    });
    console.log(`[waypointService] ✅ Waypoint creado:`, waypoint.id);
    return waypoint;
  } catch (err) {
    console.error('[waypointService] ❌ Error al crear waypoint:', err);
    return null;
  }
}

/**
 * Marca un waypoint como alcanzado (REACHED).
 * Llamar cuando el usuario se acerca al punto o lo confirma manualmente.
 */
export async function reachWaypoint(
  tripId: string,
  waypointId: string,
): Promise<TripWaypoint | null> {
  try {
    const updated = await tripService.markWaypointReached(tripId, waypointId);
    console.log(`[waypointService] ✅ Waypoint ${waypointId} marcado como REACHED`);
    return updated;
  } catch (err) {
    console.error('[waypointService] ❌ Error al marcar waypoint:', err);
    return null;
  }
}

export const WAYPOINT_LIMIT = MAX_WAYPOINTS_PER_TRIP;