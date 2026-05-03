// src/components/trips/OxygenBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { OxygenStatus } from '@/hooks/trip/useOxygen';

interface OxygenBarProps { 
  level: number;
  oxygenStatus: OxygenStatus;
  minutesRemaining: number; 
  isConsuming: boolean;
  compact?: boolean;
}

const STATUS_COLOR: Record<OxygenStatus, string> = {
  safe:     '#00d4ff',
  warning:  '#ffcc00',
  critical: '#ff4444',
  empty:    '#440000',
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fillAnim  = useRef(new Animated.Value(level)).current;

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

  const color = STATUS_COLOR[oxygenStatus];

  const barWidth = fillAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  if (compact) {
    return (
      <View style={styles.compact}>
        <Animated.Text style={[styles.compactIcon, { opacity: pulseAnim, color }]}>
          ◉
        </Animated.Text>
        <View style={styles.compactTrack}>
          <Animated.View style={[styles.compactFill, { width: barWidth, backgroundColor: color }]} />
        </View>
        <Text style={[styles.compactLevel, { color }]}>{Math.round(level)}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.Text style={[styles.icon, { opacity: pulseAnim, color }]}>◉</Animated.Text>
          <Text style={styles.label}>OXÍGENO</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.statusBadge, { color, borderColor: color }]}>
            {STATUS_LABEL[oxygenStatus]}
          </Text>
        </View>
      </View>

      {/* Barra principal */}
      <View style={styles.track}>
        {/* Segmentos de fondo */}
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.segment} />
        ))}
        {/* Fill animado */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: barWidth,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.levelText, { color }]}>{level.toFixed(1)}%</Text>
        <View style={styles.footerCenter}>
          {isConsuming && (
            <View style={styles.consumingDot}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.consumingText, { color }]}>CONSUMIENDO</Text>
            </View>
          )}
        </View>
        <Text style={styles.timeText}>
          {oxygenStatus === 'empty' ? '--' : `${minutesRemaining} min`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffffff10',
    gap: 8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {},
  icon: {
    fontSize: 14,
  },
  label: {
    color: '#8888aa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  track: {
    height: 18,
    backgroundColor: '#ffffff08',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ffffff10',
    position: 'relative',
  },
  segment: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#ffffff08',
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
    color: '#8888aa',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0a0a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  compactIcon: {
    fontSize: 10,
  },
  compactTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#ffffff10',
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