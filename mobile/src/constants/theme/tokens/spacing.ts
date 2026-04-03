/**
 * spacing.ts
 * Espaciado, radios, anchos de borde, layout, breakpoints e iconos.
 */

// ── Espaciado base (8-point grid) ────────────────────────────

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ── Radios de borde ──────────────────────────────────────────

export const radii = {
  none: 0,
  sm:   2,    // badges, chips compactos
  md:   4,    // botones, inputs
  lg:   6,    // cards
  xl:   10,   // modales, bottom sheets
  full: 9999, // pills
} as const;

// ── Anchos de borde ──────────────────────────────────────────

export const borderWidths = {
  thin:   0.5,
  base:   1,
  thick:  2,
  accent: 3,   // borde izquierdo de alertas críticas
} as const;

// ── Layout global ────────────────────────────────────────────

export const layout = {
  screenPaddingH:  16,
  screenPaddingV:  20,
  maxContentWidth: 480,
  tabBarHeight:    64,
  headerHeight:    56,
  cardGap:         10,
  sectionGap:      24,
} as const;

// ── Breakpoints (ancho de pantalla) ──────────────────────────

export const breakpoints = {
  small:  375,   // iPhone SE
  medium: 390,   // iPhone 14
  large:  430,   // iPhone 14 Plus / Pro Max
} as const;

// ── Tamaños de iconos (@expo/vector-icons) ───────────────────

export const iconSizes = {
  xs:   12,
  sm:   16,
  md:   20,
  lg:   24,
  xl:   32,
  '2xl': 48,
} as const;

export type Spacing      = typeof spacing;
export type Radii        = typeof radii;
export type BorderWidths = typeof borderWidths;
export type Layout       = typeof layout;
export type Breakpoints  = typeof breakpoints;
export type IconSizes    = typeof iconSizes;