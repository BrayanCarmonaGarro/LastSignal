/**
 * danger.ts
 * Colores por nivel de peligro de una entidad del logbook.
 */

import { palette } from '../tokens/palette';

export const dangerColors = {
  DANGEROUS: {
    bg:     palette.dangerBg,
    border: palette.rust,
    text:   palette.danger,
  },
  FRIENDLY: {
    bg:     palette.greenDark,
    border: palette.green,
    text:   palette.greenBio,
  },
  UNKNOWN: {
    bg:     palette.surface2,
    border: palette.border,
    text:   palette.textMuted,
  },
} as const;

export type DangerKey    = keyof typeof dangerColors;
export type DangerColors = typeof dangerColors;