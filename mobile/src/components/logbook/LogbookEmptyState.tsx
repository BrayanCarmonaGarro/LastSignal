import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { useTheme } from '@/constants/theme';

interface Props {
  onOpenCamera: () => void;
}

function PlanetIllustration({ color, muted }: { color: string; muted: string }) {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* Stars */}
      <Circle cx={10}  cy={15}  r={1.5} fill={muted} opacity={0.6} />
      <Circle cx={105} cy={20}  r={1}   fill={muted} opacity={0.5} />
      <Circle cx={20}  cy={90}  r={1}   fill={muted} opacity={0.4} />
      <Circle cx={100} cy={95}  r={1.5} fill={muted} opacity={0.6} />
      <Circle cx={55}  cy={5}   r={1}   fill={muted} opacity={0.5} />
      {/* Planet body */}
      <Circle cx={60} cy={60} r={30} fill={muted} opacity={0.15} />
      <Circle cx={60} cy={60} r={30} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />
      {/* Surface lines */}
      <Path d="M34 52 Q60 48 86 52"  fill="none" stroke={muted} strokeWidth={1} opacity={0.4} />
      <Path d="M32 60 Q60 55 88 60"  fill="none" stroke={muted} strokeWidth={1} opacity={0.4} />
      <Path d="M34 68 Q60 72 86 68"  fill="none" stroke={muted} strokeWidth={1} opacity={0.3} />
      {/* Ring */}
      <Ellipse cx={60} cy={60} rx={48} ry={10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.25} />
      {/* Dot on planet */}
      <Circle cx={50} cy={56} r={3} fill={color} opacity={0.3} />
      <Circle cx={68} cy={64} r={2} fill={color} opacity={0.2} />
    </Svg>
  );
}

export function LogbookEmptyState({ onOpenCamera }: Props) {
  const { colors, fonts, fontSizes, spacing, radii } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['2xl'],
        paddingBottom: spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <PlanetIllustration color={colors.primary} muted={colors.textMuted} />

      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: fontSizes.h2,
          color: colors.textPrimary,
          textAlign: 'center',
          letterSpacing: 0.5,
        }}
      >
        Sin registros en la bitácora
      </Text>

      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: fontSizes.caption,
          color: colors.textMuted,
          textAlign: 'center',
          lineHeight: fontSizes.caption * 1.6,
        }}
      >
        Toma una foto para registrar tu primer descubrimiento
      </Text>

      <TouchableOpacity
        onPress={onOpenCamera}
        activeOpacity={0.85}
        style={{
          width: '100%',
          height: 48,
          backgroundColor: colors.primary,
          borderRadius: radii.xl,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.sm,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: fontSizes.body,
            color: colors.bgPrimary,
            letterSpacing: 1,
          }}
        >
          ABRIR CÁMARA
        </Text>
      </TouchableOpacity>
    </View>
  );
}
