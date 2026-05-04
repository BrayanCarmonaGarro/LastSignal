// src/components/trips/markers/DangerZoneMarker.tsx
import React from 'react';
import { BaseMapMarker } from './BaseMapMarker';

interface Props {
  coordinate: { latitude: number; longitude: number };
  label?: string;
  severity?: 'low' | 'medium' | 'high';
  onPress?: (description: string) => void;
}

const SEVERITY_COLOR = { low: '#f59e0b', medium: '#f97316', high: '#ef4444' };

export function DangerZoneMarker({ coordinate, label, severity = 'medium', onPress }: Props) {
  const color = SEVERITY_COLOR[severity];

  return (
    <BaseMapMarker
      coordinate={coordinate}
      icon="⚠️"
      color={color}
      size="md"
      shape="circle"
      status="danger"
      pulseAnim              // <- anillo pulsante activado
      callout={{
        title: 'Zona de peligro',
        badge: { label: severity.toUpperCase(), color },
        subtitle: label,
        actions: onPress ? [{ label: 'Ver detalles', onPress: () => onPress(label ?? 'Sin descripción') }] : [],
      }}
      onPress={onPress ? () => onPress(label ?? 'Sin descripción') : undefined}
    />
  );
}