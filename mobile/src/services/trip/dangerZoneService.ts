// src/services/trip/dangerZoneService.ts
import { tripService } from '@/services/trip/tripService';
import type { TripDangerZone, DangerSeverity } from '@/types/trip.types';

// ─── Constantes ──────────────────────────────────────────────────────────────

const MIN_ZONES = 1;
const MAX_ZONES = 3;
const SCATTER_RANGE = 0.018;
const MIN_ZONE_SEPARATION_DEG = 0.004;
const MAX_COORD_ATTEMPTS = 20;

/** Probabilidad acumulada: 10% LOW, 60% MEDIUM, 30% HIGH */
const SEVERITY_THRESHOLDS: Array<{ threshold: number; severity: DangerSeverity }> = [
  { threshold: 0.10, severity: 'LOW' },
  { threshold: 0.70, severity: 'MEDIUM' },
  { threshold: 1.00, severity: 'HIGH' },
];

const DESCRIPTIONS: Record<DangerSeverity, string[]> = {
  LOW: [
    'Terreno inestable, proceder con cautela',
    'Presencia de organismos desconocidos',
    'Radiación leve detectada en el área',
  ],
  MEDIUM: [
    'Grietas con emisiones de gas desconocido',
    'Actividad sísmica registrada recientemente',
    'Colonia de organismos potencialmente hostiles',
  ],
  HIGH: [
    'Zona de alta toxicidad — traje requerido',
    'Colonia de hongos peligrosos confirmada',
    'Temperatura extrema — exposición limitada',
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomScatter(): number {
  return (Math.random() * 2 - 1) * SCATTER_RANGE;
}

function distanceDeg(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  return Math.sqrt(
    Math.pow(a.latitude - b.latitude, 2) +
    Math.pow(a.longitude - b.longitude, 2),
  );
}

function rollSeverity(): DangerSeverity {
  const roll = Math.random();
  for (const { threshold, severity } of SEVERITY_THRESHOLDS) {
    if (roll < threshold) return severity;
  }
  return 'MEDIUM';
}

function pickDescription(severity: DangerSeverity): string {
  const pool = DESCRIPTIONS[severity];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateCoords(
  userLat: number,
  userLon: number,
  occupied: Array<{ latitude: number; longitude: number }>,
): { latitude: number; longitude: number } | null {
  for (let attempt = 0; attempt < MAX_COORD_ATTEMPTS; attempt++) {
    const candidate = {
      latitude:  userLat + randomScatter(),
      longitude: userLon + randomScatter(),
    };

    const tooClose = occupied.some(
      (o) => distanceDeg(candidate, o) < MIN_ZONE_SEPARATION_DEG,
    );

    if (!tooClose) return candidate;
  }

  console.warn(
    '[dangerZoneService] No se encontraron coordenadas libres después de',
    MAX_COORD_ATTEMPTS, 'intentos',
  );
  return null;
}

// ─── Algoritmo principal ──────────────────────────────────────────────────────

/**
 * Genera entre MIN_ZONES y MAX_ZONES zonas de peligro para el trip recién iniciado.
 * Llamar una sola vez justo después de `tripService.startTrip()`.
 */
export async function generateDangerZones(
  tripId: string,
  userLat: number,
  userLon: number,
): Promise<TripDangerZone[]> {
  const count = Math.floor(Math.random() * (MAX_ZONES - MIN_ZONES + 1)) + MIN_ZONES;
  console.log(`[dangerZoneService] Generando ${count} zona(s) para trip ${tripId}`);

  const occupied: Array<{ latitude: number; longitude: number }> = [];
  const created: TripDangerZone[] = [];

  for (let i = 0; i < count; i++) {
    const coords = generateCoords(userLat, userLon, occupied);
    if (!coords) {
      console.warn(`[dangerZoneService] Zona ${i + 1} omitida — sin espacio disponible`);
      continue;
    }

    const severity    = rollSeverity();
    const description = pickDescription(severity);

    console.log(`[dangerZoneService] Zona ${i + 1} — severity: ${severity} — coords:`, coords);

    try {
      const zone = await tripService.createDangerZone(tripId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        severity,
        description,
      });

      console.log(`[dangerZoneService] ✅ Zona ${i + 1} creada — ID: ${zone.id}`);
      created.push(zone);
      occupied.push(coords);
    } catch (err) {
      console.error(`[dangerZoneService] ❌ Error al crear zona ${i + 1}:`, err);
    }
  }

  console.log(`[dangerZoneService] ── ${created.length}/${count} zonas creadas ── Total: ${created.length}`, created);
  return created;
}