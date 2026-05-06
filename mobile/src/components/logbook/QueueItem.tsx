import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/offline/useNetworkStatus';
import { photoQueue, type PendingPhoto } from '@/services/offline/queue';
import { STATUS_CONFIG } from '@/constants/queueStatus';

export function QueueItem({ item }: { item: PendingPhoto }) {
  const { colors, fonts, fontSizes, spacing, radii } = useTheme();
  const { isConnected } = useNetworkStatus();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const cfg = STATUS_CONFIG[item.status];
  const iconColor = colors[cfg.colorKey];

  useEffect(() => {
    if (item.status === 'done') {
      Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }).start();
    }
  }, [item.status]);

  const handleRetry = () => {
    photoQueue.retry(item.id);
    if (isConnected) photoQueue.flush();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
      }}
    >
      <Image
        source={{ uri: item.photoUri }}
        style={{ width: 52, height: 52, borderRadius: radii.lg, backgroundColor: colors.bgTertiary }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name={cfg.icon as any} size={14} color={iconColor} />
          <Text style={{ fontFamily: fonts.heading, fontSize: fontSizes.caption, color: iconColor }}>
            {cfg.label}
          </Text>
        </View>
        {item.status === 'error' && item.errorMessage && (
          <Text
            style={{
              fontFamily: fonts.caption,
              fontSize: fontSizes.micro,
              color: colors.textMuted,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {item.errorMessage}
          </Text>
        )}
      </View>
      {item.status === 'error' && (
        <TouchableOpacity onPress={handleRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: fontSizes.caption, color: colors.primary }}>
            Reintentar
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
