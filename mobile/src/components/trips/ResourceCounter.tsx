// src/components/trips/ResourceCounter.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/constants/theme';

export interface ResourceItem {
  resourceId: string;
  name: string;
  quantity: number;
  unit: string;
}

interface ResourceCounterProps {
  items: ResourceItem[];
  compact?: boolean;
  animate?: boolean;
}

function AnimatedRow({ item, animate }: { item: ResourceItem; animate: boolean }) {
  const { colors, spacing, radii } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animate ? 12 : 0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const rowStyles = {
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    } as const,
    rowDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    } as const,
    rowName: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '500' as const,
    } as const,
    rowQuantity: {
      color: colors.oxygen,
      fontSize: 14,
      fontWeight: '700' as const,
      fontVariant: ['tabular-nums'] as any,
    } as any,
    rowUnit: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '400' as const,
    } as const,
  };

  return (
    <Animated.View style={[rowStyles.row, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={rowStyles.rowDot} />
      <Text style={rowStyles.rowName} numberOfLines={1}>{item.name}</Text>
      <Text style={rowStyles.rowQuantity}>
        {item.quantity}
        <Text style={rowStyles.rowUnit}> {item.unit}</Text>
      </Text>
    </Animated.View>
  );
}

export function ResourceCounter({ items, compact = false, animate = false }: ResourceCounterProps) {
  const { colors, spacing, radii } = useTheme();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  
  const dynamicStyles = {
    container: {
      backgroundColor: colors.bgPrimary,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      gap: spacing.md,
    } as const,
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    } as const,
    headerTitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 2,
    } as const,
    totalBadge: {
      backgroundColor: `${colors.oxygen}10`,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: `${colors.oxygen}30`,
    } as const,
    totalText: {
      color: colors.oxygen,
      fontSize: 11,
      fontWeight: '600' as const,
    } as const,
    list: {
      gap: spacing.xs,
    } as const,
    empty: {
      alignItems: 'center' as const,
      paddingVertical: 20,
      gap: spacing.xs,
    } as const,
    emptyIcon: {
      fontSize: 28,
      color: 'rgba(255, 255, 255, 0.15)',
    } as const,
    emptyText: {
      color: colors.textSecondary,
      fontSize: 13,
    } as const,
    compactContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.bgPrimary,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    } as const,
    compactIcon: {
      fontSize: 12,
      color: colors.success,
    } as const,
    compactCount: {
      color: colors.oxygen,
      fontSize: 14,
      fontWeight: '800' as const,
      fontVariant: ['tabular-nums'] as any,
    } as any,
    compactLabel: {
      color: colors.textSecondary,
      fontSize: 11,
    } as const,
  };

  if (compact) {
    return (
      <View style={dynamicStyles.compactContainer}>
        <Text style={dynamicStyles.compactIcon}>⬡</Text>
        <Text style={dynamicStyles.compactCount}>{totalItems}</Text>
        <Text style={dynamicStyles.compactLabel}>recursos</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={dynamicStyles.empty}>
        <Text style={dynamicStyles.emptyIcon}>⬡</Text>
        <Text style={dynamicStyles.emptyText}>Sin recursos recolectados</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>RECURSOS</Text>
        <View style={dynamicStyles.totalBadge}>
          <Text style={dynamicStyles.totalText}>{totalItems} unidades</Text>
        </View>
      </View>
      <View style={dynamicStyles.list}>
        {items.map((item) => (
          <AnimatedRow key={item.resourceId} item={item} animate={animate} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});