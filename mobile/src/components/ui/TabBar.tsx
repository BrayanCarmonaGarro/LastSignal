// src/components/ui/TabBar.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { iconActive: IoniconName; iconInactive: IoniconName; label: string }> = {
  dashboard: {
    iconActive:   'home',
    iconInactive: 'home-outline',
    label: 'Base',
  },
  logbook: {
    iconActive:   'book',
    iconInactive: 'book-outline',
    label: 'Bitácora',
  },
  resources: {
    iconActive:   'cube',
    iconInactive: 'cube-outline',
    label: 'Recursos',
  },
  trips: {
    iconActive:   'map',
    iconInactive: 'map-outline',
    label: 'Viajes',
  },
};

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, spacing, layout, fonts, fontSizes, borderWidths, radii, shadows } = useTheme();
  const router = useRouter();

  const visibleRoutes = state.routes.filter((r) => TAB_CONFIG[r.name]);
  const leftRoutes  = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  const renderTab = (route: (typeof state.routes)[0]) => {
    const isFocused = state.routes[state.index]?.name === route.name;
    const config = TAB_CONFIG[route.name];
    const iconName = isFocused ? config.iconActive : config.iconInactive;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.tab,
          isFocused && {
            borderTopWidth: 2,
            borderTopColor: colors.primary,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={config.label}
      >
        <Ionicons
          name={iconName}
          size={isFocused ? 24 : 22}
          color={isFocused ? colors.primary : colors.textMuted}
        />
        <Text
          style={{
            fontFamily: fonts.caption,
            fontSize: fontSizes.micro,
            color: isFocused ? colors.primary : colors.textMuted,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginTop: 3,
          }}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.borderDefault,
          borderTopWidth: borderWidths.thin,
          height: layout.tabBarHeight + (Platform.OS === 'ios' ? 20 : 0),
          paddingBottom: Platform.OS === 'ios' ? 20 : spacing.sm,
        },
      ]}
    >
      <View style={styles.side}>
        {leftRoutes.map(renderTab)}
      </View>

      {/* Botón central flotante */}
      <View style={styles.centerWrapper}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tabs)/logbook/newEntry')}
          activeOpacity={0.85}
          style={[
            styles.captureButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.full,
              ...shadows.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Capturar forma de vida"
        >
          <Ionicons name="camera" size={26} color={colors.bgPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.side}>
        {rightRoutes.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  centerWrapper: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});