// src/app/(app)/(tabs)/trips/active.tsx
import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Modal,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE, LongPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActiveTripScreen } from "@/hooks/trip/useActiveTripScreen";
import { OxygenBar } from "@/components/trips/OxygenBar";
import { SupplyDropMarker } from "@/components/trips/markers/SupplyDropMarker";
import { WaypointMarker, DangerZoneMarker, BaseMapMarker } from "@/components/trips/markers";
import { useTripStore } from "@/store/tripStore";
import { createWaypoint, WAYPOINT_LIMIT } from "@/services/trip/waypointService";
import type { DangerSeverity } from "@/types/trip.types";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d0d1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8888aa" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a14" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#00d4ff22" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050510" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const toSeverity = (s: DangerSeverity) =>
  s.toLowerCase() as "low" | "medium" | "high";

export default function ActiveTripScreen() {
  const insets = useSafeAreaInsets();

  const {
    mapRef,
    oxygen,
    canEnd,
    routePoints,
    supplyDrops,
    waypoints,
    dangerZones,
    collectedCount,
    totalSupplies,
    handleEndTrip,
    handleDropPress,
  } = useActiveTripScreen();

  const { level, oxygenStatus, minutesRemaining, isConsuming } = oxygen;

  const baseCoordinate = routePoints[0] ?? null;

  // ── Waypoint modal state ──────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = React.useState(false);
  const [waypointName, setWaypointName] = React.useState("");
  const pendingCoords = useRef<{ latitude: number; longitude: number } | null>(null);

  const activeTrip     = useTripStore((s) => s.activeTrip);
  const storeWaypoints = useTripStore((s) => s.waypoints);
  const setWaypoints   = useTripStore((s) => s.setWaypoints);

  // ── Long press handler ────────────────────────────────────────────────────
  const handleLongPress = useCallback((e: LongPressEvent) => {
    if (!activeTrip) return;

    if (storeWaypoints.length >= WAYPOINT_LIMIT) {
      Alert.alert("Límite alcanzado", `Máximo ${WAYPOINT_LIMIT} waypoints por misión.`);
      return;
    }

    pendingCoords.current = e.nativeEvent.coordinate;
    setWaypointName("");
    setModalVisible(true);
  }, [activeTrip, storeWaypoints.length]);

  const handleConfirmWaypoint = useCallback(async () => {
    const coords = pendingCoords.current;
    if (!coords || !activeTrip) return;
    setModalVisible(false);

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      name: waypointName.trim() || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: "PENDING" as const,
      reached_at: null,
      trip_id: activeTrip.id,
    };

    const freshWaypoints = useTripStore.getState().waypoints;
    setWaypoints([...freshWaypoints, optimistic]);

    const saved = await createWaypoint(
      activeTrip.id,
      coords.latitude,
      coords.longitude,
      waypointName.trim() || null,
      freshWaypoints.length,
    );

    if (saved) {
      const afterSave = useTripStore.getState().waypoints;
      setWaypoints([
        ...afterSave.filter((w) => w.id !== tempId),
        saved,
      ]);
    }
  }, [activeTrip, waypointName, setWaypoints]);

  // ─────────────────────────────────────────────────────────────────────────

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
        onLongPress={handleLongPress}
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
          <SupplyDropMarker key={drop.id} supply={drop} onPress={handleDropPress} />
        ))}

        {waypoints.map((wp, index) => (
          <WaypointMarker
            key={wp.id}
            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
            index={index + 1}
            label={wp.name ?? undefined}
            visited={wp.status === "REACHED"}
          />
        ))}

        {dangerZones.map((zone) => (
          <DangerZoneMarker
            key={zone.id}
            coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
            label={zone.description ?? undefined}
            severity={toSeverity(zone.severity)}
          />
        ))}

        {baseCoordinate && (
          <BaseMapMarker
            coordinate={baseCoordinate}
            icon="🚀"
            color="#00d4ff"
            size="lg"
            shape="circle"
            pulseAnim
            callout={{
              title: "Nave base",
              subtitle: "Punto de retorno",
              badge: { label: `${minutesRemaining} min O₂`, color: "#00d4ff" },
            }}
          />
        )}
      </MapView>

      {/* HUD top */}
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

      {/* HUD bottom */}
      <View style={[styles.hudBottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routePoints.length}</Text>
            <Text style={styles.statLabel}>puntos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{collectedCount}/{totalSupplies}</Text>
            <Text style={styles.statLabel}>suministros</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, oxygenStatus !== "safe" && styles.statValueWarn]}>
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

      {/* Modal — nombre del waypoint */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo waypoint</Text>
            <Text style={styles.modalSubtitle}>
              Punto {storeWaypoints.length + 1} de {WAYPOINT_LIMIT}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre (opcional)"
              placeholderTextColor="#8888aa"
              value={waypointName}
              onChangeText={setWaypointName}
              maxLength={60}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnGhost}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={handleConfirmWaypoint}
              >
                <Text style={styles.modalBtnPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#050510" },
  hudTop:              { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  hudCard:             { borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10 },
  hudBottom:           { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 10 },
  statsRow:            { flexDirection: "row", backgroundColor: "#0a0a1aee", borderRadius: 14, borderWidth: 1, borderColor: "#ffffff10", paddingVertical: 12, paddingHorizontal: 8, alignItems: "center", justifyContent: "space-around" },
  statItem:            { alignItems: "center", gap: 2 },
  statValue:           { color: "#dde0ff", fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
  statValueWarn:       { color: "#ffcc00" },
  statLabel:           { color: "#8888aa", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  statDivider:         { width: 1, height: 28, backgroundColor: "#ffffff15" },
  endBtn:              { backgroundColor: "#ff444422", borderWidth: 1, borderColor: "#ff444466", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#ff4444", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  endBtnDisabled:      { opacity: 0.4 },
  endBtnText:          { color: "#ff8888", fontSize: 14, fontWeight: "800", letterSpacing: 2 },
  modalOverlay:        { flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  modalCard:           { width: "100%", backgroundColor: "#0d0d1f", borderRadius: 16, borderWidth: 1, borderColor: "#8b5cf630", padding: 20, gap: 12 },
  modalTitle:          { color: "#dde0ff", fontSize: 16, fontWeight: "800" },
  modalSubtitle:       { color: "#8888aa", fontSize: 11, marginTop: -6 },
  modalInput:          { backgroundColor: "#ffffff08", borderWidth: 1, borderColor: "#8b5cf630", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: "#dde0ff", fontSize: 14 },
  modalActions:        { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtnGhost:       { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: "#ffffff15" },
  modalBtnGhostText:   { color: "#8888aa", fontSize: 13, fontWeight: "600" },
  modalBtnPrimary:     { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: "#8b5cf620", borderWidth: 1, borderColor: "#8b5cf650" },
  modalBtnPrimaryText: { color: "#8b5cf6", fontSize: 13, fontWeight: "700" },
});