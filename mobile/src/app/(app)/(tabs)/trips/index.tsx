// src/app/(app)/(tabs)/trips/index.tsx
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useTheme } from "@/constants/theme";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrip } from "@/hooks/trip/useTrip";
import { useOxygen } from "@/hooks/trip/useOxygen";
import { useSupplies } from "@/hooks/trip/useSupplies";
import {
  useMarkerOverlay,
  type OverlayMarker,
} from "@/hooks/trip/useMarkerOverlay";

import { OxygenBar } from "@/components/trips/OxygenBar";
import { SupplyCard } from "@/components/trips/SupplyCard";
import { SupplyDropMarker } from "@/components/trips/markers/SupplyDropMarker";

import { tripService } from "@/services/trip/tripService";
import { useTripStore } from "@/store/tripStore";
import type { SupplyDrop } from "@/store/tripStore";
import * as Location from "expo-location";

import { TripEquipmentSheet } from "@/components/trips/TripEquipmentSheet";

type TabView = "map" | "list";

export default function TripsIndexScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [equipmentVisible, setEquipmentVisible] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>("map");
  const [selectedDrop, setSelectedDrop] = useState<SupplyDrop | null>(null);

  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const markDropCollected = useTripStore((s) => s.markDropCollected);

  const { activeTrip, canStart, start, end } = useTrip();
  const { level, oxygenStatus, minutesRemaining, isConsuming } = useOxygen();

  const {
    supplyDrops,
    availableDrops,
    nearbyDrops,
    isLoading,
    isOffline,
    isStale,
    error,
    refresh,
  } = useSupplies({ userLocation });

  const mapStyle = useMemo(
    () => [
      { elementType: "geometry", stylers: [{ color: colors.bgPrimary }] },
      { elementType: "labels.text.fill", stylers: [{ color: colors.textMuted }] },
      { elementType: "labels.text.stroke", stylers: [{ color: colors.bgSecondary }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: colors.bgTertiary }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: colors.bgSecondary }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
    ],
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bgPrimary },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        },
        headerEyebrow: {
          color: colors.textMuted,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 2,
          marginBottom: 2,
        },
        headerTitle: {
          color: colors.textPrimary,
          fontSize: 22,
          fontWeight: "800",
        },
        headerRight: {
          alignItems: "flex-end",
          gap: 4,
          paddingTop: 4,
        },
        offlineBadge: {
          backgroundColor: colors.dangerBg,
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: colors.borderDanger,
        },
        offlineText: {
          color: colors.textDanger,
          fontSize: 9,
          fontWeight: "800",
          letterSpacing: 1,
        },
        staleBadge: {
          backgroundColor: colors.oxygenBg,
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: colors.borderOxygen,
        },
        staleText: {
          color: colors.textOxygen,
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 1,
        },
        oxygenSection: {
          paddingHorizontal: 16,
          paddingBottom: 10,
        },
        tabs: {
          flexDirection: "row",
          marginHorizontal: 16,
          marginBottom: 8,
          backgroundColor: colors.bgSecondary,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.borderDefault,
          padding: 3,
        },
        tab: {
          flex: 1,
          paddingVertical: 8,
          alignItems: "center",
          borderRadius: 8,
        },
        tabActive: {
          backgroundColor: colors.oxygenBg,
          borderWidth: 1,
          borderColor: colors.borderOxygen,
        },
        tabText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: 0.5,
        },
        tabTextActive: {
          color: colors.textOxygen,
        },
        content: {
          flex: 1,
          position: "relative",
          overflow: "hidden",
        },
        loadingOverlay: {
          padding: 20,
          alignItems: "center",
          gap: 8,
        },
        loadingText: {
          color: colors.textMuted,
          fontSize: 13,
        },
        errorBanner: {
          margin: 12,
          padding: 12,
          backgroundColor: colors.dangerBg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.borderDanger,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        errorText: {
          color: colors.textDanger,
          fontSize: 12,
          flex: 1,
        },
        errorRetry: {
          color: colors.textOxygen,
          fontSize: 12,
          fontWeight: "700",
        },
        listContent: {
          padding: 16,
          paddingBottom: 80,
        },
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 2,
          marginBottom: 8,
        },
        emptyState: {
          alignItems: "center",
          paddingTop: 60,
          gap: 8,
        },
        emptyIcon: {
          fontSize: 48,
          color: colors.borderDefault,
        },
        emptyTitle: {
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: "700",
        },
        emptyDesc: {
          color: colors.textMuted,
          fontSize: 13,
          textAlign: "center",
          paddingHorizontal: 40,
        },
        ctaContainer: {
          paddingHorizontal: 16,
          paddingTop: 10,
          backgroundColor: colors.bgPrimary,
          borderTopWidth: 1,
          borderTopColor: colors.borderDefault,
        },
        startBtn: {
          backgroundColor: colors.oxygenBg,
          borderWidth: 1,
          borderColor: colors.oxygen,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
          shadowColor: colors.oxygen,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 4,
        },
        startBtnDisabled: {
          borderColor: colors.borderDefault,
          shadowOpacity: 0,
        },
        startBtnText: {
          color: colors.textOxygen,
          fontSize: 14,
          fontWeight: "800",
          letterSpacing: 2,
        },
        activePill: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
        },
        activeDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.success ?? "#00ff88",
        },
        activeText: {
          color: colors.textPrimary,
          fontSize: 13,
          fontWeight: "600",
        },
        endBtn: {
          marginTop: 10,
          backgroundColor: colors.dangerBg,
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
        },
        endBtnText: {
          color: colors.textDanger,
          fontSize: 14,
          fontWeight: "800",
          letterSpacing: 1,
        },
      }),
    [colors],
  );

  // ─── MARKERS PARA OVERLAY ─────────────────────────
  const allMarkers = useMemo<OverlayMarker[]>(() => {
    return availableDrops.map((d) => ({
      id: `supply_${d.id}`,
      coordinate: { latitude: d.latitude, longitude: d.longitude },
    }));
  }, [availableDrops]);

  const {
    mapRef: overlayMapRef,
    positions,
    recalculate,
    invalidate,
  } = useMarkerOverlay(allMarkers);

  const handleTabChange = useCallback(
    (tab: TabView) => {
      if (tab === "list") invalidate();
      setActiveTab(tab);
    },
    [invalidate],
  );

  const handleMapRef = useCallback(
    (ref: MapView | null) => {
      mapRef.current = ref;
      overlayMapRef.current = ref;
      if (ref) {
        setTimeout(recalculate, 100);
      }
    },
    [recalculate],
  );

  // ─── SINCRONIZAR VIAJE ─────────────────────────
  useEffect(() => {
    const loadActiveTrip = async () => {
      try {
        const trip = await tripService.getActiveTrip();
        setActiveTrip(trip);
      } catch (e) {
        console.warn("[Trips] loadActiveTrip error:", e);
        setActiveTrip(null);
      }
    };
    loadActiveTrip();
  }, [setActiveTrip]);

  // ─── LOCATION ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationReady(true);
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (e) {
        console.warn("[Trips] Location error:", e);
      } finally {
        setLocationReady(true);
      }
    })();
  }, []);

  // Cuando la ubicación llega, centrar el mapa
  useEffect(() => {
    if (!locationReady || !userLocation || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center: userLocation, zoom: 15 },
      { duration: 600 },
    );
  }, [locationReady]);

  // ─── NAVEGAR ─────────────────────────
  const handleDropPress = useCallback(
    (drop: SupplyDrop) => {
      setSelectedDrop(drop);
      handleTabChange("map");
      setTimeout(() => {
        mapRef.current?.animateCamera(
          {
            center: { latitude: drop.latitude, longitude: drop.longitude },
            zoom: 16,
          },
          { duration: 700 },
        );
      }, 50);
    },
    [handleTabChange],
  );

  // ─── RECOLECTAR ─────────────────────────
  const handleCollect = useCallback(
    async (supply: SupplyDrop) => {
      if (!activeTrip?.id) return;
      markDropCollected(supply.id, activeTrip.id);
      try {
        await tripService.collectDrop(supply.id, activeTrip.id);
      } catch {
        refresh();
      }
    },
    [activeTrip, markDropCollected, refresh],
  );

  const handleStartTrip = useCallback(() => {
    setEquipmentVisible(true);
  }, []);

  const handleEquipmentConfirm = useCallback(() => {
    setEquipmentVisible(false);
    start();
  }, [start]);

  const handleEndTrip = useCallback(() => end?.(), [end]);

  const tripStatus = activeTrip?.status ?? null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>MISIÓN EN ESPERA</Text>
          <Text style={styles.headerTitle}>Suministros NASA</Text>
        </View>
        <View style={styles.headerRight}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          )}
          {isStale && !isOffline && (
            <View style={styles.staleBadge}>
              <Text style={styles.staleText}>CACHÉ</Text>
            </View>
          )}
        </View>
      </View>

      {/* OXYGEN */}
      <View style={styles.oxygenSection}>
        <OxygenBar
          level={level}
          oxygenStatus={oxygenStatus}
          minutesRemaining={minutesRemaining}
          isConsuming={isConsuming}
        />
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "map" && styles.tabActive]}
          onPress={() => handleTabChange("map")}
        >
          <Text style={styles.tabText}>◎ Mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "list" && styles.tabActive]}
          onPress={() => handleTabChange("list")}
        >
          <Text style={styles.tabText}>⬡ Lista ({nearbyDrops.length})</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {activeTab === "map" ? (
          <>
            <MapView
              provider={PROVIDER_GOOGLE}
              ref={handleMapRef}
              style={StyleSheet.absoluteFillObject}
              customMapStyle={mapStyle}
              showsUserLocation
              initialRegion={
                userLocation
                  ? {
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  : {
                      latitude: 9.9281,
                      longitude: -84.0907,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }
              }
              onRegionChange={recalculate}
              onLayout={recalculate}
            />
            <View
              style={StyleSheet.absoluteFillObject}
              pointerEvents="box-none"
            >
              {availableDrops.map((drop) => {
                const pos = positions[`supply_${drop.id}`];
                if (!pos) return null;
                return (
                  <SupplyDropMarker
                    key={drop.id}
                    screenX={pos.x}
                    screenY={pos.y}
                    supply={drop}
                    onPress={handleDropPress}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <FlatList
            data={[...nearbyDrops]}
            keyExtractor={(d) => d.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refresh} />
            }
            renderItem={({ item }) => (
              <SupplyCard
                supply={item}
                onNavigate={handleDropPress}
                onCollect={handleCollect}
              />
            )}
          />
        )}
      </View>

      {/* CTA */}
      <View
        style={[styles.ctaContainer, { paddingBottom: insets.bottom + 12 }]}
      >
        {!tripStatus && (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStartTrip}
            disabled={!canStart}
          >
            <Text style={styles.startBtnText}>▶ INICIAR EXPLORACIÓN</Text>
          </TouchableOpacity>
        )}
        {tripStatus === "ACTIVE" && (
          <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip}>
            <Text style={styles.endBtnText}>■ FINALIZAR EXPLORACIÓN</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* EQUIPMENT SHEET */}
      <TripEquipmentSheet
        visible={equipmentVisible}
        onClose={() => setEquipmentVisible(false)}
        onConfirm={handleEquipmentConfirm}
      />
    </View>
  );
}