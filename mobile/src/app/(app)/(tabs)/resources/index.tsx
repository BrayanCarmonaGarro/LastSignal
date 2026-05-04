import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResourceStore } from '@/store/resourceStore';
import { useSwipeTabsGesture } from '@/components/ui/SwipeTabsGesture';
import { TAB_ORDER } from '@/hooks/useSwipeTabsGesture.utils';
import { Resource } from '@/services/api/resources.api';
import { UIResource, ResourceStatus } from '@/types/resource.types';
import { UNIT_LABELS, MAX_AMOUNTS } from '@/constants/resources';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { AlertBanner } from '@/components/resources/AlertBanner';
import { resourcesTheme as T } from '@/constants/theme/screens/resources';

// ── Conversión Resource → UIResource ────────────────────────────
function toUIResource(r: Resource): UIResource {
  const maxAmount = MAX_AMOUNTS[r.name] ?? 100;
  const pct = maxAmount > 0 ? (r.current_amount / maxAmount) * 100 : 0;
  const status: ResourceStatus =
    r.is_critical    ? 'CRITICAL' :
    pct < 40         ? 'LOW' :
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
  const { resources, loading, error, fetchResources } = useResourceStore();
  const { registerRefreshHandler } = useSwipeTabsGesture();

  useEffect(() => { fetchResources(); }, []);

  useEffect(() => {
    registerRefreshHandler(TAB_ORDER.indexOf('resources'), fetchResources);
  }, [fetchResources, registerRefreshHandler]);

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

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>RECURSOS</Text>
        <Text style={styles.subtitle}>Gestión de Inventario</Text>
        <View style={styles.headerDivider} />
      </View>
    </View>
  );

  const ListFooter = (
    <AlertBanner criticals={criticals} lows={lows} />
  );

  if (loading && resources.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
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
      <SafeAreaView style={styles.root}>
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
      <SafeAreaView style={styles.root}>
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
    <SafeAreaView style={styles.root}>
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
    paddingBottom: 24,
  },

  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
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
    marginBottom: 12,
  },
  headerDivider: {
    height: 1,
    backgroundColor: T.border,
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
