import type { ResourceUnit } from '@/types/resource.types';
import type { LifeFormCategory } from '@/types/logbook.types';

export const UNIT_LABELS: Record<ResourceUnit, string> = {
  LITERS: 'L',
  KILOGRAMS: 'kg',
  UNITS: 'u',
  PERCENTAGE: '%',
  GRAMS: 'g',
  CALORIES: 'kcal',
};

export const CLASSIFICATION_LABELS: Record<LifeFormCategory, string> = {
  ANIMAL: 'Animal',
  PLANT: 'Planta',
  RESOURCE: 'Recurso',
  MINERAL: 'Mineral',
  FUNGI: 'Hongo',
  UNKNOWN_ORGANISM: 'Desconocido',
};
