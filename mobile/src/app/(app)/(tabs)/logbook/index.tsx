import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

import { useTheme } from "@/constants/theme";
import { CLASSIFICATION_LABELS } from "@/constants/labels";
import { useLogbook } from "@/hooks/useLogbook";
import { useNetworkStatus } from "@/hooks/offline/useNetworkStatus";
import { useToast } from "@/context/ToastContext";
import { aiApi } from "@/services/api/ai.api";
import { LogbookCard } from "@/components/logbook/LogbookCard";
import { LogbookSkeletonCard } from "@/components/logbook/LogbookSkeletonCard";
import { LogbookEmptyState } from "@/components/logbook/LogbookEmptyState";
import { LogbookSearchBar } from "@/components/logbook/LogbookSearchBar";
import {
  LogbookFilterChips,
  type FilterKey,
} from "@/components/logbook/LogbookFilterChips";
import { LogbookActionSheet } from "@/components/logbook/LogbookActionSheet";
import type { LogbookEntry } from "@/types/logbook.types";

export default function LogbookScreen() {
  const { colors, fonts, fontSizes, spacing } = useTheme();
  const router = useRouter();

  const {
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isSearchingRAG,
    error,
    isDownloadingAll,
    downloadAllDone,
    downloadAllError,
    cameFromCache,
    refresh,
    loadMore,
    searchRAG,
    setFilter,
    downloadAll,
    deleteEntry,
  } = useLogbook();

  const { isConnected } = useNetworkStatus();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState<FilterKey>("ALL");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  useEffect(() => {
    if (downloadAllDone)
      showToast("Bitácora descargada para uso offline", "success");
  }, [downloadAllDone]);

  useEffect(() => {
    if (downloadAllError) showToast("Error al descargar la bitácora", "error");
  }, [downloadAllError]);
  const [actionEntry, setActionEntry] = useState<LogbookEntry | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handlePlayAudio = useCallback(async (entry: LogbookEntry) => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          return;
        }
        await soundRef.current.unloadAsync();
      }

      let finalUri = entry.audio_url;

      if (!finalUri) {
        setIsGenerating(entry.id);
        const cachePath = `${FileSystem.cacheDirectory}speech_${entry.id}.wav`;
        const fileInfo = await FileSystem.getInfoAsync(cachePath);

        if (!fileInfo.exists) {
          const blob = await aiApi.generateAudio(entry.description);
          if (blob.size < 100) {
            throw new Error("Audio corrupto");
          }

          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          await FileSystem.writeAsStringAsync(cachePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        finalUri = cachePath;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: finalUri },
        { shouldPlay: true },
      );

      soundRef.current = sound;
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo reproducir el análisis de voz.");
    } finally {
      setIsGenerating(null);
    }
  }, []);

  const handleChipChange = (key: FilterKey) => {
    setActiveChip(key);
    if (key === "ALL") setFilter({});
    else if (key === "PELIGROSAS") setFilter({ danger: "DANGEROUS" });
    else setFilter({ classification: key as any });
  };

  const filtered = useMemo(() => {
    const safe = entries ?? [];
    return safe;
  }, [entries, search]);

  const handleSearchSubmit = () => {
    if (search.trim()) {
      searchRAG(search);
    } else {
      refresh();
    }
  };

  const handleLongPress = (entry: LogbookEntry) => {
    setActionEntry(entry);
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
    [router, deleteEntry, isGenerating],
  );

  const keyExtractor = useCallback((item: LogbookEntry) => item.id, []);

  const ListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
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

  const handleClearSearch = () => {
    setSearch("");
    refresh();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View
        style={{
          paddingTop: 16,
          paddingBottom: 12,
          paddingHorizontal: spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.display,
              fontSize: 28,
              letterSpacing: 4,
              color: colors.textPrimary,
              lineHeight: 30,
            }}
          >
            BITÁCORA
          </Text>
          <TouchableOpacity
            onPress={downloadAll}
            activeOpacity={0.75}
            style={{ padding: spacing.xs, marginTop: 2 }}
          >
            {isDownloadingAll ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : downloadAllDone ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.textSuccess}
              />
            ) : (
              <Ionicons
                name="download-outline"
                size={22}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            letterSpacing: 2,
            color: colors.textSecondary,
            marginTop: 2,
            marginBottom: 12,
          }}
        >
          Registro de Formas de Vida
        </Text>
        <View style={{ height: 1, backgroundColor: colors.borderDefault }} />
      </View>

      <View style={{ marginTop: 8 }}>
        <LogbookSearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={handleSearchSubmit}
          isLoading={isSearchingRAG}
          onClear={handleClearSearch}
        />
        <LogbookFilterChips active={activeChip} onChange={handleChipChange} />
      </View>

      <View style={{ flex: 1, marginTop: 12 }}>
        {(isLoading || isSearchingRAG) && !isRefreshing ? (
          <SkeletonList />
        ) : error && isConnected !== false ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.lg,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.body,
                color: colors.danger,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={refresh}
              style={{ marginTop: spacing.md }}
            >
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: fontSizes.caption,
                  color: colors.primary,
                }}
              >
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
            onEndReached={() => {
              if (!search.trim()) loadMore();
            }}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              cameFromCache ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.caption,
                      fontSize: fontSizes.caption,
                      color: colors.textMuted,
                    }}
                  >
                    Mostrando datos guardados
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={<ListFooter />}
            ListEmptyComponent={
              <LogbookEmptyState
                onOpenCamera={() => router.push("/(app)/capture" as never)}
              />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          />
        )}
      </View>

      <LogbookActionSheet
        entry={actionEntry}
        onClose={() => setActionEntry(null)}
        onViewDetail={() => {
          if (!actionEntry) return;
          router.push(`/(app)/(tabs)/logbook/${actionEntry.id}` as never);
          setActionEntry(null);
        }}
        onPlayAudio={() => {
          if (!actionEntry) return;
          handlePlayAudio(actionEntry);
          setActionEntry(null);
        }}
        isGeneratingAudio={isGenerating === actionEntry?.id}
      />
    </View>
  );
}
