import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

interface Props {
  onDownload: () => void;
  onImageSearch: () => void;
}

export function LogbookFAB({ onDownload, onImageSearch }: Props) {
  const { colors, spacing, radii, fonts, fontSizes } = useTheme();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setOpen(!open);
  };

  const dialItem = (
    icon: React.ComponentProps<typeof Ionicons>['name'],
    label: string,
    index: number,
    onPress: () => void,
  ) => {
    const translateY = anim.interpolate({
      inputRange:  [0, 1],
      outputRange: [0, -(72 + index * 60)],
    });
    const opacity = anim.interpolate({
      inputRange:  [0, 0.5, 1],
      outputRange: [0, 0,   1],
    });

    return (
      <Animated.View
        key={label}
        style={[
          {
            position: 'absolute',
            bottom: 0,
            right: 0,
            alignItems: 'flex-end',
            flexDirection: 'row',
            gap: spacing.sm,
          },
          { transform: [{ translateY }], opacity },
        ]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <View
          style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: radii.xl,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderWidth: 1,
            borderColor: colors.borderDefault,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.caption,
              fontSize: fontSizes.micro,
              color: colors.textSecondary,
            }}
          >
            {label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setOpen(false); anim.setValue(0); onPress(); }}
          activeOpacity={0.85}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.bgSecondary,
            borderWidth: 1,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const rotation = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 80,
        right: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Speed dial items */}
      {dialItem('download-outline',  'Descargar offline',      1, onDownload)}
      {dialItem('image-search-outline' as any, 'Buscar forma de vida', 2, onImageSearch)}

      {/* Outer ring */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 1.5,
          borderColor: `${colors.primary}4D`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* FAB */}
        <TouchableOpacity
          onPress={toggle}
          onLongPress={toggle}
          activeOpacity={0.85}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.bgPrimary} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
