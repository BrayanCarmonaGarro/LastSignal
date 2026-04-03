/**
 * palette.ts
 * Colores base invariantes — no referencian modo claro/oscuro.
 * Nunca importar directamente en componentes; usar tokens semánticos via useTheme().
 */

export const palette = {
  // ── Superficies — tierra quemada ──────────────────────────
  black:       '#0D0C09',
  dark:        '#141209',
  surface:     '#1C1A12',
  surface2:    '#242119',
  surface3:    '#2C2A1E',

  // ── Bordes ────────────────────────────────────────────────
  border:      '#3A3620',
  borderLight: '#504E38',

  // ── Texto ─────────────────────────────────────────────────
  textPrimary:   '#C8BFA0',
  textSecondary: '#8A7F65',
  textMuted:     '#6B6548',

  // ── Ocre / ámbar — acción principal ───────────────────────
  ochre:       '#B8870A',
  ochreMid:    '#D4A012',
  ochreLight:  '#E8BC44',
  ochreDim:    '#2A1F08',

  // ── Verde orgánico — vida, seguro ─────────────────────────
  greenDark:   '#2A3D1A',
  green:       '#4A6B3A',
  greenMid:    '#6B9A55',
  greenBio:    '#8FB84A',

  // ── Rojo / óxido — peligro ────────────────────────────────
  rust:        '#8B3A1C',
  rustMid:     '#C04A22',
  danger:      '#E03030',
  dangerDim:   '#4A1010',
  dangerBg:    '#200808',

  // ── Azul oxígeno — vital, tecnológico ─────────────────────
  oxygenDark:  '#0A1520',
  oxygen:      '#2A7AAA',
  oxygenMid:   '#4AA0D4',
  oxygenLight: '#7DC4E8',
  oxygenBg:    '#0F2535',

  // ── Esporas / fungi ───────────────────────────────────────
  sporeDark:   '#1A1020',
  spore:       '#5A6B2A',
  fungi:       '#6B3A7A',
  fungiLight:  '#C084D4',
  fungiBg:     '#251A2A',

  // ── Mineral ───────────────────────────────────────────────
  mineral:     '#4A7A8A',
  mineralLight:'#7AAABB',
  mineralBg:   '#0F2028',

  // ── Neutros ───────────────────────────────────────────────
  white:       '#F0EDE4',
  offWhite:    '#D8D2C0',
} as const;

export type Palette = typeof palette;