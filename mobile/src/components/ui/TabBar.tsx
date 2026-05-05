// src/components/ui/TabBar.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";
import { TAB_CONFIG, type TabKey } from "@/constants/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabNavigation } from "@/hooks/ui/useTabNavigation";
import TabBarItem from "@/components/ui/TabBarItem";
import { makeStyles } from "@/components/ui/TabBar.styles";

export default function TabBar({
  state,
  navigation,
}: Partial<BottomTabBarProps> = {}) {
  const theme = useTheme();
  const { colors, spacing, layout, shadows } = theme;
  const styles = makeStyles(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { activeTabName, routes, makeOnPress } = useTabNavigation(
    state,
    navigation,
  );

  const leftRoutes = routes.slice(0, 2);
  const rightRoutes = routes.slice(2);

  const renderTab = (route: { name: TabKey; key: string }) => {
    const isFocused = route.name === activeTabName;
    const config = TAB_CONFIG[route.name];
    const iconName = isFocused ? config.iconActive : config.iconInactive;

    return (
      <TabBarItem
        key={route.key}
        label={config.label}
        isFocused={isFocused}
        iconName={iconName}
        onPress={makeOnPress(route)}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm,
        },
      ]}
    >
      <View style={styles.side}>{leftRoutes.map(renderTab)}</View>

      {/* Botón central flotante */}
      <View style={styles.centerWrapper}>
        <TouchableOpacity
          onPress={() => router.push("/(app)/capture")}
          activeOpacity={0.85}
          style={[
            styles.captureButton,
            {
              marginBottom: insets.bottom > 0 ? insets.bottom : 16,
              ...shadows.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Capturar forma de vida"
        >
          <Ionicons name="camera" size={26} color={colors.bgPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.side}>{rightRoutes.map(renderTab)}</View>
    </View>
  );
}
