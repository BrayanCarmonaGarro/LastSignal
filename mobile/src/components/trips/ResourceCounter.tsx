// src/components/trips/ResourceCounter.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

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
  const fadeAnim  = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animate ? 12 : 0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.row, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.rowDot} />
      <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.rowQuantity}>
        {item.quantity}
        <Text style={styles.rowUnit}> {item.unit}</Text>
      </Text>
    </Animated.View>
  );
}

export function ResourceCounter({ items, compact = false, animate = false }: ResourceCounterProps) {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactIcon}>⬡</Text>
        <Text style={styles.compactCount}>{totalItems}</Text>
        <Text style={styles.compactLabel}>recursos</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⬡</Text>
        <Text style={styles.emptyText}>Sin recursos recolectados</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RECURSOS</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{totalItems} unidades</Text>
        </View>
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <AnimatedRow key={item.resourceId} item={item} animate={animate} />
        ))}
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
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#8888aa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  totalBadge: {
    backgroundColor: '#00d4ff15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#00d4ff30',
  },
  totalText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '600',
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff05',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  rowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff88',
  },
  rowName: {
    flex: 1,
    color: '#c8c8e8',
    fontSize: 13,
    fontWeight: '500',
  },
  rowQuantity: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rowUnit: {
    color: '#8888aa',
    fontSize: 11,
    fontWeight: '400',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 28,
    color: '#ffffff20',
  },
  emptyText: {
    color: '#8888aa',
    fontSize: 13,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0a0a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  compactIcon: {
    fontSize: 12,
    color: '#00ff88',
  },
  compactCount: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  compactLabel: {
    color: '#8888aa',
    fontSize: 11,
  },
});