/**
 * shadows.ts
 * Sombras para React Native.
 * Incluye shadowColor/Offset/Opacity/Radius (iOS) + elevation (Android).
 */

import { palette } from './palette';

export const shadows = {
  none: {
    shadowColor:   'transparent',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
  sm: {
    shadowColor:   palette.black,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius:  3,
    elevation:     2,
  },
  md: {
    shadowColor:   palette.black,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius:  6,
    elevation:     4,
  },
  lg: {
    shadowColor:   palette.black,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius:  12,
    elevation:     8,
  },
  /** Sombra de color para elementos críticos de peligro. */
  danger: {
    shadowColor:   palette.danger,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius:  8,
    elevation:     4,
  },
  /** Sombra de color para indicadores de oxígeno. */
  oxygen: {
    shadowColor:   palette.oxygen,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius:  8,
    elevation:     4,
  },
} as const;

export type Shadows = typeof shadows;