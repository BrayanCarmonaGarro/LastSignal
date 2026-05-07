import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes } = useTheme();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 80, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    if (type !== 'error') {
      const timer = setTimeout(dismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const bgColor      = type === 'success' ? colors.successDim  : type === 'error' ? colors.dangerBg   : colors.bgTertiary;
  const borderColor  = type === 'success' ? colors.success     : type === 'error' ? colors.danger      : colors.primaryLight;
  const textColor    = type === 'success' ? colors.textSuccess : type === 'error' ? colors.textDanger  : colors.primaryLight;
  const iconName     = type === 'success' ? 'checkmark-circle-outline' : type === 'error' ? 'alert-circle-outline' : 'information-circle-outline';

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 32,
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 1000,
          borderRadius: radii.xl,
          borderWidth: borderWidths.base,
          borderLeftWidth: borderWidths.accent,
          borderColor,
          borderLeftColor: borderColor,
          backgroundColor: bgColor,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Ionicons name={iconName} size={iconSizes.md} color={borderColor} />
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: fontSizes.body, color: textColor }}>
        {message}
      </Text>
      {type === 'error' && (
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-outline" size={iconSizes.md} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
