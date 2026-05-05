// Tipos de recursos definidos
import { Resource } from '@/services/api/resources.api';
import type { ResourceCategory } from '@/types/resource.types';

export const MAX_AMOUNTS: Record<string, number> = {
  'Oxígeno':        100,
  'Agua':           100,
  'Raciones':     20000,
  'Combustible':    100,
  'Botiquín':        10,
  'Baterías':        20,
  'Píldoras Radio':  10,
};

export const RESOURCE_ICONS: Record<string, string> = {
  // Por nombre exacto
  'Oxígeno':   'pulse-outline',
  'Energía':   'flash-outline',
  'Agua':      'water-outline',
  'Comida':    'nutrition-outline',
  'Minerales': 'diamond-outline',
  // Fallback por categoría
  VITAL:       'pulse-outline',
  FOOD:        'nutrition-outline',
  EQUIPMENT:   'construct-outline',
  MEDICAL:     'medkit-outline',
  FUEL:        'flame-outline',
};

export const HUD_RESOURCE_NAMES = ['Oxígeno', 'Agua', 'Raciones'] as const;
export type HudResourceName = typeof HUD_RESOURCE_NAMES[number];

export const HUD_RESOURCE_CATEGORY: Record<HudResourceName, ResourceCategory> = {
  'Oxígeno':  'VITAL',
  'Agua':     'VITAL',
  'Raciones': 'FOOD',
};

export function getResourceIcon(name: string, category: Resource['category']): string {
  return RESOURCE_ICONS[name] ?? RESOURCE_ICONS[category] ?? 'cube-outline';
}
