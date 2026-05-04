// src/components/trips/markers/WaypointMarker.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import { BaseOverlayMarker } from "./BaseOverlayMarker";

interface Props {
  screenX: number;
  screenY: number;
  index: number;
  label?: string;
  visited?: boolean;
  onPress?: (latitude: number, longitude: number) => void;
   showCallout?: boolean;
  latitude: number;
  longitude: number;
}

export function WaypointMarker({
  screenX,
  screenY,
  index,
  label,
  visited,
  onPress,
  latitude,
  longitude,
  showCallout = true,
}: Props) {
  const color = visited ? "#6b7280" : "#8b5cf6";

  return (
    <BaseOverlayMarker
      screenX={screenX}
      screenY={screenY}
      icon={<Text style={s.num}>{index}</Text>}
      color={color}
      size="md"
      shape="circle"
      status={visited ? "inactive" : "active"}
      callout={
        showCallout && label
          ? {
              title: `Punto ${index}`,
              subtitle: label,
              actions: [
                {
                  label: "Navegar aquí",
                  onPress: onPress ? () => onPress(latitude, longitude) : () => {},
                },
              ],
            }
          : undefined
      }
      onPress={onPress ? () => onPress(latitude, longitude) : undefined}
    />
  );
}

const s = StyleSheet.create({
  num: { fontSize: 14, fontWeight: "700", color: "#fff" },
});