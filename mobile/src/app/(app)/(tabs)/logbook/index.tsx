import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActionSheetIOS,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { CLASSIFICATION_LABELS } from '@/constants/labels';
import { useLogbook } from '@/hooks/useLogbook';
import { LogbookCard } from '@/components/logbook/LogbookCard';
import { LogbookSkeletonCard } from '@/components/logbook/LogbookSkeletonCard';
import { LogbookEmptyState } from '@/components/logbook/LogbookEmptyState';
import { LogbookSearchBar } from '@/components/logbook/LogbookSearchBar';
import { LogbookFilterChips, type FilterKey } from '@/components/logbook/LogbookFilterChips';
import type { LogbookEntry } from '@/types/logbook.types';

export default function LogbookScreen() {
  const { colors, fonts, fontSizes, spacing } = useTheme();
  const router  = useRouter();

  const {
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    isDownloadingAll,
    downloadAllDone,
    refresh,
    loadMore,
    setFilter,
    downloadAll,
    deleteEntry,
  } = useLogbook();

  const [search,     setSearch]     = useState('');
  const [activeChip, setActiveChip] = useState<FilterKey>('ALL');

  const handleChipChange = (key: FilterKey) => {
    setActiveChip(key);
    if (key === 'ALL')        setFilter({});
    else if (key === 'PELIGROSAS') setFilter({ danger: 'DANGEROUS' });
    else                      setFilter({ classification: key as any });
  };

  const filtered = useMemo(() => {
    const safe = entries ?? [];
    if (!search.trim()) return safe;
    const q = search.toLowerCase();
    return safe.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        (CLASSIFICATION_LABELS[e.classification] ?? '').toLowerCase().includes(q),
    );
  }, [entries, search]);

  const handleLongPress = (entry: LogbookEntry) => {
    const options = ['Ver detalle', 'Escuchar audio', 'Descargar', 'Eliminar', 'Cancelar'];
    const destructiveIndex = 3;
    const cancelIndex      = 4;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex },
        (idx) => {
          if (idx === 0) router.push(`/(app)/(tabs)/logbook/${entry.id}` as never);
          if (idx === 1) router.push(`/(app)/(tabs)/logbook/${entry.id}` as never);
          if (idx === 3) deleteEntry(entry.id);
        },
      );
    } else {
      Alert.alert('Acciones', entry.description.slice(0, 60), [
        { text: 'Ver detalle',   onPress: () => router.push(`/(app)/(tabs)/logbook/${entry.id}` as never) },
        { text: 'Escuchar audio', onPress: () => router.push(`/(app)/(tabs)/logbook/${entry.id}` as never) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: LogbookEntry }) => (
      <LogbookCard
        entry={item}
        onPress={() => router.push(`/(app)/(tabs)/logbook/${item.id}` as never)}
        onLongPress={() => handleLongPress(item)}
        onDelete={() => deleteEntry(item.id)}
      />
    ),
    [router, deleteEntry],
  );

  const keyExtractor = useCallback((item: LogbookEntry) => item.id, []);

  const ListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const SkeletonList = () => (
    <>
      <LogbookSkeletonCard />
      <LogbookSkeletonCard />
      <LogbookSkeletonCard />
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: 4,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.display,
              color: colors.textPrimary,
              letterSpacing: 1,
              lineHeight: fontSizes.display * 1.1,
            }}
          >
            BITÁCORA
          </Text>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {entries?.length ?? 0} registros
          </Text>
        </View>

        {/* Download header action */}
        <TouchableOpacity
          onPress={downloadAll}
          activeOpacity={0.75}
          style={{ padding: spacing.xs, marginTop: 4 }}
          accessibilityLabel="Descargar bitácora offline"
        >
          {isDownloadingAll ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : downloadAllDone ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.textSuccess} />
          ) : (
            <Ionicons name="download-outline" size={22} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search + Filter chips */}
      <View style={{ marginTop: 8 }}>
        <LogbookSearchBar value={search} onChangeText={setSearch} />
        <LogbookFilterChips active={activeChip} onChange={handleChipChange} />
      </View>

      {/* List */}
      <View style={{ flex: 1, marginTop: 12 }}>
      {isLoading && !isRefreshing ? (
        <SkeletonList />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Text style={{ fontFamily: fonts.body, fontSize: fontSizes.body, color: colors.danger, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity onPress={refresh} style={{ marginTop: spacing.md }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: fontSizes.caption, color: colors.primary }}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList<LogbookEntry>
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onRefresh={refresh}
          refreshing={isRefreshing}
          onEndReached={() => { if (!search.trim()) loadMore(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            <LogbookEmptyState
              onOpenCamera={() => router.push('/(app)/capture' as never)}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        />
      )}
      </View>
    </View>
  );
}
