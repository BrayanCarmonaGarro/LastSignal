import { ColorSchemeName } from 'react-native';

export type LoginThemeTokens = {
  readonly bg:               string;
  readonly gold:             string;
  readonly hud:              string;
  readonly signal:           string;
  readonly muted:            string;
  readonly btnBg:            string;
  readonly btnBorder:        string;
  readonly btnBgPressed:     string;
  readonly btnBorderPressed: string;
  readonly logoCore:         string;
  readonly nebulaA:          string;
  readonly nebulaB:          string;
  readonly starColor:        string;
  readonly btnText:          string;
};

export const loginDarkTokens: LoginThemeTokens = {
  bg:               '#06090f',
  gold:             '#c8a84a',
  hud:              '#7eb8e8',
  signal:           '#00c864',
  muted:            'rgba(100,150,200,0.4)',
  btnBg:            'rgba(255,255,255,0.04)',
  btnBorder:        'rgba(255,255,255,0.13)',
  btnBgPressed:     'rgba(255,255,255,0.09)',
  btnBorderPressed: 'rgba(255,255,255,0.30)',
  logoCore:         '#0a1e46',
  nebulaA:          'rgba(20,60,140,0.2)',
  nebulaB:          'rgba(60,15,100,0.1)',
  starColor:        '#ffffff',
  btnText:          '#e8e0cc',
} as const;

export const loginLightTokens: LoginThemeTokens = {
  bg:               '#f0ede4',
  gold:             '#8a6800',
  hud:              '#2a5a8a',
  signal:           '#007a3d',
  muted:            'rgba(60,80,120,0.45)',
  btnBg:            'rgba(80,60,20,0.05)',
  btnBorder:        'rgba(80,60,20,0.18)',
  btnBgPressed:     'rgba(80,60,20,0.10)',
  btnBorderPressed: 'rgba(80,60,20,0.35)',
  logoCore:         '#ddd8cc',
  nebulaA:          'rgba(180,160,80,0.18)',
  nebulaB:          'rgba(160,120,40,0.10)',
  starColor:        '#8a7030',
  btnText:          '#3c2a08',
} as const;

export function getLoginTheme(scheme: ColorSchemeName): LoginThemeTokens {
  return scheme === 'light' ? loginLightTokens : loginDarkTokens;
}
