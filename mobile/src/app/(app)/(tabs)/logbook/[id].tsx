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
import * as FileSystem from 'expo-file-system/legacy';

import { useTheme } from '@/constants/theme';
import { CLASSIFICATION_LABELS, DANGER_LABELS } from '@/constants/labels';
import { relativeTime } from '@/utils/formatters';
import { logbookApi } from '@/services/api/logbook.api';
import { aiApi } from '@/services/api/ai.api';
import { buildFileUrl } from '@/services/api/client';
import type { LogbookEntry, SyncStatus } from '@/types/logbook.types';

const HERO_HEIGHT   = 300;
const WAVEFORM_BARS = 40;

const SYNC_LABELS: Record<SyncStatus, string> = {
  SYNCED:  'SINCRONIZADO',
  PENDING: 'PENDIENTE',
  FAILED:  'FALLIDO',
};

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
  const { colors, classificationColors, fonts, spacing, radii, borderWidths, dangerColors } = useTheme();

  const [entry,        setEntry]        = useState<LogbookEntry | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const confAnim = useRef(new Animated.Value(0)).current;

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
    if (!entry) return;
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      let finalUri = entry.audio_url;

      if (!finalUri) {
        setIsGenerating(true);
        const cachePath = `${FileSystem.cacheDirectory}speech_${entry.id}.wav`;
        const fileInfo  = await FileSystem.getInfoAsync(cachePath);

        if (!fileInfo.exists) {
          const blob = await aiApi.generateAudio(entry.description);
          if (blob.size < 100) throw new Error('El servidor devolvió un archivo demasiado pequeño.');

          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
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
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis) setPlayProgress(status.positionMillis / status.durationMillis);
            if (status.didJustFinish) { setIsPlaying(false); setPlayProgress(0); }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      Alert.alert('Error', 'No se pudo reproducir el audio. Verifica la conexión con el servidor.');
    } finally {
      setIsGenerating(false);
    }
  }, [entry]);

  const handleShare = useCallback(async () => {
    if (!entry) return;
    await Share.share({
      message: `🧬 ${CLASSIFICATION_LABELS[entry.classification]} — ${entry.description}\n⚠️ ${DANGER_LABELS[entry.danger_level]}`,
      url: buildFileUrl(entry.photo_url),
    });
  }, [entry]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: fonts.body, color: colors.danger }}>{error ?? 'Data corrupta'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ fontFamily: fonts.heading, color: colors.primary }}>Abortar misión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dColors   = dangerColors[entry.danger_level]          ?? dangerColors.UNKNOWN;
  const clsColors = classificationColors[entry.classification] ?? classificationColors.UNKNOWN_ORGANISM;
  const bars      = waveBars(entry.audio_url || entry.description);

  const syncAccent = entry.sync_status === 'SYNCED'
    ? colors.textSuccess
    : entry.sync_status === 'FAILED'
    ? colors.danger
    : colors.primary;

  const badgePill = {
    height:            28,
    borderRadius:      radii.full,
    borderWidth:       borderWidths.base,
    alignItems:        'center'  as const,
    justifyContent:    'center'  as const,
    paddingHorizontal: spacing.sm,
  };

  const badgeLabelTxt = {
    fontFamily:    fonts.mono,
    fontSize:      9,
    letterSpacing: 1.5,
    color:         colors.textMuted,
    marginBottom:  4,
  };

  const badgeTxt = {
    fontFamily:    fonts.mono,
    fontSize:      10,
    letterSpacing: 0.5,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

        {/* ── Hero ── */}
        <View style={{ height: HERO_HEIGHT }}>
          <Image
            source={{ uri: buildFileUrl(entry.photo_url) }}
            style={{ width: '100%', height: HERO_HEIGHT }}
            resizeMode="cover"
          />
          {/* Gradient fade toward page background */}
          <Svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} height={110} width="100%">
            <Defs>
              <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.bgPrimary} stopOpacity="0" />
                <Stop offset="1" stopColor={colors.bgPrimary} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="110" fill="url(#heroFade)" />
          </Svg>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position:        'absolute',
              top:             insets.top + spacing.md,
              left:            spacing.lg,
              width:           40,
              height:          40,
              borderRadius:    20,
              backgroundColor: 'rgba(0,0,0,0.50)',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View style={{ padding: spacing.lg }}>

          {/* Category subtitle */}
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, color: colors.textMuted, marginBottom: 6 }}>
            FORMA DE VIDA · {entry.classification}
          </Text>

          {/* Title */}
          <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary, marginBottom: spacing.lg }}>
            {CLASSIFICATION_LABELS[entry.classification] ?? entry.classification}
          </Text>

          {/* ── Badges row (equal-width columns) ── */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>

            {/* TIPO */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={badgeLabelTxt}>TIPO</Text>
              <View style={{ ...badgePill, alignSelf: 'stretch', backgroundColor: clsColors.border, borderColor: clsColors.border }}>
                <Text style={{ ...badgeTxt, color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>
                  {(CLASSIFICATION_LABELS[entry.classification] ?? entry.classification).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* PELIGRO */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={badgeLabelTxt}>PELIGRO</Text>
              <View style={{ ...badgePill, alignSelf: 'stretch', backgroundColor: dColors.border, borderColor: dColors.border }}>
                <Text style={{ ...badgeTxt, color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>
                  {(DANGER_LABELS[entry.danger_level] ?? entry.danger_level).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* SYNC */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={badgeLabelTxt}>SYNC</Text>
              <View style={{ ...badgePill, alignSelf: 'stretch', backgroundColor: syncAccent, borderColor: syncAccent }}>
                <Text style={{ ...badgeTxt, color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>
                  {SYNC_LABELS[entry.sync_status]}
                </Text>
              </View>
            </View>

          </View>

          {/* Relative time */}
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: spacing.xl }}>
            {relativeTime(entry.created_at)}
          </Text>

          {/* ── AI Probability card ── */}
          <View style={{ backgroundColor: colors.bgSecondary, padding: spacing.md, borderRadius: radii.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={{ fontFamily: fonts.heading, color: colors.textPrimary, fontSize: 12 }}>PROBABILIDAD IA</Text>
              <Text style={{ fontFamily: fonts.mono, color: colors.primary }}>
                {Math.round((entry.ai_confidence ?? 0) * 100)}%
              </Text>
            </View>
            <View style={{ height: 4, backgroundColor: colors.bgTertiary, borderRadius: 2 }}>
              <Animated.View
                style={{
                  height:          '100%',
                  backgroundColor: colors.primary,
                  borderRadius:    2,
                  width:           confAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }}
              />
            </View>
          </View>

          {/* ── Field notes ── */}
          <View style={{ backgroundColor: colors.bgSecondary, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: fonts.body, color: colors.textPrimary, lineHeight: 22 }}>
              {entry.description}
            </Text>
          </View>

          {/* ── Waveform / Audio ── */}
          <View style={{ backgroundColor: colors.bgSecondary, borderRadius: radii.xl, padding: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 30, gap: 2, marginBottom: spacing.md }}>
              {bars.map((h, i) => (
                <View
                  key={i}
                  style={{
                    flex:            1,
                    height:          h,
                    borderRadius:    1,
                    backgroundColor: colors.textSuccess,
                    opacity:         i / WAVEFORM_BARS < playProgress ? 1 : 0.2,
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handlePlayAudio}
              disabled={isGenerating}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <View style={{
                width:         44,
                height:        44,
                borderRadius:  22,
                borderWidth:   borderWidths.base,
                borderColor:   colors.textSuccess,
                alignItems:    'center',
                justifyContent:'center',
              }}>
                {isGenerating
                  ? <ActivityIndicator size="small" color={colors.textSuccess} />
                  : <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={colors.textSuccess} />
                }
              </View>
              <Text style={{ fontFamily: fonts.mono, color: colors.textSuccess, fontSize: 12 }}>
                {isGenerating ? 'PROCESANDO NARRACIÓN...' : isPlaying ? 'REPRODUCIENDO...' : 'ESCUCHAR ANÁLISIS'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={{
        position:        'absolute',
        bottom:          insets.bottom,
        left:            0,
        right:           0,
        height:          60,
        borderTopWidth:  borderWidths.base,
        borderColor:     colors.borderDefault,
        flexDirection:   'row',
        backgroundColor: colors.bgPrimary,
      }}>
        <TouchableOpacity onPress={handleShare} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bookmark-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
