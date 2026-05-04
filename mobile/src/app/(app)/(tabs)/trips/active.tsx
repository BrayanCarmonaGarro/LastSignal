// src/app/(app)/(tabs)/trips/active.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActiveTripScreen } from "@/hooks/trip/useActiveTripScreen";
import { OxygenBar } from "@/components/trips/OxygenBar";
import { MapMarker } from "@/components/trips/MapMarker";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d0d1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8888aa" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a14" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#00d4ff22" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#050510" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export default function ActiveTripScreen() {
  const insets = useSafeAreaInsets();
  const {
    mapRef,
    oxygen,
    canEnd,
    routePoints,
    supplyDrops,
    collectedCount,
    totalSupplies,
    handleEndTrip,
    handleDropPress,
  } = useActiveTripScreen();

  const { level, oxygenStatus, minutesRemaining, isConsuming } = oxygen;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: 9.9281,
          longitude: -84.0907,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor="#00d4ff"
            strokeWidth={2.5}
            lineDashPattern={[8, 4]}
          />
        )}

        {supplyDrops.map((drop) => (
          <MapMarker key={drop.id} supply={drop} onPress={handleDropPress} />
        ))}
      </MapView>

      {/* HUD superior */}
      <View style={[styles.hudTop, { paddingTop: insets.top + 8 }]}>
        <View style={styles.hudCard}>
          <OxygenBar
            level={level}
            oxygenStatus={oxygenStatus}
            minutesRemaining={minutesRemaining}
            isConsuming={isConsuming}
          />
        </View>
      </View>

      {/* HUD inferior */}
      <View style={[styles.hudBottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routePoints.length}</Text>
            <Text style={styles.statLabel}>puntos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {collectedCount}/{totalSupplies}
            </Text>
            <Text style={styles.statLabel}>suministros</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                oxygenStatus !== "safe" && styles.statValueWarn,
              ]}
            >
              {minutesRemaining} min
            </Text>
            <Text style={styles.statLabel}>O₂ restante</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.endBtn, !canEnd && styles.endBtnDisabled]}
          onPress={handleEndTrip}
          disabled={!canEnd}
          activeOpacity={0.8}
        >
          <Text style={styles.endBtnText}>◉ FINALIZAR VIAJE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
  },
  hudTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  hudCard: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  hudBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#0a0a1aee",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff10",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    color: "#dde0ff",
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statValueWarn: {
    color: "#ffcc00",
  },
  statLabel: {
    color: "#8888aa",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#ffffff15",
  },
  endBtn: {
    backgroundColor: "#ff444422",
    borderWidth: 1,
    borderColor: "#ff444466",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#ff4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  endBtnDisabled: {
    opacity: 0.4,
  },
  endBtnText: {
    color: "#ff8888",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
