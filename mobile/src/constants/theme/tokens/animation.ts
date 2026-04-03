/**
 * animation.ts
 * Duraciones, easings y configuraciones de animación reutilizables.
 *
 * Uso con react-native-reanimated:
 *   import { withTiming, withSpring, Easing } from 'react-native-reanimated';
 *   withTiming(1, { duration: animation.duration.normal })
 *   withSpring(1, animation.spring.default)
 */

export const animation = {
  /** Duraciones en milisegundos. */
  duration: {
    instant: 100,
    fast:    200,
    normal:  300,
    slow:    500,
    crawl:   800,
  },

  /**
   * Configuraciones para withSpring() de Reanimated.
   * Ejemplo: withSpring(targetValue, animation.spring.default)
   */
  spring: {
    default: { damping: 15, stiffness: 120 },
    bouncy:  { damping: 10, stiffness: 150 },
    stiff:   { damping: 20, stiffness: 200 },
  },

  /**
   * Pulso para elementos críticos (OxygenIndicator, AlertBanner).
   * Usar con withRepeat + withTiming alternando minOpacity ↔ maxOpacity.
   */
  pulse: {
    minOpacity: 0.3,
    maxOpacity: 1.0,
    duration:   1000,
  },
} as const;

export type Animation = typeof animation;