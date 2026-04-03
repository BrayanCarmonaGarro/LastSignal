/**
 * index.ts — barrel del sistema de diseño LastSignal
 *
 * Importar desde componentes:
 *   import { useTheme } from '@/constants/theme';
 *   import { palette } from '@/constants/theme';           // solo si realmente necesitas raw
 *   import type { ThemeTokens } from '@/constants/theme';
 */

// Hook principal (uso recomendado en componentes)
export { useTheme }           from './hooks/useTheme';
export type { UseThemeReturn } from './hooks/useTheme';

// Tokens de color
export { palette }            from './tokens/palette';
export { getTheme, darkTokens, lightTokens } from './tokens/semantic';
export type { ThemeTokens }   from './tokens/semantic';

// Tipografía
export { fonts, fontSizes, lineHeights, letterSpacings } from './tokens/typography';

// Espaciado y layout
export { spacing, radii, borderWidths, layout, breakpoints, iconSizes } from './tokens/spacing';

// Sombras
export { shadows } from './tokens/shadows';

// Animación
export { animation } from './tokens/animation';

// Colores de dominio
export { classificationColors } from './domain/classifications';
export type { ClassificationKey, ClassificationColors } from './domain/classifications';

export { dangerColors }         from './domain/danger';
export type { DangerKey, DangerColors } from './domain/danger';

export { resourceColors }       from './domain/resources';
export type { ResourceCategoryKey, ResourceCategoryColors } from './domain/resources';