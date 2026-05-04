/*
import React from "react";
import { Animated, ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/theme";
import { PULL_MAX_DISPLAY, PULL_THRESHOLD } from "@/hooks/useSwipeTabsGesture.utils";

const INDICATOR_SIZE = 40;
const INDICATOR_TOP = -INDICATOR_SIZE - 8; // hidden above pager top

interface Props {
  pullOffset: Animated.Value;
  isRefreshing?: boolean;
}

export function PullToRefreshIndicator({ pullOffset, isRefreshing }: Props) {
  const { colors } = useTheme();

  const translateY = pullOffset.interpolate({
    inputRange: [0, PULL_MAX_DISPLAY],
    outputRange: [INDICATOR_TOP, INDICATOR_TOP + PULL_MAX_DISPLAY],
    extrapolate: "clamp",
  });

  // Fade in as user pulls
  const opacity = pullOffset.interpolate({
    inputRange: [0, 20, PULL_MAX_DISPLAY],
    outputRange: [0, 0.6, 1],
    extrapolate: "clamp",
  });

  // Scale: grows slightly when past threshold
  const scale = pullOffset.interpolate({
    inputRange: [0, PULL_THRESHOLD * PULL_MAX_DISPLAY / PULL_THRESHOLD, PULL_MAX_DISPLAY],
    outputRange: [0.7, 1, 1.1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderColor: colors.borderDefault,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      {isRefreshing ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.iconWrapper}>
          <Ionicons
            name="arrow-down-outline"
            size={20}
            color={colors.primary}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    top: 0,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});
*/