// src/components/trips/markers/WaypointMarker.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BaseMapMarker } from './BaseMapMarker';

interface Props {
  coordinate: { latitude: number; longitude: number };
  index: number;          // número del waypoint
  label?: string;
  visited?: boolean;
  onPress?: () => void;
}

export function WaypointMarker({ coordinate, index, label, visited, onPress }: Props) {
  return (
    <BaseMapMarker
      coordinate={coordinate}
      icon={<Text style={s.num}>{index}</Text>}
      color={visited ? '#6b7280' : '#8b5cf6'}
      size="md"
      shape="circle"
      status={visited ? 'inactive' : 'active'}
      callout={label ? {
        title: `Punto ${index}`,
        subtitle: label,
        actions: [{ label: 'Navegar aquí', onPress: onPress ?? (() => {}) }],
      } : undefined}
      onPress={onPress}
    />
  );
}

const s = StyleSheet.create({
  num: { fontSize: 14, fontWeight: '700', color: '#fff' },
});