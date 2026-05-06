import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '@/constants/theme';
import { getLevelProgress, getXpFloor, getXpCeiling } from '@/utils/levels';
import { MAX_LEVEL } from '@/constants/levels';

interface XpChipProps {
  level: number;
  xp: number;
}

export function XpChip({ level, xp }: XpChipProps) {
  const { colors, fonts, fontSizes, spacing, radii } = useTheme();
  const progress = getLevelProgress(level, xp);
  const isMaxed = level >= MAX_LEVEL;
  const xpInLevel = xp - getXpFloor(level);
  const levelSpan = getXpCeiling(level) - getXpFloor(level);

  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.lg,
      }}
    >
      <View style={{ alignItems: 'center', minWidth: 36 }}>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.micro,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Nivel
        </Text>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.h2,
            color: colors.primary,
            lineHeight: fontSizes.h2 * 1.1,
          }}
        >
          {level}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 4,
            backgroundColor: colors.borderDefault,
            borderRadius: radii.sm,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              width: barWidth,
              backgroundColor: isMaxed ? colors.primaryLight : colors.primary,
              borderRadius: radii.sm,
            }}
          />
        </View>
      </View>

      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes.caption,
          color: colors.textMuted,
          letterSpacing: 0.5,
          textAlign: 'right',
          minWidth: isMaxed ? undefined : 72,
        }}
      >
        {isMaxed ? 'MAX' : `${xpInLevel} / ${levelSpan} XP`}
      </Text>
    </View>
  );
}
