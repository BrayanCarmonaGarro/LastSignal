// src/components/trips/MapMarker.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { SupplyDrop } from '@/store/tripStore';

interface MapMarkerProps {
  supply: SupplyDrop;
  onPress?: (supply: SupplyDrop) => void;
}

export function MapMarker({ supply, onPress }: MapMarkerProps) {
  const isCollected = supply.status === 'COLLECTED';

  return (
    <Marker
      coordinate={{ latitude: supply.latitude, longitude: supply.longitude }}
      onPress={() => onPress?.(supply)}
    >
      <View style={[styles.pin, isCollected && styles.pinCollected]}>
        <Text style={styles.pinIcon}>{isCollected ? '✓' : '📦'}</Text>
      </View>

      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Suministro</Text>
          {isCollected ? (
            <Text style={styles.calloutBadgeCollected}>Recolectado</Text>
          ) : (
            <Text style={styles.calloutBadgePending}>
              {supply.items?.length ?? 0} items
            </Text>
          )}
          <TouchableOpacity
            style={[styles.calloutButton, isCollected && styles.calloutButtonDisabled]}
            onPress={() => !isCollected && onPress?.(supply)}
            disabled={isCollected}
          >
            <Text style={styles.calloutButtonText}>
              {isCollected ? 'Ya recolectado' : 'Ir aquí'}
            </Text>
          </TouchableOpacity>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  pinCollected: {
    backgroundColor: '#0d2e0d',
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
  },
  pinIcon: {
    fontSize: 20,
  },
  callout: {
    backgroundColor: '#0d0d1a',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    borderWidth: 1,
    borderColor: '#00d4ff33',
    gap: 6,
  },
  calloutTitle: {
    color: '#e0e0ff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  calloutBadgePending: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '500',
  },
  calloutBadgeCollected: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '500',
  },
  calloutButton: {
    marginTop: 6,
    backgroundColor: '#00d4ff22',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#00d4ff55',
    alignItems: 'center',
  },
  calloutButtonDisabled: {
    backgroundColor: '#00ff8811',
    borderColor: '#00ff8833',
  },
  calloutButtonText: {
    color: '#e0e0ff',
    fontSize: 12,
    fontWeight: '600',
  },
});