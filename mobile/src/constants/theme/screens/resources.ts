/**
 * resources.ts — Tema de la pantalla Recursos
 * Paleta beige/crema analógica, independiente del scheme del dispositivo.
 */

export const resourcesTheme = {
  bg:           '#F5F0E8',
  bgCard:       '#D9D0BA',
  bgCardAlt:    '#CFC6B0',
  bgSummary:    '#C8BFA8',

  accentGold:   '#8B7340',
  accentGreen:  '#5A8A5A',
  accentRed:    '#C0392B',
  accentAmber:  '#D4820A',
  accentBlue:   '#3A6A8A',

  textPrimary:  '#2C2416',
  textSecondary:'#6B5E45',
  textMuted:    '#9A8E78',
  textInverse:  '#EDE8D8',

  border:       '#A89B7A',
  borderStrong: '#7A6E52',
  borderLight:  '#BDB49A',

  barFilled:    '#8B7340',
  barEmpty:     '#C8BFA8',
  dotFilled:    '#8B7340',
  dotEmpty:     '#BDB49A',

  statusCritical: '#C0392B',
  statusLow:      '#D4820A',
  statusNormal:   '#5A8A5A',
} as const;

export type ResourcesTheme = typeof resourcesTheme;
