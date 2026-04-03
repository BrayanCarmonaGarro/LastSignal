/**
 * classifications.ts
 * Colores por clasificación de formas de vida del logbook.
 */

import { palette } from '../tokens/palette';

export const classificationColors = {
  ANIMAL: {
    bg:     palette.ochreDim,
    border: palette.ochre,
    text:   palette.ochreMid,
  },
  PLANT: {
    bg:     palette.greenDark,
    border: palette.green,
    text:   palette.greenBio,
  },
  FUNGI: {
    bg:     palette.fungiBg,
    border: palette.fungi,
    text:   palette.fungiLight,
  },
  MINERAL: {
    bg:     palette.mineralBg,
    border: palette.mineral,
    text:   palette.mineralLight,
  },
  RESOURCE: {
    bg:     palette.oxygenBg,
    border: palette.oxygen,
    text:   palette.oxygenMid,
  },
  UNKNOWN_ORGANISM: {
    bg:     palette.surface2,
    border: palette.border,
    text:   palette.textMuted,
  },
} as const;

export type ClassificationKey    = keyof typeof classificationColors;
export type ClassificationColors = typeof classificationColors;