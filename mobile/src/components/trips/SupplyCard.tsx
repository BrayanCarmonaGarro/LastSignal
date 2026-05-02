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
  const isCollected = supply.status === 'COLLECTED';
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isCollected && onNavigate?.(supply)}
        style={[styles.card, isCollected && styles.cardCollected]}
        disabled={isCollected}
      >
        <View
          style={[
            styles.accent,
            isCollected ? styles.accentCollected : styles.accentPending,
          ]}
        />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>{isCollected ? '✓' : '📦'}</Text>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={1}>
                Suministro
              </Text>

              {distanceMeters !== undefined && !isCollected && (
                <View style={styles.distanceRow}>
                  <Text style={styles.distanceDot}>◎</Text>
                  <Text style={styles.distanceText}>
                    {formatDistance(distanceMeters)}
                  </Text>
                </View>
              )}

              {isCollected && supply.collected_at && (
                <Text style={styles.collectedAt}>
                  Recolectado a las{' '}
                  {new Date(supply.collected_at).toLocaleTimeString('es-CR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>

            <View style={styles.rightBlock}>
              <View
                style={[
                  styles.badge,
                  isCollected ? styles.badgeCollected : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isCollected
                      ? styles.badgeTextCollected
                      : styles.badgeTextPending,
                  ]}
                >
                  {isCollected ? 'LISTO' : 'PENDIENTE'}
                </Text>
              </View>

              <View style={styles.totalCorner}>
                <Text
                  style={[
                    styles.totalNum,
                    isCollected && styles.totalNumCollected,
                  ]}
                >
                  {totalItems}
                </Text>
                <Text style={styles.totalUnit}>items</Text>
              </View>
            </View>
          </View>

{supply.items?.length > 0 && (
            <View style={styles.itemsRow}>
              {supply.items.slice(0, 3).map((item) => {
                const name = item.base_resource?.name ?? 'Recurso';  // ← cambiado
                const unit = item.base_resource?.unit ?? 'u';        // ← cambiado

                return (
                  <View key={item.id} style={styles.itemChip}>
                    <Text style={styles.itemText} numberOfLines={1}>
                      {item.amount} {unit} · {name}
                    </Text>
                  </View>
                );
              })}

              {supply.items.length > 3 && (
                <View style={styles.itemChip}>
                  <Text style={styles.itemTextMuted}>
                    +{supply.items.length - 3} más
                  </Text>
                </View>
              )}
            </View>
          )}

          {!isCollected && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnNavigate}
                onPress={() => onNavigate?.(supply)}
                activeOpacity={0.75}
              >
                <Text style={styles.btnNavigateText}>◎ Navegar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCollect}
                onPress={() => onCollect?.(supply)}
                activeOpacity={0.75}
              >
                <Text style={styles.btnCollectText}>⬡ Recolectar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#0d0d1f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00d4ff22',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardCollected: {
    borderColor: '#00ff8822',
    opacity: 0.75,
  },
  accent: {
    width: 4,
  },
  accentPending: {
    backgroundColor: '#00d4ff',
  },
  accentCollected: {
    backgroundColor: '#00ff88',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: 6,
  },
  title: {
    color: '#dde0ff',
    fontSize: 15,
    fontWeight: '700',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceDot: {
    color: '#00d4ff',
    fontSize: 10,
  },
  distanceText: {
    color: '#8888aa',
    fontSize: 12,
  },
  collectedAt: {
    color: '#00ff8888',
    fontSize: 11,
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 50,
    gap: 6,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgePending: {
    backgroundColor: '#00d4ff10',
    borderColor: '#00d4ff40',
  },
  badgeCollected: {
    backgroundColor: '#00ff8810',
    borderColor: '#00ff8840',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeTextPending: {
    color: '#00d4ff',
  },
  badgeTextCollected: {
    color: '#00ff88',
  },
  totalCorner: {
    alignItems: 'flex-end',
  },
  totalNum: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: '800',
  },
  totalNumCollected: {
    color: '#00ff88',
  },
  totalUnit: {
    color: '#8888aa',
    fontSize: 9,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  itemChip: {
    backgroundColor: '#ffffff08',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#ffffff0a',
  },
  itemText: {
    color: '#c0c0e0',
    fontSize: 11,
  },
  itemTextMuted: {
    color: '#8888aa',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnNavigate: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00d4ff15',
    borderWidth: 1,
    borderColor: '#00d4ff40',
    alignItems: 'center',
  },
  btnNavigateText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnCollect: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00ff8815',
    borderWidth: 1,
    borderColor: '#00ff8840',
    alignItems: 'center',
  },
  btnCollectText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '700',
  },
});