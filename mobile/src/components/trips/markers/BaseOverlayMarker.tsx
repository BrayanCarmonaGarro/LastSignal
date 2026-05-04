// src/components/trips/markers/BaseOverlayMarker.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useTheme } from "@/constants/theme";

export type MarkerShape = "circle" | "pin" | "diamond" | "square";
export type MarkerSize = "sm" | "md" | "lg" | "xl";
export type MarkerStatus = "active" | "collected" | "danger" | "inactive";

export interface CalloutAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}

export interface CalloutConfig {
  title: string;
  subtitle?: string;
  badge?: { label: string; color: string };
  actions?: CalloutAction[];
}

export interface BaseOverlayMarkerProps {
  screenX: number;
  screenY: number;
  icon: React.ReactNode;
  color: string;
  bgColor?: string;
  borderColor?: string;
  size?: MarkerSize;
  shape?: MarkerShape;
  status?: MarkerStatus;
  pulseAnim?: boolean;
  callout?: CalloutConfig;
  onPress?: () => void;
}

const SIZES: Record<MarkerSize, number> = { sm: 32, md: 44, lg: 56, xl: 68 };

export function BaseOverlayMarker({
  screenX,
  screenY,
  icon,
  color,
  bgColor,
  borderColor,
  size = "md",
  shape = "circle",
  status = "active",
  pulseAnim = false,
  callout,
  onPress,
}: BaseOverlayMarkerProps) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const [calloutVisible, setCalloutVisible] = React.useState(false);

  useEffect(() => {
    if (!pulseAnim) return;
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [pulseAnim]);

  const dim = SIZES[size];
  const pulseScale = status === "danger" ? 2 : 1.6;
  const containerDim = dim;
  const resolvedBg = bgColor ?? `${color}20`;
  const resolvedBorder = borderColor ?? color;

  const pinStyle = {
    width: dim,
    height: dim,
    backgroundColor: resolvedBg,
    borderColor: resolvedBorder,
    borderWidth: 2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...getShapeStyle(shape, dim),
    opacity: status === "inactive" ? 0.4 : 1,
  };

  const handlePress = () => {
    onPress?.();
    if (callout) setCalloutVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          s.markerContainer,
          {
            width: containerDim,
            height: containerDim,
            left: screenX - containerDim / 2,
            top: screenY - containerDim / 2,
          },
        ]}
      >
        {pulseAnim && (
          <Animated.View
            style={{
              position: "absolute",
              width: containerDim,
              height: containerDim,
              borderRadius: containerDim / 2,
              borderWidth: 2,
              borderColor: color,
              opacity: pulseOpacity,
              transform: [{ scale: pulse }],
            }}
          />
        )}
        <View style={pinStyle}>
          {typeof icon === "string" ? (
            <Text style={{ fontSize: dim * 0.5, textAlign: "center" }}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      </TouchableOpacity>

      {/* Callout como Modal flotante */}
      {callout && calloutVisible && (
        <Modal transparent animationType="fade" onRequestClose={() => setCalloutVisible(false)}>
          <Pressable style={s.modalBackdrop} onPress={() => setCalloutVisible(false)}>
            <View style={[s.callout, { backgroundColor: colors.bgPrimary, borderColor: `${color}20` }]}>
              <Text style={[s.calloutTitle, { color: colors.textPrimary }]}>{callout.title}</Text>

              {callout.badge && (
                <View style={[s.badge, { backgroundColor: `${callout.badge.color}20` }]}>
                  <Text style={[s.badgeText, { color: callout.badge.color }]}>
                    {callout.badge.label}
                  </Text>
                </View>
              )}

              {callout.subtitle && (
                <Text style={[s.calloutSubtitle, { color: colors.textSecondary }]}>
                  {callout.subtitle}
                </Text>
              )}

              {callout.actions?.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.actionBtn,
                    { borderColor: `${color}40`, backgroundColor: `${color}10` },
                    action.disabled && s.actionBtnDisabled,
                    action.variant === "ghost" && s.actionBtnGhost,
                  ]}
                  onPress={() => { action.onPress(); setCalloutVisible(false); }}
                  disabled={action.disabled}
                >
                  <Text style={[s.actionBtnText, { color: action.disabled ? colors.textSecondary : color }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

function getShapeStyle(shape: MarkerShape, dim: number) {
  switch (shape) {
    case "circle":  return { borderRadius: dim / 2 };
    case "square":  return { borderRadius: 6 };
    case "pin":     return { borderRadius: dim / 2, marginBottom: 8 };
    case "diamond": return { borderRadius: 4, transform: [{ rotate: "45deg" }] };
  }
}

const s = StyleSheet.create({
  markerContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000040",
    alignItems: "center",
    justifyContent: "center",
  },
  callout: {
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    borderWidth: 1,
    gap: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  calloutTitle:    { fontSize: 14, fontWeight: "700" },
  calloutSubtitle: { fontSize: 12 },
  badge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  actionBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, alignItems: "center", marginTop: 4 },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
});