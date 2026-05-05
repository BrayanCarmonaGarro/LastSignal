// src/components/trips/markers/DangerZoneMarker.tsx
import React from "react";
import { BaseOverlayMarker } from "./BaseOverlayMarker";
import { MaterialIcons } from "@expo/vector-icons";
import type { TripDangerZone } from "@/store/tripStore";

interface Props {
  screenX: number;
  screenY: number;
  zone: TripDangerZone;
  showCallout?: boolean;
}

const SEVERITY_COLOR = {
  LOW: "#f59e0b",
  MEDIUM: "#f97316",
  HIGH: "#ef4444",
};

export function DangerZoneMarker({
  screenX,
  screenY,
  zone,
  showCallout = true,
  onPress,
}: Props & { onPress?: (zone: TripDangerZone) => void }) {
  const color = SEVERITY_COLOR[zone.severity];

  return (
    <BaseOverlayMarker
      screenX={screenX}
      screenY={screenY}
      icon={<MaterialIcons name="warning" size={28} color={color} />}
      color={color}
      size="xl"
      shape="circle"
      status="danger"
      pulseAnim
      callout={
        showCallout
          ? {
              title: "Zona de peligro",
              badge: { label: zone.severity, color },
              subtitle: zone.description ?? undefined,
              actions: onPress
                ? [{ label: "Ver detalles", onPress: () => onPress(zone) }]
                : [],
            }
          : undefined
      }
      onPress={onPress ? () => onPress(zone) : undefined}
    />
  );
}