// src/components/trips/MapMarker.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { SupplyDrop } from '@/store/tripStore';
import { useTheme } from '@/constants/theme';

interface MapMarkerProps {
  supply: SupplyDrop;
  onPress?: (supply: SupplyDrop) => void;
}

export function MapMarker({ supply, onPress }: MapMarkerProps) {
  const { colors, spacing, radii, shadows } = useTheme();
  const isCollected = supply.status === 'COLLECTED';
  
  const dynamicStyles = {
    pin: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.oxygenBg,
      borderWidth: 2,
      borderColor: colors.oxygen,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.oxygen,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 6,
    } as const,
    pinCollected: {
      backgroundColor: colors.successDim,
      borderColor: colors.success,
      shadowColor: colors.success,
    } as const,
    callout: {
      backgroundColor: colors.bgPrimary,
      borderRadius: radii.lg,
      padding: spacing.md,
      minWidth: 160,
      borderWidth: 1,
      borderColor: `${colors.oxygen}15`,
      gap: spacing.xs,
    } as const,
    calloutTitle: {
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 14,
      marginBottom: 2,
    } as const,
    calloutBadgePending: {
      color: colors.oxygen,
      fontSize: 12,
      fontWeight: '500',
    } as const,
    calloutBadgeCollected: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '500',
    } as const,
    calloutButton: {
      marginTop: spacing.xs,
      backgroundColor: `${colors.oxygen}15`,
      borderRadius: radii.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: `${colors.oxygen}40`,
      alignItems: 'center' as const,
    } as const,
    calloutButtonDisabled: {
      backgroundColor: `${colors.success}10`,
      borderColor: `${colors.success}30`,
    } as const,
    calloutButtonText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    } as const,
  };

  return (
    <Marker
      coordinate={{ latitude: supply.latitude, longitude: supply.longitude }}
      onPress={() => onPress?.(supply)}
    >
      <View style={[dynamicStyles.pin, isCollected && dynamicStyles.pinCollected]}>
        <Text style={styles.pinIcon}>{isCollected ? '✓' : '📦'}</Text>
      </View>

      <Callout tooltip>
        <View style={dynamicStyles.callout}>
          <Text style={dynamicStyles.calloutTitle}>Suministro</Text>
          {isCollected ? (
            <Text style={dynamicStyles.calloutBadgeCollected}>Recolectado</Text>
          ) : (
            <Text style={dynamicStyles.calloutBadgePending}>
              {supply.items?.length ?? 0} items
            </Text>
          )}
          <TouchableOpacity
            style={[dynamicStyles.calloutButton, isCollected && dynamicStyles.calloutButtonDisabled]}
            onPress={() => !isCollected && onPress?.(supply)}
            disabled={isCollected}
          >
            <Text style={dynamicStyles.calloutButtonText}>
              {isCollected ? 'Ya recolectado' : 'Ir aquí'}
            </Text>
          </TouchableOpacity>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pinIcon: {
    fontSize: 20,
  },
});