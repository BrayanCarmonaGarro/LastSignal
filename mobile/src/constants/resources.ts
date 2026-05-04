// Tipos de recursos definidos
import { Resource } from '@/services/api/resources.api';

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
  'Oxígeno':   'cloud-outline',
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

export function getResourceIcon(name: string, category: Resource['category']): string {
  return RESOURCE_ICONS[name] ?? RESOURCE_ICONS[category] ?? 'cube-outline';
}
