/**
 * typography.ts
 * Tipografía del sistema — fuentes, tamaños, alturas de línea, tracking.
 *
 * Fuentes requeridas (cargar en app/_layout.tsx con expo-font):
 *   'BarlowCondensed-700' → assets/fonts/BarlowCondensed-Bold.ttf
 *   'BarlowCondensed-500' → assets/fonts/BarlowCondensed-Medium.ttf
 *   'Barlow-400'          → assets/fonts/Barlow-Regular.ttf
 *   'Barlow-300'          → assets/fonts/Barlow-Light.ttf
 *   'ShareTechMono'       → assets/fonts/ShareTechMono-Regular.ttf
 *
 * Roles:
 *   display  → Barlow Condensed Bold  — títulos de pantalla, nombres de sector
 *   heading  → Barlow Condensed Med   — secciones, subsecciones
 *   body     → Barlow Regular         — texto corrido
 *   caption  → Barlow Light           — metadatos, timestamps
 *   mono     → Share Tech Mono        — valores numéricos, lecturas de sensor
 */

export const fonts = {
  display: 'BarlowCondensed-700',
  heading: 'BarlowCondensed-500',
  body:    'Barlow-400',
  caption: 'Barlow-300',
  mono:    'ShareTechMono',
} as const;

export const fontSizes = {
  display: 32,   // SECTOR ALFA-7
  h1:      24,   // nombre de pantalla
  h2:      20,   // sección
  h3:      16,   // subsección / card title
  body:    14,   // texto base
  caption: 12,   // metadatos
  micro:   10,   // labels monoespaciados
  data:    13,   // lecturas de sensor (mono)
  dataLg:  22,   // indicador vital grande (mono)
  dataXl:  36,   // contador de oxígeno principal (mono)
} as const;

/**
 * Multiplicadores de line-height (relativo al fontSize).
 * Usar con: lineHeight = fontSize * lineHeights.normal
 */
export const lineHeights = {
  tight:   1.1,
  normal:  1.4,
  relaxed: 1.6,
  loose:   1.8,
} as const;

/** letterSpacing en puntos (React Native usa puntos, no em). */
export const letterSpacings = {
  tight:   -0.5,
  normal:   0,
  wide:     1,
  wider:    2,
  widest:   3,   // labels mono en mayúsculas
} as const;

export type Fonts          = typeof fonts;
export type FontSizes      = typeof fontSizes;
export type LineHeights    = typeof lineHeights;
export type LetterSpacings = typeof letterSpacings;