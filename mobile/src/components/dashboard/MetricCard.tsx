import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

type Variant = 'default' | 'danger' | 'oxygen';

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  variant?: Variant;
}

export function MetricCard({ icon, value, label, variant = 'default' }: MetricCardProps) {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths } = useTheme();

  const accentColor =
    variant === 'danger' ? colors.danger : variant === 'oxygen' ? colors.oxygen : colors.primary;

  const valueColor =
    variant === 'danger'
      ? colors.textDanger
      : variant === 'oxygen'
        ? colors.textOxygen
        : colors.textData;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bgSecondary,
        borderRadius: radii.lg,
        borderWidth: borderWidths.base,
        borderColor: colors.borderDefault,
        borderLeftWidth: borderWidths.accent,
        borderLeftColor: accentColor,
        padding: spacing.md,
      }}
    >
      <Ionicons name={icon} size={14} color={accentColor} style={{ marginBottom: spacing.xs }} />
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.dataXl,
          color: valueColor,
          lineHeight: fontSizes.dataXl * 1.1,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: fonts.caption,
          fontSize: fontSizes.caption,
          color: colors.textMuted,
          marginTop: spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
