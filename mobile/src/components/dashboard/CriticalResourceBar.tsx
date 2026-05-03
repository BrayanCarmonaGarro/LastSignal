import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import type { ResourceCategory, ResourceUnit } from '@/types/resource.types';
import { UNIT_LABELS } from '@/constants/labels';

interface CriticalResourceBarProps {
  name: string;
  category: ResourceCategory;
  current_amount: number;
  min_threshold: number;
  unit: ResourceUnit;
  is_critical: boolean;
}


export function CriticalResourceBar({
  name,
  category,
  current_amount,
  min_threshold,
  unit,
  is_critical,
}: CriticalResourceBarProps) {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, resourceColors } = useTheme();

  const categoryColors = resourceColors[category];
  const fillRatio = Math.min(current_amount / Math.max(min_threshold, 1), 1);
  const fillColor = is_critical ? colors.danger : categoryColors.bar;
  const unitLabel = UNIT_LABELS[unit] ?? unit;

  return (
    <View
      style={{
        backgroundColor: colors.bgTertiary,
        borderRadius: radii.md,
        borderLeftWidth: borderWidths.accent,
        borderLeftColor: categoryColors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
          {is_critical && (
            <Ionicons name="warning-outline" size={12} color={colors.danger} />
          )}
          <Text
            style={{
              fontFamily: fonts.heading,
              fontSize: fontSizes.body,
              color: is_critical ? colors.textDanger : colors.textPrimary,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.data,
            color: colors.textData,
            marginLeft: spacing.sm,
          }}
        >
          {current_amount.toFixed(1)} {unitLabel}
        </Text>
      </View>

      <View
        style={{
          height: 4,
          backgroundColor: colors.bgElevated,
          borderRadius: radii.sm,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${fillRatio * 100}%`,
            backgroundColor: fillColor,
            borderRadius: radii.sm,
          }}
        />
      </View>
    </View>
  );
}
