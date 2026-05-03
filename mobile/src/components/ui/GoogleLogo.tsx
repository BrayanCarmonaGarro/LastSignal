import React from 'react';
import Svg, { Path } from 'react-native-svg';

type Props = { size?: number };

export function GoogleLogo({ size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path
        d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.4a4.62 4.62 0 01-2 3.04v2.52h3.23c1.89-1.74 2.97-4.3 2.97-7.35z"
        fill="#4285F4"
      />
      <Path
        d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.23-2.52c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H1.08v2.6A10 10 0 0010 20z"
        fill="#34A853"
      />
      <Path
        d="M4.4 11.9A6.02 6.02 0 014.07 10c0-.66.11-1.3.33-1.9V5.5H1.08A10 10 0 000 10c0 1.61.39 3.14 1.08 4.5l3.32-2.6z"
        fill="#FBBC05"
      />
      <Path
        d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.9 12.7 0 10 0A10 10 0 001.08 5.5l3.32 2.6C5.19 5.74 7.4 3.98 10 3.98z"
        fill="#EA4335"
      />
    </Svg>
  );
}
