import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/network/useNetworkStatus';

export function NetworkBanner() {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes } = useTheme();
  const { isConnected, wasOffline } = useNetworkStatus();

  const translateY    = useRef(new Animated.Value(-80)).current;
  const opacity       = useRef(new Animated.Value(0)).current;
  const panX          = useRef(new Animated.Value(0)).current;
  const [dismissed, setDismissed] = useState(false);

  const isOffline = isConnected === false;

  useEffect(() => { setDismissed(false); panX.setValue(0); }, [isConnected]);

  const show = () => Animated.parallel([
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
  ]).start();

  const hide = () => Animated.parallel([
    Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
    Animated.timing(opacity,    { toValue: 0,   duration: 300, useNativeDriver: true }),
  ]).start();

  useEffect(() => {
    if (isOffline && !dismissed) show();
    else if (wasOffline) { show(); setTimeout(hide, 3000); }
    else hide();
  }, [isConnected, wasOffline, dismissed]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
    onPanResponderMove: (_, g) => panX.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 80) {
        Animated.parallel([
          Animated.timing(panX,    { toValue: g.dx > 0 ? 400 : -400, duration: 200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setDismissed(true));
      } else {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const accentColor = isOffline ? colors.primaryLight : colors.success;

  return (
    <Animated.View
      pointerEvents={isOffline ? 'auto' : 'none'}
      {...(isOffline ? pan.panHandlers : {})}
      style={[
        {
          position: 'absolute',
          top: 52,
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 999,
          borderRadius: radii.xl,
          borderWidth: borderWidths.base,
          borderLeftWidth: borderWidths.accent,
          borderColor: isOffline ? colors.borderDefault : colors.success,
          borderLeftColor: accentColor,
          backgroundColor: isOffline ? colors.bgTertiary : colors.successDim,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        },
        { transform: [{ translateY }, { translateX: panX }], opacity },
      ]}
    >
      <Ionicons
        name={isOffline ? 'cloud-offline-outline' : 'checkmark-circle-outline'}
        size={iconSizes.lg}
        color={accentColor}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: fontSizes.body, color: colors.textPrimary }}>
          {isOffline ? 'Sin conexión' : '¡Conexión restaurada!'}
        </Text>
        <Text style={{ fontFamily: fonts.caption, fontSize: fontSizes.caption, color: colors.textSecondary, marginTop: 2 }}>
          {isOffline
            ? 'Desliza para ocultar · Se sincronizará al reconectarte.'
            : 'Todo está sincronizado.'}
        </Text>
      </View>
    </Animated.View>
  );
}
