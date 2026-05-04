import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";
import { makeStyles } from "./TabBar.styles";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabBarItemProps {
  label: string;
  isFocused: boolean;
  iconName: IoniconName;
  onPress: () => void;
}

export default function TabBarItem({
  label,
  isFocused,
  iconName,
  onPress,
}: TabBarItemProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tab, isFocused && styles.tabActive]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Ionicons
        name={iconName}
        size={isFocused ? 24 : 22}
        color={isFocused ? theme.colors.primary : theme.colors.textMuted}
      />
      <Text
        style={[
          styles.label,
          isFocused ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
