// src/components/trips/markers/SupplyDropMarker.tsx
import React from 'react';
import { BaseOverlayMarker } from './BaseOverlayMarker';
import type { SupplyDrop } from '@/store/tripStore';

interface Props {
  supply: SupplyDrop;
  screenX: number;
  screenY: number;
  onPress?: (supply: SupplyDrop) => void;
  showCallout?: boolean;
}

export function SupplyDropMarker({ supply, screenX, screenY, onPress, showCallout = true }: Props) {
  const isCollected = supply.status === 'COLLECTED';
  const color = isCollected ? '#22c55e' : '#f59e0b';

  return (
    <BaseOverlayMarker
      screenX={screenX}
      screenY={screenY}
      icon={isCollected ? '✓' : '📦'}
      color={color}
      size="sm"
      shape="circle"
      status={isCollected ? 'collected' : 'active'}
      callout={showCallout ? {
        title: 'Suministro',
        badge: {
          label: isCollected ? 'Recolectado' : `${supply.items?.length ?? 0} items`,
          color,
        },
        actions: [
          {
            label: isCollected ? 'Ya recolectado' : 'Ir aquí',
            disabled: isCollected,
            onPress: () => !isCollected && onPress?.(supply),
          },
        ],
      } : undefined}
      onPress={() => onPress?.(supply)}
    />
  );
}