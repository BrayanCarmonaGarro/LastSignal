/**
 * resources.ts
 * Colores por categoría de recurso.
 */

import { palette } from '../tokens/palette';

export const resourceColors = {
  VITAL: {
    primary: palette.oxygenMid,
    dim:     palette.oxygenBg,
    bar:     palette.oxygenLight,
  },
  FOOD: {
    primary: palette.ochre,
    dim:     palette.ochreDim,
    bar:     palette.ochreMid,
  },
  MEDICAL: {
    primary: palette.greenBio,
    dim:     palette.greenDark,
    bar:     palette.greenMid,
  },
  EQUIPMENT: {
    primary: palette.textSecondary,
    dim:     palette.surface2,
    bar:     palette.textMuted,
  },
  FUEL: {
    primary: palette.rustMid,
    dim:     '#2A1008',
    bar:     palette.rustMid,
  },
} as const;

export type ResourceCategoryKey    = keyof typeof resourceColors;
export type ResourceCategoryColors = typeof resourceColors;