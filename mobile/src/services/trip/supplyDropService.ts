// src/services/trip/supplyDropService.ts
import { tripService } from '@/services/trip/tripService';
import type { SupplyDrop } from '@/types/supply_drop.types';
import type { BaseResource } from '@/types/resource.types';
import { resourcesApi } from '@/services/api/resources.api';

const TARGET_AVAILABLE_DROPS = 3;
const NEARBY_RADIUS_DEG = 0.02;
const SCATTER_RANGE = 0.015;
const MIN_DROP_SEPARATION_DEG = 0.003;
const MAX_COORD_ATTEMPTS = 20;

function randomScatter(): number {
  return (Math.random() * 2 - 1) * SCATTER_RANGE;
}

function distanceDeg(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  return Math.sqrt(
    Math.pow(a.latitude - b.latitude, 2) +
    Math.pow(a.longitude - b.longitude, 2)
  );
}

function generateCoords(
  userLat: number,
  userLon: number,
  occupied: Array<{ latitude: number; longitude: number }>
): { latitude: number; longitude: number } | null {
  for (let attempt = 0; attempt < MAX_COORD_ATTEMPTS; attempt++) {
    const candidate = {
      latitude: userLat + randomScatter(),
      longitude: userLon + randomScatter(),
    };
    const tooClose = occupied.some(
      (o) => distanceDeg(candidate, o) < MIN_DROP_SEPARATION_DEG
    );
    if (!tooClose) {
      console.log(`[supplyDropService] Coordenadas generadas en intento ${attempt + 1}:`, candidate);
      return candidate;
    }
  }
  console.warn('[supplyDropService] No se encontraron coordenadas libres después de', MAX_COORD_ATTEMPTS, 'intentos');
  return null;
}

function generateAmount(unit: BaseResource['unit']): number {
  switch (unit) {
    case 'LITERS':      return Math.floor(Math.random() * 11) + 5;
    case 'CALORIES':    return Math.floor(Math.random() * 2001) + 1000;
    case 'UNITS':       return Math.floor(Math.random() * 4) + 1;
    case 'KILOGRAMS':
    case 'GRAMS':       return Math.floor(Math.random() * 5) + 1;
    case 'PERCENTAGE':  return Math.floor(Math.random() * 51) + 50;
    default:            return 1;
  }
}

function selectResources(
  resources: BaseResource[],
  alreadyUsedIds: Set<string>
): BaseResource[] {
  const selected: BaseResource[] = [];
  for (const resource of resources) {
    if (selected.length >= 3) break;
    if (alreadyUsedIds.has(resource.id)) continue;
    if (selected.some((s) => s.category === resource.category)) continue;
    selected.push(resource);
  }
  return selected;
}

export async function ensureSupplyDrops(userLat: number, userLon: number): Promise<SupplyDrop[]> {
  let allDrops: SupplyDrop[];
  try {
    allDrops = await tripService.getAllDrops();
    console.log(`[supplyDropService] Total drops en backend: ${allDrops.length}`);
  } catch (err) {
    console.error('[supplyDropService] ❌ Error al obtener drops:', err);
    return [];
  }

  const nearbyAvailable = allDrops.filter(
    (d) =>
      d.status === 'AVAILABLE' &&
      distanceDeg(d, { latitude: userLat, longitude: userLon }) <= NEARBY_RADIUS_DEG
  );
  console.log(`[supplyDropService] Drops AVAILABLE cercanos: ${nearbyAvailable.length}`);

  const needed = TARGET_AVAILABLE_DROPS - nearbyAvailable.length;
  if (needed <= 0) {
    console.log('[supplyDropService] ✅ Suficientes drops cercanos, no se generan nuevos');
    return allDrops;
  }
  console.log(`[supplyDropService] Necesita generar: ${needed} drops`);

  let resources: BaseResource[];
  try {
    resources = await resourcesApi.getBaseResources();
    console.log(`[supplyDropService] Recursos base disponibles: ${resources.length}`);
  } catch (err) {
    console.error('[supplyDropService] ❌ Error al obtener recursos base:', err);
    return allDrops;
  }

  if (resources.length === 0) {
    console.warn('[supplyDropService] ⚠️ No hay recursos base definidos, abortando');
    return allDrops;
  }

  const occupied = allDrops.map((d) => ({ latitude: d.latitude, longitude: d.longitude }));

  const usedResourceIds = new Set<string>(
    nearbyAvailable.flatMap((d) => d.items?.map((i) => i.base_resource_id) ?? [])
  );

  for (let i = 0; i < needed; i++) {
    console.log(`[supplyDropService] ── Generando drop ${i + 1}/${needed} ──`);

    const coords = generateCoords(userLat, userLon, occupied);
    if (!coords) {
      console.warn(`[supplyDropService] ⚠️ Drop ${i + 1} omitido por falta de espacio`);
      continue;
    }

    const selected = selectResources(resources, usedResourceIds);
    if (selected.length === 0) {
      console.warn(`[supplyDropService] ⚠️ Drop ${i + 1} omitido, no hay recursos disponibles para asignar`);
      continue;
    }

    const items = selected.map((r) => ({ base_resource_id: r.id, amount: generateAmount(r.unit) }));

    console.log(`[supplyDropService] Drop ${i + 1} — recursos:`, selected.map((r) => `${r.name} (${r.category})`));
    console.log(`[supplyDropService] Drop ${i + 1} — items:`, items);

    try {
      await tripService.createDrop(coords.latitude, coords.longitude, items);
      console.log(`[supplyDropService] ✅ Drop ${i + 1} creado correctamente`);
      occupied.push(coords);
      selected.forEach((r) => usedResourceIds.add(r.id));
    } catch (err) {
      console.error(`[supplyDropService] ❌ Error al crear drop ${i + 1}:`, err);
    }
  }

  console.log('[supplyDropService] ── Verificación finalizada, fetching estado final ──');
  try {
    const finalDrops = await tripService.getAllDrops();
    console.log(`[supplyDropService] Drops finales en store: ${finalDrops.length}`);
    return finalDrops;
  } catch (err) {
    console.error('[supplyDropService] ❌ Error al obtener drops finales:', err);
    return allDrops;
  }
}