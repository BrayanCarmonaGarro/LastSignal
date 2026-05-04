// src/components/trips/markers/SupplyDropMarker.tsx
import React from 'react';
import { BaseMapMarker } from './BaseMapMarker';
import type { SupplyDrop } from '@/store/tripStore';

interface Props {
  supply: SupplyDrop;
  onPress?: (supply: SupplyDrop) => void;
}

export function SupplyDropMarker({ supply, onPress }: Props) {
  const isCollected = supply.status === 'COLLECTED';

  return (
    <BaseMapMarker
      coordinate={{ latitude: supply.latitude, longitude: supply.longitude }}
      icon={isCollected ? '✓' : '📦'}
      color={isCollected ? '#22c55e' : '#f59e0b'}
      size="sm"
      shape="circle"
      status={isCollected ? 'collected' : 'active'}
      callout={{
        title: 'Suministro',
        badge: {
          label: isCollected ? 'Recolectado' : `${supply.items?.length ?? 0} items`,
          color: isCollected ? '#22c55e' : '#f59e0b',
        },
        actions: [
          {
            label: isCollected ? 'Ya recolectado' : 'Ir aquí',
            disabled: isCollected,
            onPress: () => !isCollected && onPress?.(supply),
          },
        ],
      }}
      onPress={() => onPress?.(supply)}
    />
  );
}