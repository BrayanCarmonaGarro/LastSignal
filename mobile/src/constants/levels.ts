export const MAX_LEVEL = 50;

// XP acumulada total en la que comienza cada nivel.
// Índice 0 sin uso; índice N = nivel N empieza en XP_FLOOR_TABLE[N].
// Fórmula: floor(100 * n^1.6) → escala suave, niveles tempranos rápidos, tardíos significativos.
export const XP_FLOOR_TABLE: readonly number[] = Array.from(
  { length: MAX_LEVEL + 1 },
  (_, n) => (n <= 1 ? 0 : Math.floor(100 * Math.pow(n - 1, 1.6))),
);
