// src/components/trips/markers/SupplyDropMarker.tsx
import React from 'react';
import { BaseOverlayMarker } from './BaseOverlayMarker';
import type { SupplyDrop } from '@/store/tripStore';
import type { MarkerSize, MarkerShape } from './BaseOverlayMarker';

interface Props {
  supply: SupplyDrop;
  screenX: number;
  screenY: number;
  onPress?: (supply: SupplyDrop) => void;
  showCallout?: boolean;
}

type Rarity = 'LOW' | 'MEDIUM' | 'HIGH';

function getRarity(itemCount: number): Rarity {
  if (itemCount >= 3) return 'HIGH';
  if (itemCount === 2) return 'MEDIUM';
  return 'LOW';
}

const RARITY_CONFIG: Record<Rarity, {
  color: string;
  size: MarkerSize;
  shape: MarkerShape;
  pulse: boolean;
  icon: string;
  label: string;
}> = {
  LOW: {
    color: '#f59e0b',
    size: 'sm',
    shape: 'circle',
    pulse: false,
    icon: '📦',
    label: 'Común',
  },
  MEDIUM: {
    color: '#f97316',
    size: 'md',
    shape: 'square',
    pulse: false,
    icon: '📦',
    label: 'Escaso',
  },
  HIGH: {
    color: '#a855f7',
    size: 'md',
    shape: 'diamond',
    pulse: true,
    icon: '💎',
    label: 'Raro',
  },
};

const COLLECTED_CONFIG = {
  color: '#22c55e',
  size: 'sm' as MarkerSize,
  shape: 'circle' as MarkerShape,
  pulse: false,
  icon: '✓',
  label: 'Recolectado',
};

export function SupplyDropMarker({
  supply,
  screenX,
  screenY,
  onPress,
  showCallout = true,
}: Props) {
  const isCollected = supply.status === 'COLLECTED';
  const itemCount = supply.items?.length ?? 0;
  const rarity = getRarity(itemCount);

  const cfg = isCollected ? COLLECTED_CONFIG : RARITY_CONFIG[rarity];

  return (
    <BaseOverlayMarker
      screenX={screenX}
      screenY={screenY}
      icon={cfg.icon}
      color={cfg.color}
      size={cfg.size}
      shape={cfg.shape}
      status={isCollected ? 'collected' : 'active'}
      pulseAnim={cfg.pulse}
      callout={
        showCallout
          ? {
              title: 'Suministro',
              badge: {
                label: isCollected
                  ? '✓ Recolectado'
                  : `${cfg.label} · ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
                color: cfg.color,
              },
              actions: [
                {
                  label: isCollected ? 'Ya recolectado' : 'Ir aquí',
                  disabled: isCollected,
                  onPress: () => !isCollected && onPress?.(supply),
                },
              ],
            }
          : undefined
      }
      onPress={() => onPress?.(supply)}
    />
  );
}