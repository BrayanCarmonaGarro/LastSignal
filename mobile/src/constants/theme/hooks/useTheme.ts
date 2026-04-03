/**
 * useTheme.ts
 * Hook principal para acceder a todos los tokens del tema.
 *
 * Uso en componentes:
 *   const { colors, fonts, spacing, shadows } = useTheme();
 */

import { useColorScheme } from 'react-native';
import { getTheme, ThemeTokens } from '../tokens/semantic';
import { fonts, fontSizes, lineHeights, letterSpacings } from '../tokens/typography';
import { spacing, radii, borderWidths, layout, breakpoints, iconSizes } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { animation } from '../tokens/animation';
import { classificationColors } from '../domain/classifications';
import { dangerColors } from '../domain/danger';
import { resourceColors } from '../domain/resources';

export type UseThemeReturn = {
  /** Tokens semánticos de color (adaptativos claro/oscuro). */
  colors: ThemeTokens;
  /** Familias tipográficas. */
  fonts: typeof fonts;
  /** Tamaños de fuente. */
  fontSizes: typeof fontSizes;
  /** Multiplicadores de line-height. */
  lineHeights: typeof lineHeights;
  /** Letter spacings en puntos. */
  letterSpacings: typeof letterSpacings;
  /** Escala de espaciado (8pt grid). */
  spacing: typeof spacing;
  /** Radios de borde. */
  radii: typeof radii;
  /** Anchos de borde. */
  borderWidths: typeof borderWidths;
  /** Constantes de layout de pantalla. */
  layout: typeof layout;
  /** Breakpoints de ancho de pantalla. */
  breakpoints: typeof breakpoints;
  /** Tamaños de iconos. */
  iconSizes: typeof iconSizes;
  /** Configuraciones de sombra. */
  shadows: typeof shadows;
  /** Configuraciones de animación. */
  animation: typeof animation;
  /** Colores por clasificación de formas de vida. */
  classificationColors: typeof classificationColors;
  /** Colores por nivel de peligro. */
  dangerColors: typeof dangerColors;
  /** Colores por categoría de recurso. */
  resourceColors: typeof resourceColors;
  /** Esquema activo: 'dark' | 'light'. */
  scheme: 'dark' | 'light';
};

export function useTheme(): UseThemeReturn {
  const rawScheme = useColorScheme();
  const scheme = rawScheme === 'light' ? 'light' : 'dark';

  return {
    colors:               getTheme(scheme),
    fonts,
    fontSizes,
    lineHeights,
    letterSpacings,
    spacing,
    radii,
    borderWidths,
    layout,
    breakpoints,
    iconSizes,
    shadows,
    animation,
    classificationColors,
    dangerColors,
    resourceColors,
    scheme,
  };
}