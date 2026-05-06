// src/app/(app)/(tabs)/resources/index.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  StatusBar, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResourceStore } from '@/store/resourceStore';
import { Resource } from '@/services/api/resources.api';
import { UIResource, ResourceStatus } from '@/types/resource.types';
import { MAX_AMOUNTS } from '@/constants/resources';
import { UNIT_LABELS } from '@/constants/labels';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { AlertBanner } from '@/components/resources/AlertBanner';
import { resourcesTheme as T } from '@/constants/theme/screens/resources';

// ── Conversión Resource → UIResource ────────────────────────────
function toUIResource(r: Resource): UIResource {
  const maxAmount = MAX_AMOUNTS[r.name] ?? 100;
  const pct = maxAmount > 0 ? (r.current_amount / maxAmount) * 100 : 0;
  const status: ResourceStatus =
    r.current_amount <= r.min_threshold ? 'CRITICAL' :
    pct < 40                            ? 'LOW' :
    'NORMAL';
  return {
    ...r,
    percentage:   Math.min(pct, 100),
    status,
    trend:        pct < 50 ? 'down' : 'up',
    displayUnit:  UNIT_LABELS[r.unit] ?? r.unit,
    filledBlocks: Math.round(Math.min(pct, 100) / 20),
  };
}

// ── Pantalla principal ───────────────────────────────────────────
export default function ResourcesScreen() {
  const router = useRouter();
  const { resources, loading, error, fetchResources } = useResourceStore();

  useEffect(() => { fetchResources(); }, []);

  const uiResources = useMemo(() => resources.map(toUIResource), [resources]);

  const criticals = useMemo(
    () => uiResources.filter(r => r.status === 'CRITICAL').map(r => r.name),
    [uiResources],
  );
  const lows = useMemo(
    () => uiResources.filter(r => r.status === 'LOW').map(r => r.name),
    [uiResources],
  );

  const renderItem = useCallback(
    ({ item }: { item: UIResource }) => <ResourceCard resource={item} />,
    [],
  );

  const keyExtractor = useCallback((item: UIResource) => item.id, []);

  const goToManage = useCallback(() => router.push('/(app)/(tabs)/resources/manage'), [router]);

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>RECURSOS</Text>
            <Text style={styles.subtitle}>Gestión de Inventario</Text>
          </View>
          {/* Botón de transferencia en header */}
          <TouchableOpacity style={styles.transferBtn} onPress={goToManage} activeOpacity={0.75}>
            <Ionicons name="swap-horizontal" size={14} color={T.accentGold} />
            <Text style={styles.transferBtnText}>TRANSFERIR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />
      </View>
    </View>
  );

  const ListFooter = (
    <AlertBanner criticals={criticals} lows={lows} />
  );

  if (loading && resources.length === 0) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
        {ListHeader}
        <View style={styles.center}>
          <ActivityIndicator color={T.accentGold} size="large" />
          <Text style={styles.stateText}>CARGANDO INVENTARIO...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && resources.length === 0) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
        {ListHeader}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={T.statusCritical} />
          <Text style={[styles.stateText, { color: T.statusCritical }]}>ERROR DE CONEXIÓN</Text>
          <Text style={styles.stateSubText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && resources.length === 0) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
        {ListHeader}
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={32} color={T.textMuted} />
          <Text style={styles.stateText}>SIN RECURSOS REGISTRADOS</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <FlatList
        data={uiResources}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchResources}
            tintColor={T.accentGold}
            colors={[T.accentGold]}
          />
        }
      />

      {/* FAB de transferencia */}
      <TouchableOpacity style={styles.fab} onPress={goToManage} activeOpacity={0.85}>
        <Ionicons name="swap-horizontal" size={20} color="#0A0C0F" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 88, // espacio para el FAB
  },

  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'BarlowCondensed-700',
    fontSize: 28,
    letterSpacing: 4,
    color: T.textPrimary,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    letterSpacing: 2,
    color: T.textSecondary,
    marginTop: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: T.border,
  },

  // Botón header
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.accentGold,
    borderRadius: 2,
    backgroundColor: T.accentGold + '12',
  },
  transferBtnText: {
    fontFamily: 'ShareTechMono',
    fontSize: 8,
    letterSpacing: 1.5,
    color: T.accentGold,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.accentGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Estados
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  stateText: {
    fontFamily: 'BarlowCondensed-700',
    fontSize: 13,
    letterSpacing: 3,
    color: T.textSecondary,
    textAlign: 'center',
  },
  stateSubText: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: T.textMuted,
    textAlign: 'center',
  },
});