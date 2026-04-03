/**
 * semantic.ts
 * Tokens semánticos — mapean la paleta base a roles de UI.
 * Exporta darkTokens, lightTokens y la función getTheme(scheme).
 */

import { ColorSchemeName } from 'react-native';
import { palette } from './palette';

// ── Tipo compartido ───────────────────────────────────────────

export type ThemeTokens = {
  // Fondos
  readonly bgPrimary:   string;
  readonly bgSecondary: string;
  readonly bgTertiary:  string;
  readonly bgElevated:  string;

  // Texto
  readonly textPrimary:   string;
  readonly textSecondary: string;
  readonly textMuted:     string;
  readonly textInverse:   string;
  readonly textData:      string;   // valores de sensor (mono)
  readonly textOxygen:    string;   // lecturas de O2
  readonly textDanger:    string;
  readonly textSuccess:   string;
  readonly textWarning:   string;

  // Bordes
  readonly borderDefault: string;
  readonly borderStrong:  string;
  readonly borderDanger:  string;
  readonly borderOxygen:  string;

  // Interactivos
  readonly primary:     string;
  readonly primaryLight: string;
  readonly primaryDim:   string;
  readonly danger:       string;
  readonly dangerDim:    string;
  readonly dangerBg:     string;
  readonly success:      string;
  readonly successDim:   string;
  readonly oxygen:       string;
  readonly oxygenBg:     string;

  // Overlay
  readonly overlay:      string;
  readonly overlayLight: string;

  // Tab bar
  readonly tabActive:   string;
  readonly tabInactive: string;
  readonly tabBg:       string;
};

// ── Modo oscuro (default) ────────────────────────────────────

export const darkTokens: ThemeTokens = {
  bgPrimary:   palette.black,
  bgSecondary: palette.surface,
  bgTertiary:  palette.surface2,
  bgElevated:  palette.surface3,

  textPrimary:   palette.textPrimary,
  textSecondary: palette.textSecondary,
  textMuted:     palette.textMuted,
  textInverse:   palette.black,
  textData:      palette.ochreMid,
  textOxygen:    palette.oxygenLight,
  textDanger:    palette.danger,
  textSuccess:   palette.greenBio,
  textWarning:   palette.ochreMid,

  borderDefault: palette.border,
  borderStrong:  palette.borderLight,
  borderDanger:  palette.rust,
  borderOxygen:  palette.oxygen,

  primary:      palette.ochre,
  primaryLight: palette.ochreMid,
  primaryDim:   palette.ochreDim,
  danger:       palette.danger,
  dangerDim:    palette.dangerDim,
  dangerBg:     palette.dangerBg,
  success:      palette.greenBio,
  successDim:   palette.greenDark,
  oxygen:       palette.oxygenMid,
  oxygenBg:     palette.oxygenBg,

  overlay:      'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',

  tabActive:   palette.ochreMid,
  tabInactive: palette.textMuted,
  tabBg:       palette.dark,
} as const;

// ── Modo claro ───────────────────────────────────────────────

export const lightTokens: ThemeTokens = {
  bgPrimary:   '#F5F0E8',
  bgSecondary: '#EDE8DC',
  bgTertiary:  '#E0D9CC',
  bgElevated:  '#F8F4EE',

  textPrimary:   '#1C1A12',
  textSecondary: '#4A4535',
  textMuted:     '#7A7260',
  textInverse:   palette.offWhite,
  textData:      '#7A5C08',
  textOxygen:    '#1A5A80',
  textDanger:    '#A02020',
  textSuccess:   '#2A5A18',
  textWarning:   '#7A5C08',

  borderDefault: '#C8C0A8',
  borderStrong:  '#A09888',
  borderDanger:  '#C04A22',
  borderOxygen:  '#2A7AAA',

  primary:      '#8B6208',
  primaryLight: '#B8870A',
  primaryDim:   '#F5E8C0',
  danger:       '#A02020',
  dangerDim:    '#F5D8D8',
  dangerBg:     '#FAE8E8',
  success:      '#2A5A18',
  successDim:   '#D8ECC8',
  oxygen:       '#1A5A80',
  oxygenBg:     '#D8EAF5',

  overlay:      'rgba(28,26,18,0.6)',
  overlayLight: 'rgba(28,26,18,0.25)',

  tabActive:   '#8B6208',
  tabInactive: '#7A7260',
  tabBg:       '#EDE8DC',
} as const;

// ── Selector de tema ─────────────────────────────────────────

export function getTheme(scheme: ColorSchemeName): ThemeTokens {
  return scheme === 'light' ? lightTokens : darkTokens;
}