import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/constants/theme';

export function LogbookSkeletonCard() {
  const { colors, spacing, radii, borderWidths } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const block = (w: number | string, h: number, radius: number = radii.sm) => (
    <Animated.View
      style={{
        width: w as number,
        height: h,
        borderRadius: radius,
        backgroundColor: colors.bgTertiary,
        opacity,
      }}
    />
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 88,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: borderWidths.thin,
        borderBottomColor: colors.borderDefault,
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      {block(60, 60, radii.xl)}
      <View style={{ flex: 1, gap: spacing.xs }}>
        {block('60%', 12, radii.md)}
        {block('90%', 10, radii.sm)}
        {block('40%', 10, radii.sm)}
      </View>
      {block(16, 16, radii.sm)}
    </View>
  );
}
