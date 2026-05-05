// src/app/(app)/(tabs)/trips/index.tsx
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrip } from '@/hooks/trip/useTrip';
import { useOxygen } from '@/hooks/trip/useOxygen';
import { useSupplies } from '@/hooks/trip/useSupplies';
import { useMarkerOverlay, type OverlayMarker } from '@/hooks/trip/useMarkerOverlay';

import { OxygenBar } from '@/components/trips/OxygenBar';
import { SupplyCard } from '@/components/trips/SupplyCard';
import { SupplyDropMarker } from '@/components/trips/markers/SupplyDropMarker';

import { tripService } from '@/services/trip/tripService';
import { useTripStore } from '@/store/tripStore';
import type { SupplyDrop } from '@/store/tripStore';
import * as Location from 'expo-location';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8888aa' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050510' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

type TabView = 'map' | 'list';

export default function TripsIndexScreen() {
  const insets = useSafeAreaInsets();
  //const { registerRefreshHandler } = useSwipeTabsGesture();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>('map');
  const [selectedDrop, setSelectedDrop] = useState<SupplyDrop | null>(null);

  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const markDropCollected = useTripStore((s) => s.markDropCollected);

  const { activeTrip, canStart, start, end } = useTrip();
  const { level, oxygenStatus, minutesRemaining, isConsuming } = useOxygen();

  const {
    supplyDrops,
    availableDrops,
    collectedDrops,
    isLoading,
    error,
    refresh,
  } = useSupplies();

  // ─── MARKERS PARA OVERLAY ─────────────────────────
  const allMarkers = useMemo<OverlayMarker[]>(() => {
    return supplyDrops.map((d) => ({
      id: `supply_${d.id}`,
      coordinate: {
        latitude: d.latitude,
        longitude: d.longitude,
      },
    }));
  }, [supplyDrops]);

  const { mapRef: overlayMapRef, positions, recalculate } = useMarkerOverlay(allMarkers);

  // usamos el mismo ref
  useEffect(() => {
    if (mapRef.current) {
      overlayMapRef.current = mapRef.current;
    }
  }, []);

  // ─── SINCRONIZAR VIAJE ─────────────────────────
  useEffect(() => {
    const loadActiveTrip = async () => {
      try {
        const trip = await tripService.getActiveTrip();
        setActiveTrip(trip);
      } catch {
        setActiveTrip(null);
      }
    };

    loadActiveTrip();
  }, [setActiveTrip]);

  // ─── LOCATION ─────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // ─── NAVEGAR ─────────────────────────
  const handleDropPress = useCallback((drop: SupplyDrop) => {
    setSelectedDrop(drop);
    setActiveTab('map');

    setTimeout(() => {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: drop.latitude,
            longitude: drop.longitude,
          },
          zoom: 16,
        },
        { duration: 700 }
      );
    }, 50);
  }, []);

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
    [activeTrip, markDropCollected, refresh]
  );

  const handleStartTrip = useCallback(() => start(), [start]);
  const handleEndTrip = useCallback(() => end?.(), [end]);

  const tripStatus = activeTrip?.status ?? null;

  useEffect(() => {
    //registerRefreshHandler(TAB_ORDER.indexOf('trips'), refresh);
  }, [refresh, ]); //registerRefreshHandler]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>MISIÓN EN ESPERA</Text>
          <Text style={styles.headerTitle}>Suministros NASA</Text>
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
          style={[styles.tab, activeTab === 'map' && styles.tabActive]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={styles.tabText}>◎ Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.tabActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={styles.tabText}>⬡ Lista ({supplyDrops.length})</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {activeTab === 'map' ? (
          <>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              //provider={PROVIDER_GOOGLE}
              customMapStyle={DARK_MAP_STYLE}
              showsUserLocation
              initialRegion={{
                latitude: userLocation?.latitude ?? 9.9281,
                longitude: userLocation?.longitude ?? -84.0907,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onRegionChange={recalculate}
              onLayout={recalculate}
            />

            {/* OVERLAY */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
              {supplyDrops.map((drop) => {
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
            data={[...availableDrops, ...collectedDrops]}
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
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 12 }]}>
        {!tripStatus && (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStartTrip}
            disabled={!canStart}
          >
            <Text style={styles.startBtnText}>▶ INICIAR EXPLORACIÓN</Text>
          </TouchableOpacity>
        )}

        {tripStatus === 'ACTIVE' && (
          <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip}>
            <Text style={styles.endBtnText}>■ FINALIZAR EXPLORACIÓN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080818',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerEyebrow: {
    color: '#8888aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#dde0ff',
    fontSize: 22,
    fontWeight: '800',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
    paddingTop: 4,
  },
  offlineBadge: {
    backgroundColor: '#ff444420',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#ff444444',
  },
  offlineText: {
    color: '#ff8888',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  staleBadge: {
    backgroundColor: '#ffcc0015',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#ffcc0033',
  },
  staleText: {
    color: '#ffcc00',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  oxygenSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#0a0a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff10',
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#00d4ff18',
    borderWidth: 1,
    borderColor: '#00d4ff33',
  },
  tabText: {
    color: '#8888aa',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#00d4ff',
  },
  content: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  loadingOverlay: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#8888aa',
    fontSize: 13,
  },
  errorBanner: {
    margin: 12,
    padding: 12,
    backgroundColor: '#ff444415',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff444430',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff8888',
    fontSize: 12,
    flex: 1,
  },
  errorRetry: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionLabel: {
    color: '#8888aa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#ffffff15',
  },
  emptyTitle: {
    color: '#c0c0e0',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#8888aa',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#080818',
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  startBtn: {
    backgroundColor: '#00d4ff18',
    borderWidth: 1,
    borderColor: '#00d4ff55',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  startBtnDisabled: {
    borderColor: '#ffffff20',
    shadowOpacity: 0,
  },
  startBtnText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
  },
  activeText: {
    color: '#c0c0e0',
    fontSize: 13,
    fontWeight: '600',
  },
  endBtn: {
    marginTop: 10,
    backgroundColor: '#ff444420',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  endBtnText: {
    color: '#ff8888',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});