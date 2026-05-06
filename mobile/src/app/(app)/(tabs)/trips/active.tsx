// src/app/(app)/(tabs)/trips/active.tsx
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrip } from "@/hooks/trip/useTrip";
import { useOxygen } from "@/hooks/trip/useOxygen";
import { useSupplies } from "@/hooks/trip/useSupplies";
import {
  useMarkerOverlay,
  type OverlayMarker,
} from "@/hooks/trip/useMarkerOverlay";
import { OxygenBar } from "@/components/trips/OxygenBar";
import { SupplyDropMarker } from "@/components/trips/markers/SupplyDropMarker";
import { WaypointMarker } from "@/components/trips/markers/WaypointMarker";
import { DangerZoneMarker } from "@/components/trips/markers/DangerZoneMarker";
import { BaseOverlayMarker } from "@/components/trips/markers/BaseOverlayMarker";
import {
  TripActionSheet,
  type SheetData,
} from "@/components/trips/TripActionSheet";
import { useTripStore, computeDropCost } from "@/store/tripStore";
import type { SupplyDrop, TripDangerZone } from "@/store/tripStore";

import { resourcesApi } from "@/services/api/resources.api";
import type { InventoryResourceFull } from "@/types/trip_pack.types";

import { TripPackHUD } from "@/components/trips/TripPackHUD";

// ─── CONSTANTES ───────────────────────────────────────
const COLLECT_RADIUS_METERS = 300;
const COLLECT_RANGE_CIRCLE_SIZE = 160; // diámetro visual en pantalla (px)

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

// ─── HELPER HAVERSINE ─────────────────────────────────
function getDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 6371000;
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ─── COMPONENTE ───────────────────────────────────────
export default function ActiveTripScreen() {
  const insets = useSafeAreaInsets();

  const { activeTrip, canEnd, end, collectDrop, logPosition } = useTrip();
  const { level, oxygenStatus, minutesRemaining, isConsuming } = useOxygen();
  const { supplyDrops } = useSupplies();
  const routePoints = useTripStore((s) => s.routePoints);
  const waypoints = useTripStore((s) => s.waypoints);
  const dangerZones = useTripStore((s) => s.dangerZones);
  const baseCoordinate = routePoints[0] ?? null;

  const [sheetData, setSheetData] = React.useState<SheetData | null>(null);

  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [mapReady, setMapReady] = React.useState(false);

  // Solo drops disponibles + recolectados en este viaje
  const currentTripDrops = useMemo(
    () =>
      supplyDrops.filter(
        (d) => d.status === "AVAILABLE" || d.trip_id === activeTrip?.id,
      ),
    [supplyDrops, activeTrip?.id],
  );

  const allMarkers = useMemo<OverlayMarker[]>(() => {
    const markers: OverlayMarker[] = [];

    // Posición del usuario para el círculo de rango
    if (userLocation) {
      markers.push({ id: "__user__", coordinate: userLocation });
    }

    if (baseCoordinate) {
      markers.push({ id: "__base__", coordinate: baseCoordinate });
    }

    currentTripDrops.forEach((d) =>
      markers.push({
        id: `supply_${d.id}`,
        coordinate: { latitude: d.latitude, longitude: d.longitude },
      }),
    );

    waypoints.forEach((wp) =>
      markers.push({
        id: `wp_${wp.id}`,
        coordinate: { latitude: wp.latitude, longitude: wp.longitude },
      }),
    );

    dangerZones.forEach((dz) =>
      markers.push({
        id: `dz_${dz.id}`,
        coordinate: { latitude: dz.latitude, longitude: dz.longitude },
      }),
    );

    return markers;
  }, [userLocation, baseCoordinate, currentTripDrops, waypoints, dangerZones]);

  const { mapRef, positions, recalculate } = useMarkerOverlay(allMarkers);

  const didMountRef = useRef(false);

  // ─── UBICACIÓN INICIAL ────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setMapReady(true);
    })();
  }, []);

  // ─── TRACKING DE POSICIÓN ─────────────────────────────
  const didZoomRef = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
          logPosition(coords);

          if (!didZoomRef.current) {
            didZoomRef.current = true;
            mapRef.current?.animateCamera(
              { center: coords, zoom: 16 },
              { duration: 800 },
            );
          }
        },
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [logPosition]);

  // ─── ALERTAS DE OXÍGENO ──────────────────────────────
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return; // ignorar el primer render
    }

    if (oxygenStatus === "critical") {
      Alert.alert(
        "⚠️ OXÍGENO CRÍTICO",
        `Solo quedan ${minutesRemaining} minutos. Regresa a la nave inmediatamente.`,
        [{ text: "Entendido" }],
      );
    }

    if (oxygenStatus === "empty") {
      // ── Pérdida: descartar tripPack sin transferir al inventario ──
      const handleOxygenEmpty = async () => {
        if (!activeTrip) return;

        try {
          const inventory = await resourcesApi.getAll();
          const currentTripPack = useTripStore.getState().tripPack;

          await Promise.allSettled(
            currentTripPack.map((packItem) => {
              const invItem = inventory.find(
                (r) => r.id === packItem.base_resource_id,
              );
              if (!invItem || packItem.initial <= 0) return Promise.resolve();
              return resourcesApi.addLog(
                invItem.id,
                "CONSUMPTION",
                packItem.initial, // se pierde TODO lo que llevaba, no solo lo gastado
                "Pérdida total por O₂ agotado",
                activeTrip.id,
              );
            }),
          );
        } catch (err) {
          console.error("[active] Error al registrar pérdida por O₂:", err);
        } finally {
          useTripStore.getState().clearTripPack();
        }
      };

      Alert.alert(
        "🚨 OXÍGENO AGOTADO",
        "Has perdido todos los recursos que llevabas. El viaje ha terminado.",
        [{ text: "OK", onPress: end }],
      );

      handleOxygenEmpty();
    }
  }, [oxygenStatus]);

  // ─── HANDLERS ─────────────────────────────────────────
  const handleEndTrip = useCallback(() => {
    setSheetData({
      variant: "confirm",
      title: "Finalizar viaje",
      message:
        "¿Seguro que quieres terminar la exploración y regresar a la nave?",
      confirmLabel: "Terminar",
      confirmColor: "#ef4444",
      onConfirm: end,
    });
  }, [end]);

  const spendTripResource = useTripStore((s) => s.spendTripResource);
  const tripPack = useTripStore((s) => s.tripPack);

  const handleDropPress = useCallback(
    (drop: SupplyDrop) => {
      if (drop.collected_at) return;

      if (userLocation) {
        const dist = getDistanceMeters(userLocation, {
          latitude: drop.latitude,
          longitude: drop.longitude,
        });

        if (dist > COLLECT_RADIUS_METERS) {
          setSheetData({
            variant: "confirm",
            title: "📍 Acércate más",
            message: `Este suministro está a ${Math.round(dist)} m.\nNecesitas estar a menos de ${COLLECT_RADIUS_METERS} m para recolectarlo.`,
            confirmLabel: "Entendido",
            confirmColor: "#00d4ff",
            onConfirm: () => {},
          });
          return;
        }
      }

      setSheetData({
        variant: "supply",
        drop,
        onCollect: async (d) => {
          // 1. Descontar costo del tripPack en memoria
          if (tripPack.length > 0) {
            const cost = computeDropCost(d.items.length, d.id);
            for (const c of cost) {
              spendTripResource(c.base_resource_id, c.amount);
            }

            // 2. Registrar el gasto en el backend
            try {
              const inventory =
                (await resourcesApi.getAll()) as unknown as InventoryResourceFull[];
              await Promise.allSettled(
                cost.map((c) => {
                  const invItem = inventory.find(
                    (r) => r.base_resource_id === c.base_resource_id,
                  );
                  if (!invItem) return Promise.resolve();
                  return resourcesApi.addLog(
                    invItem.id,
                    "CONSUMPTION",
                    c.amount,
                    `Costo de apertura de suministro`,
                    activeTrip?.id,
                  );
                }),
              );
            } catch (err) {
              console.error("[active] Error al registrar gasto de drop:", err);
              // No bloqueamos la recolección si falla
            }
          }

          // 3. Recolectar el drop
          collectDrop(d.id);
        },
      });
    },
    [collectDrop, userLocation, tripPack, spendTripResource],
  );

  const handleWaypointPress = useCallback(
    (latitude: number, longitude: number) => {
      mapRef.current?.animateCamera(
        { center: { latitude, longitude }, zoom: 16 },
        { duration: 600 },
      );
    },
    [],
  );

  const handleDangerZonePress = useCallback((zone: TripDangerZone) => {
    setSheetData({ variant: "danger", zone });
  }, []);

  const collectedCount = currentTripDrops.filter(
    (d) => d.status === "COLLECTED",
  ).length;
  const totalSupplies = currentTripDrops.length;

  // ─── UBICACIÓN INICIAL ────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // ─── RENDER ───────────────────────────────────────────
  const userPos = userLocation ? positions["__user__"] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Mapa */}
      {mapReady && userLocation && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          customMapStyle={DARK_MAP_STYLE}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onRegionChange={recalculate}
          onLayout={recalculate}
        >
          {routePoints.length > 1 && (
            <Polyline
              coordinates={routePoints}
              strokeColor="#00d4ff"
              strokeWidth={2.5}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>
      )}

      {/* Overlay de markers */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Nave base */}
        {baseCoordinate && positions["__base__"] && (
          <BaseOverlayMarker
            screenX={positions["__base__"].x}
            screenY={positions["__base__"].y}
            icon="🚀"
            color="#00d4ff"
            size="lg"
            shape="circle"
            callout={{
              title: "Nave base",
              subtitle: "Punto de retorno",
              badge: { label: `${minutesRemaining} min O₂`, color: "#00d4ff" },
            }}
          />
        )}

        {/* Supply drops */}
        {currentTripDrops.map((drop) => {
          const pos = positions[`supply_${drop.id}`];
          if (!pos) return null;
          return (
            <SupplyDropMarker
              key={drop.id}
              screenX={pos.x}
              screenY={pos.y}
              supply={drop}
              onPress={handleDropPress}
              showCallout={false}
            />
          );
        })}

        {/* Waypoints */}
        {waypoints.map((wp, index) => {
          const pos = positions[`wp_${wp.id}`];
          if (!pos) return null;
          return (
            <WaypointMarker
              key={wp.id}
              screenX={pos.x}
              screenY={pos.y}
              index={index + 1}
              label={wp.name ?? undefined}
              visited={wp.status === "REACHED"}
              onPress={handleWaypointPress}
              latitude={wp.latitude}
              longitude={wp.longitude}
              showCallout={false}
            />
          );
        })}

        {/* Danger zones */}
        {dangerZones.map((dz) => {
          const pos = positions[`dz_${dz.id}`];
          if (!pos) return null;
          return (
            <DangerZoneMarker
              key={dz.id}
              screenX={pos.x}
              screenY={pos.y}
              zone={dz}
              onPress={handleDangerZonePress}
              showCallout={false}
            />
          );
        })}
      </View>

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

        <TripPackHUD />

        <TouchableOpacity
          style={[styles.endBtn, !canEnd && styles.endBtnDisabled]}
          onPress={handleEndTrip}
          disabled={!canEnd}
          activeOpacity={0.8}
        >
          <Text style={styles.endBtnText}>◉ FINALIZAR VIAJE</Text>
        </TouchableOpacity>
      </View>

      {/* Action sheet */}
      <TripActionSheet data={sheetData} onClose={() => setSheetData(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050510" },

  // ── Círculo de rango ──────────────────────────────────
  collectRangeCircle: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "#00d4ffaa",
    backgroundColor: "#00d4ff0a",
    // Glow en iOS
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    // Glow en Android
    elevation: 0,
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
  statItem: { alignItems: "center", gap: 2 },
  statValue: {
    color: "#dde0ff",
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statValueWarn: { color: "#ffcc00" },
  statLabel: {
    color: "#8888aa",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, height: 28, backgroundColor: "#ffffff15" },
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
  endBtnDisabled: { opacity: 0.4 },
  endBtnText: {
    color: "#ff8888",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
