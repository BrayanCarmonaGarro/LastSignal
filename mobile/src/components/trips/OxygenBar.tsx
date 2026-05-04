// src/components/trips/OxygenBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { OxygenStatus } from '@/hooks/trip/useOxygen';
import { useTheme } from '@/constants/theme';

interface OxygenBarProps { 
  level: number;
  oxygenStatus: OxygenStatus;
  minutesRemaining: number; 
  isConsuming: boolean;
  compact?: boolean;
}

const getStatusColor = (status: OxygenStatus, colors: any): string => {
  const colorMap: Record<OxygenStatus, string> = {
    safe:     colors.oxygen,
    warning:  colors.warning,
    critical: colors.danger,
    empty:    colors.dangerBg,
  };
  return colorMap[status];
};

const STATUS_LABEL: Record<OxygenStatus, string> = {
  safe:     'NOMINAL',
  warning:  'ADVERTENCIA',
  critical: 'CRÍTICO',
  empty:    'VACÍO',
};

export function OxygenBar({
  level,
  oxygenStatus,
  minutesRemaining,
  isConsuming,
  compact = false,
}: OxygenBarProps) {
  const { colors, spacing, radii, fontSizes } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fillAnim  = useRef(new Animated.Value(level)).current;
  
  const color = getStatusColor(oxygenStatus, colors);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: level,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [level]);

  // Pulso en estado crítico
  useEffect(() => {
    if (oxygenStatus === 'critical' || oxygenStatus === 'empty') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [oxygenStatus]);

  const barWidth = fillAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const dynamicStyles = createStyles(colors, spacing, radii);
  
  if (compact) {
    return (
      <View style={dynamicStyles.compact}>
        <Animated.Text style={[dynamicStyles.compactIcon, { opacity: pulseAnim, color }]}>
          ◉
        </Animated.Text>
        <View style={dynamicStyles.compactTrack}>
          <Animated.View style={[dynamicStyles.compactFill, { width: barWidth, backgroundColor: color }]} />
        </View>
        <Text style={[dynamicStyles.compactLevel, { color }]}>{Math.round(level)}%</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <Animated.Text style={[dynamicStyles.icon, { opacity: pulseAnim, color }]}>◉</Animated.Text>
          <Text style={dynamicStyles.label}>OXÍGENO</Text>
        </View>
        <View style={dynamicStyles.headerRight}>
          <Text style={[dynamicStyles.statusBadge, { color, borderColor: color }]}>
            {STATUS_LABEL[oxygenStatus]}
          </Text>
        </View>
      </View>

      {/* Barra principal */}
      <View style={dynamicStyles.track}>
        {/* Segmentos de fondo */}
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={dynamicStyles.segment} />
        ))}
        {/* Fill animado */}
        <Animated.View
          style={[
            dynamicStyles.fill,
            {
              width: barWidth,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>

      {/* Footer */}
      <View style={dynamicStyles.footer}>
        <Text style={[dynamicStyles.levelText, { color }]}>{level.toFixed(1)}%</Text>
        <View style={dynamicStyles.footerCenter}>
          {isConsuming && (
            <View style={dynamicStyles.consumingDot}>
              <View style={[dynamicStyles.dot, { backgroundColor: color }]} />
              <Text style={[dynamicStyles.consumingText, { color }]}>CONSUMIENDO</Text>
            </View>
          )}
        </View>
        <Text style={dynamicStyles.timeText}>
          {oxygenStatus === 'empty' ? '--' : `${minutesRemaining} min`}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any, spacing: any, radii: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRight: {},
  icon: {
    fontSize: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  track: {
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radii.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  segment: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  footerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  consumingDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  consumingText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactIcon: {
    fontSize: 10,
  },
  compactTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactFill: {
    height: '100%',
    borderRadius: 3,
  },
  compactLevel: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'right',
  },
});

const styles = createStyles({}, {}, {});