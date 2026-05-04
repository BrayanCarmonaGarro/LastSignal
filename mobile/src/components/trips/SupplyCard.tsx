// src/components/trips/SupplyCard.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import type { SupplyDrop } from '@/store/tripStore';
import { useTheme } from '@/constants/theme';

interface SupplyCardProps {
  supply: SupplyDrop;
  distanceMeters?: number;
  onCollect?: (supply: SupplyDrop) => void;
  onNavigate?: (supply: SupplyDrop) => void;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function SupplyCard({
  supply,
  distanceMeters,
  onCollect,
  onNavigate,
}: SupplyCardProps) {
  const { colors, spacing, radii } = useTheme();
  const isCollected = supply.status === 'COLLECTED';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const dynamicStyles = {
    wrapper: {
      marginBottom: spacing.md,
    } as const,
    card: {
      backgroundColor: colors.bgPrimary,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: `${colors.oxygen}15`,
      flexDirection: 'row' as const,
      overflow: 'hidden' as const,
    } as const,
    cardCollected: {
      borderColor: `${colors.success}15`,
      opacity: 0.75,
    } as const,
    accent: {
      width: 4,
    } as const,
    accentPending: {
      backgroundColor: colors.oxygen,
    } as const,
    accentCollected: {
      backgroundColor: colors.success,
    } as const,
    content: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.md,
    } as const,
    topRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    } as const,
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as const,
    icon: {
      fontSize: 18,
    } as const,
    titleBlock: {
      flex: 1,
      gap: spacing.xs,
      paddingRight: spacing.xs,
    } as const,
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    } as const,
    distanceRow: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: 3,
    } as const,
    distanceDot: {
      color: colors.oxygen,
      fontSize: 10,
    } as const,
    distanceText: {
      color: colors.textSecondary,
      fontSize: 12,
    } as const,
    collectedAt: {
      color: `${colors.success}55`,
      fontSize: 11,
    } as const,
    rightBlock: {
      alignItems: 'flex-end' as const,
      justifyContent: 'space-between',
      minWidth: 50,
      gap: spacing.xs,
    } as const,
    badge: {
      borderRadius: radii.md,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
    } as const,
    badgePending: {
      backgroundColor: `${colors.oxygen}10`,
      borderColor: `${colors.oxygen}40`,
    } as const,
    badgeCollected: {
      backgroundColor: `${colors.success}10`,
      borderColor: `${colors.success}40`,
    } as const,
    badgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    } as const,
    badgeTextPending: {
      color: colors.oxygen,
    } as const,
    badgeTextCollected: {
      color: colors.success,
    } as const,
    totalCorner: {
      alignItems: 'flex-end' as const,
    } as const,
    totalNum: {
      color: colors.oxygen,
      fontSize: 18,
      fontWeight: '800',
    } as const,
    totalNumCollected: {
      color: colors.success,
    } as const,
    totalUnit: {
      color: colors.textSecondary,
      fontSize: 9,
    } as const,
    itemsRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 5,
    } as const,
    itemChip: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: radii.md,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    } as const,
    itemText: {
      color: colors.textPrimary,
      fontSize: 11,
    } as const,
    itemTextMuted: {
      color: colors.textSecondary,
      fontSize: 11,
    } as const,
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    } as const,
    btnNavigate: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: `${colors.oxygen}15`,
      borderWidth: 1,
      borderColor: `${colors.oxygen}40`,
      alignItems: 'center' as const,
    } as const,
    btnNavigateText: {
      color: colors.oxygen,
      fontSize: 12,
      fontWeight: '700',
    } as const,
    btnCollect: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: `${colors.success}15`,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
      alignItems: 'center' as const,
    } as const,
    btnCollectText: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '700',
    } as const,
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const totalItems = supply.items?.length ?? 0;

  return (
    <Animated.View style={[dynamicStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isCollected && onNavigate?.(supply)}
        style={[dynamicStyles.card, isCollected && dynamicStyles.cardCollected]}
        disabled={isCollected}
      >
        <View
          style={[
            dynamicStyles.accent,
            isCollected ? dynamicStyles.accentCollected : dynamicStyles.accentPending,
          ]}
        />

        <View style={dynamicStyles.content}>
          <View style={dynamicStyles.topRow}>
            <View style={dynamicStyles.iconWrapper}>
              <Text style={dynamicStyles.icon}>{isCollected ? '✓' : '📦'}</Text>
            </View>

            <View style={dynamicStyles.titleBlock}>
              <Text style={dynamicStyles.title} numberOfLines={1}>
                Suministro
              </Text>

              {distanceMeters !== undefined && !isCollected && (
                <View style={dynamicStyles.distanceRow}>
                  <Text style={dynamicStyles.distanceDot}>◎</Text>
                  <Text style={dynamicStyles.distanceText}>
                    {formatDistance(distanceMeters)}
                  </Text>
                </View>
              )}

              {isCollected && supply.collected_at && (
                <Text style={dynamicStyles.collectedAt}>
                  Recolectado a las{' '}
                  {new Date(supply.collected_at).toLocaleTimeString('es-CR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>

            <View style={dynamicStyles.rightBlock}>
              <View
                style={[
                  dynamicStyles.badge,
                  isCollected ? dynamicStyles.badgeCollected : dynamicStyles.badgePending,
                ]}
              >
                <Text
                  style={[
                    dynamicStyles.badgeText,
                    isCollected
                      ? dynamicStyles.badgeTextCollected
                      : dynamicStyles.badgeTextPending,
                  ]}
                >
                  {isCollected ? 'LISTO' : 'PENDIENTE'}
                </Text>
              </View>

              <View style={dynamicStyles.totalCorner}>
                <Text
                  style={[
                    dynamicStyles.totalNum,
                    isCollected && dynamicStyles.totalNumCollected,
                  ]}
                >
                  {totalItems}
                </Text>
                <Text style={dynamicStyles.totalUnit}>items</Text>
              </View>
            </View>
          </View>

{supply.items?.length > 0 && (
            <View style={dynamicStyles.itemsRow}>
              {supply.items.slice(0, 3).map((item) => {
                const name = item.base_resource?.name ?? 'Recurso';
                const unit = item.base_resource?.unit ?? 'u';

                return (
                  <View key={item.id} style={dynamicStyles.itemChip}>
                    <Text style={dynamicStyles.itemText} numberOfLines={1}>
                      {item.amount} {unit} · {name}
                    </Text>
                  </View>
                );
              })}

              {supply.items.length > 3 && (
                <View style={dynamicStyles.itemChip}>
                  <Text style={dynamicStyles.itemTextMuted}>
                    +{supply.items.length - 3} más
                  </Text>
                </View>
              )}
            </View>
          )}

          {!isCollected && (
            <View style={dynamicStyles.actions}>
              <TouchableOpacity
                style={dynamicStyles.btnNavigate}
                onPress={() => onNavigate?.(supply)}
                activeOpacity={0.75}
              >
                <Text style={dynamicStyles.btnNavigateText}>◎ Navegar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dynamicStyles.btnCollect}
                onPress={() => onCollect?.(supply)}
                activeOpacity={0.75}
              >
                <Text style={dynamicStyles.btnCollectText}>⬡ Recolectar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({});