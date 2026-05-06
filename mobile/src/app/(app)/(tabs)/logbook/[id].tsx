import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Audio } from 'expo-av';
import { useTheme } from '@/constants/theme';
import { CLASSIFICATION_LABELS, DANGER_LABELS } from '@/constants/labels';
import { relativeTime } from '@/utils/formatters';
import { logbookApi } from '@/services/api/logbook.api';
import { buildFileUrl } from '@/services/api/client';
import { ClassificationBadge } from '@/components/logbook/ClassificationBadge';
import type { LogbookEntry } from '@/types/logbook.types';

const HERO_HEIGHT   = 280;
const WAVEFORM_BARS = 40;

// Deterministic bar heights from the audio URL string
function waveBars(seed: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    const code = seed.charCodeAt(i % seed.length);
    bars.push(8 + ((code * (i + 1) * 7) % 24));
  }
  return bars;
}

export default function LogbookDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes, dangerColors } =
    useTheme();

  const [entry,        setEntry]        = useState<LogbookEntry | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // 0–1
  const soundRef      = useRef<Audio.Sound | null>(null);
  const confAnim      = useRef(new Animated.Value(0)).current;
  // Load entry
  useEffect(() => {
    (async () => {
      try {
        const data = await logbookApi.getById(id);
        setEntry(data);
      } catch (e: unknown) {
        setError((e as Error).message ?? 'Error al cargar entrada');
      } finally {
        setLoading(false);
      }
    })();
    return () => { soundRef.current?.unloadAsync(); };
  }, [id]);

  // Animate confidence bar when entry loads
  useEffect(() => {
    if (entry?.ai_confidence != null) {
      Animated.timing(confAnim, {
        toValue:  entry.ai_confidence,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [entry?.ai_confidence]);


  const handlePlayAudio = useCallback(async () => {
    if (!entry?.audio_url) return;
    try {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: entry.audio_url },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          if (status.durationMillis) {
            setPlayProgress(status.positionMillis / status.durationMillis);
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlayProgress(0);
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      Alert.alert('Error', 'No se pudo reproducir el audio.');
    }
  }, [entry?.audio_url, isPlaying]);

  const handleShare = useCallback(async () => {
    if (!entry) return;
    await Share.share({
      message: `🧬 ${CLASSIFICATION_LABELS[entry.classification]} — ${entry.description}\n⚠️ ${DANGER_LABELS[entry.danger_level]}`,
      url: buildFileUrl(entry.photo_url),
    });
  }, [entry]);

  const handleDownload = useCallback(async () => {
    if (!entry) return;
    try {
      await logbookApi.downloadEntry(entry.id);
      Alert.alert('Disponible offline', 'Esta entrada ya está guardada en tu dispositivo.');
      setEntry((prev) => prev ? { ...prev, is_downloaded: true } : prev);
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message ?? 'No se pudo descargar la entrada.');
    }
  }, [entry]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: fonts.body, fontSize: fontSizes.body, color: colors.danger, textAlign: 'center' }}>
          {error ?? 'Entrada no encontrada'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: fontSizes.caption, color: colors.primary }}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dColors      = dangerColors[entry.danger_level] ?? dangerColors.UNKNOWN;
  const classLabel   = CLASSIFICATION_LABELS[entry.classification] ?? entry.classification;
  const dangerLabel  = DANGER_LABELS[entry.danger_level] ?? entry.danger_level;
  const bars         = entry.audio_url ? waveBars(entry.audio_url) : [];
  const confPercent  = entry.ai_confidence != null ? Math.round(entry.ai_confidence * 100) : null;

  const syncBadge = () => {
    const map = {
      SYNCED:  { color: colors.textSuccess,  label: 'SINCRONIZADO' },
      PENDING: { color: colors.primaryLight, label: 'PENDIENTE'    },
      FAILED:  { color: colors.danger,       label: 'ERROR SYNC'   },
    };
    const s = map[entry.sync_status];
    return (
      <Animated.View
        style={[
          {
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: `${s.color}66`,
            backgroundColor: `${s.color}1A`,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
          },
          {},
        ]}
      >
        <Text style={{ fontFamily: fonts.mono, fontSize: fontSizes.caption, color: s.color, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {s.label}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        stickyHeaderIndices={[]}
      >
        {/* Hero image */}
        <View style={{ height: HERO_HEIGHT, backgroundColor: colors.bgTertiary }}>
          <Image
            source={{ uri: buildFileUrl(entry.photo_url) }}
            style={{ width: '100%', height: HERO_HEIGHT }}
            resizeMode="cover"
          />
          {/* SVG gradient overlay */}
          <View style={{ position: 'absolute', inset: 0 } as any}>
            <Svg width="100%" height={HERO_HEIGHT}>
              <Defs>
                <LinearGradient id="hero" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0.5" stopColor={colors.bgPrimary} stopOpacity={0} />
                  <Stop offset="1"   stopColor={colors.bgPrimary} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height={HERO_HEIGHT} fill="url(#hero)" />
            </Svg>
          </View>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: insets.top + spacing.md,
              left: spacing.lg,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${colors.bgPrimary}B3`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={iconSizes.md} color="#fff" />
          </TouchableOpacity>

          {/* Audio shortcut (top-right) */}
          {entry.audio_url && (
            <TouchableOpacity
              onPress={handlePlayAudio}
              style={{
                position: 'absolute',
                top: insets.top + spacing.md,
                right: spacing.lg,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.bgPrimary}B3`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={isPlaying ? 'pause' : 'volume-high'} size={iconSizes.md} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable content */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: -spacing.xl }}>
          {/* Drag handle */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.bgTertiary }} />
          </View>

          {/* Identity */}
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.textMuted,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: spacing.xs,
            }}
          >
            FORMA DE VIDA · {classLabel}
          </Text>

          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: fontSizes.display,
              color: colors.textPrimary,
              letterSpacing: 0.5,
              lineHeight: fontSizes.display * 1.1,
              marginBottom: spacing.md,
            }}
          >
            {classLabel}
          </Text>

          {/* Badges row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm, alignItems: 'flex-end' }}>
            <View style={{ gap: 3 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: fontSizes.micro, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Tipo</Text>
              <ClassificationBadge classification={entry.classification} />
            </View>
            <View style={{ gap: 3 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: fontSizes.micro, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Peligro</Text>
              <View
                style={{
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: `${dColors.border}66`,
                  backgroundColor: `${dColors.bg}`,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: fontSizes.caption, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {dangerLabel}
                </Text>
              </View>
            </View>
            <View style={{ gap: 3 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: fontSizes.micro, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Sync</Text>
              {syncBadge()}
            </View>
          </View>

          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textMuted,
              marginBottom: spacing.xl,
            }}
          >
            {relativeTime(entry.created_at)}
          </Text>

          {/* AI Analysis card */}
          <View
            style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: radii.xl,
              borderWidth: borderWidths.base,
              borderColor: colors.borderDefault,
              padding: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="hardware-chip-outline" size={iconSizes.sm} color={colors.primaryLight} />
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 14,
                  color: colors.textPrimary,
                  marginLeft: spacing.xs,
                  flex: 1,
                }}
              >
                ANÁLISIS IA
              </Text>
              {confPercent != null && (
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.primary }}>
                  {confPercent}% CONFIANZA
                </Text>
              )}
            </View>

            {/* Confidence bar */}
            {confPercent != null && (
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.bgTertiary,
                  borderRadius: 3,
                  marginBottom: spacing.md,
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.primary,
                    width: confAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }}
                />
              </View>
            )}

            {entry.is_ai_reviewed && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.textSuccess} />
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSuccess }}>
                  Verificado por el comandante
                </Text>
              </View>
            )}
          </View>

          {/* Description card */}
          <View
            style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: radii.xl,
              borderWidth: borderWidths.base,
              borderColor: colors.borderDefault,
              padding: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 9,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: spacing.sm,
              }}
            >
              DESCRIPCIÓN
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.textPrimary,
                lineHeight: 22,
              }}
            >
              {entry.description}
            </Text>
          </View>

          {/* Audio card */}
          {entry.audio_url && (
            <View
              style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: radii.xl,
                borderWidth: borderWidths.base,
                borderColor: colors.borderDefault,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: spacing.sm,
                }}
              >
                NARRACIÓN
              </Text>

              {/* Waveform */}
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, gap: 2, marginBottom: spacing.md }}>
                {bars.map((h, i) => {
                  const played = i / WAVEFORM_BARS < playProgress;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: h,
                        borderRadius: 2,
                        backgroundColor: colors.textSuccess,
                        opacity: played ? 1 : 0.3,
                      }}
                    />
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <TouchableOpacity
                  onPress={handlePlayAudio}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: colors.textSuccess,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={iconSizes.md}
                    color={colors.textSuccess}
                  />
                </TouchableOpacity>
                <Text style={{ flex: 1 }} />
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
                  {isPlaying ? `${Math.round(playProgress * 100)}%` : '—:—'}
                </Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Sticky bottom actions */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom,
          left: 0,
          right: 0,
          height: 56,
          backgroundColor: `${colors.bgSecondary}F2`,
          borderTopWidth: borderWidths.thin,
          borderTopColor: colors.borderDefault,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.75}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.sm, gap: 3 }}
        >
          <Ionicons name="share-outline" size={iconSizes.md} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.caption, fontSize: fontSizes.micro, color: colors.textMuted }}>
            Compartir
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={handlePlayAudio}
          activeOpacity={0.75}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.sm, gap: 3 }}
        >
          <Ionicons name="volume-high-outline" size={iconSizes.md} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.caption, fontSize: fontSizes.micro, color: colors.textMuted }}>
            Audio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
