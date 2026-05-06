import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/constants/theme';
import { CLASSIFICATION_LABELS } from '@/constants/labels';
import type { LifeFormCategory } from '@/types/logbook.types';

interface Props {
  classification: LifeFormCategory;
  size?: 'sm' | 'md';
}

export function ClassificationBadge({ classification, size = 'md' }: Props) {
  const { classificationColors, fonts, fontSizes, radii } = useTheme();
  const colors = classificationColors[classification] ?? classificationColors.UNKNOWN_ORGANISM;
  const label  = CLASSIFICATION_LABELS[classification] ?? classification;

  const isSm = size === 'sm';

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.bg,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: isSm ? 6 : 8,
        paddingVertical: isSm ? 1 : 2,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: isSm ? fontSizes.micro : fontSizes.caption,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
