// src/components/resources/ResourceCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UIResource, ResourceStatus } from '@/types/resource.types';
import { resourcesTheme as T } from '@/constants/theme/screens/resources';
import { resourceColors } from '@/constants/theme/domain/resources';
import { getResourceIcon, MAX_AMOUNTS } from '@/constants/resources';

const TOTAL_BLOCKS = 10;
const TOTAL_DOTS = 5;

interface Props {
  resource: UIResource;
}

function StatusBadge({ status }: { status: ResourceStatus }) {
  if (status === 'NORMAL') return null;
  const color = status === 'CRITICAL' ? T.statusCritical : T.statusLow;
  const label = status === 'CRITICAL' ? 'CRÍTICO' : 'BAJO';
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ResourceCard({ resource }: Props) {
  const {
    name, category, unit, current_amount,
    percentage, status, trend, displayUnit, filledBlocks,
  } = resource;
  const maxAmount = MAX_AMOUNTS[name] ?? 100;

  const iconName = getResourceIcon(name, category) as keyof typeof Ionicons.glyphMap;
  const filledBarBlocks = Math.round((percentage / 100) * TOTAL_BLOCKS);

  const barColor =
    status === 'CRITICAL' ? T.statusCritical :
    status === 'LOW'      ? T.statusLow :
    T.barFilled;

  const trendArrow = trend === 'up' ? '↑' : '↓';
  const trendColor = trend === 'up' ? T.accentGreen : T.accentRed;

  return (
    <View style={styles.card}>
      {/* Fila superior: ícono + nombre + cantidad */}
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={20} color={resourceColors[category].primary} />
        </View>
        <Text style={styles.resourceName}>{name.toUpperCase()}</Text>
        <View style={styles.topRight}>
          <StatusBadge status={status} />
          <Text style={styles.amountText}>
            {current_amount}/{maxAmount} {displayUnit}
          </Text>
        </View>
      </View>

      {/* Barra de progreso segmentada */}
      <View style={styles.barRow}>
        {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.block,
              { backgroundColor: i < filledBarBlocks ? barColor : T.barEmpty },
            ]}
          />
        ))}
        <View style={styles.percentRow}>
          <Text style={[styles.percentText, { color: trendColor }]}>
            {Math.round(percentage)}%{trendArrow}
          </Text>
        </View>
      </View>

      {/* 5 puntos de estado */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < filledBlocks ? barColor : T.dotEmpty },
            ]}
          />
        ))}
        <Text style={styles.unitLabel}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 2,
    padding: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  resourceName: {
    flex: 1,
    fontFamily: 'BarlowCondensed-700',
    fontSize: 15,
    letterSpacing: 2,
    color: T.textPrimary,
  },
  topRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: T.textSecondary,
    letterSpacing: 0.5,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: 'BarlowCondensed-700',
    fontSize: 9,
    letterSpacing: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 2,
  },
  block: {
    flex: 1,
    height: 8,
    borderRadius: 1,
    borderWidth: 0.5,
    borderColor: T.borderLight,
  },
  percentRow: {
    marginLeft: 8,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  percentText: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  unitLabel: {
    marginLeft: 'auto',
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    color: T.textMuted,
    letterSpacing: 1,
  },
});
