import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useNetworkStatus } from '@/hooks/network/useNetworkStatus';

export function NetworkBanner() {
  const { isConnected, wasOffline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const show = () => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (isConnected === false) show();
    else if (wasOffline) {
      show();
      setTimeout(hide, 3000);
    } else {
      hide();
    }
  }, [isConnected, wasOffline]);

  const isOffline = isConnected === false;

  return (
    <Animated.View
      style={[
        styles.container,
        isOffline ? styles.offline : styles.online,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.icon}>{isOffline ? '📡' : '✅'}</Text>
      <View>
        <Text style={styles.title}>
          {isOffline ? 'Sin conexión' : '¡Conexión restaurada!'}
        </Text>
        <Text style={styles.subtitle}>
          {isOffline
            ? 'Los cambios se guardarán y sincronizarán al reconectarte.'
            : 'Todo está sincronizado.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    zIndex: 999,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  offline: { backgroundColor: '#1e1e2e' },
  online:  { backgroundColor: '#166534' },
  icon:    { fontSize: 24 },
  title:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  subtitle:{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
});