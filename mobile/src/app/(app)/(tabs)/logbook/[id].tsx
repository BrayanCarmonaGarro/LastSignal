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
import { ClassificationBadge } from '@/components/logbook/ClassificationBadge';
import type { LogbookEntry } from '@/types/logbook.types';

const HERO_HEIGHT   = 280;
const WAVEFORM_BARS = 40;

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
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes, dangerColors } = useTheme();

  const [entry,        setEntry]        = useState<LogbookEntry | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [playProgress, setPlayProgress] = useState(0); 
  
  const soundRef      = useRef<Audio.Sound | null>(null);
  const confAnim      = useRef(new Animated.Value(0)).current;

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

  /**
   * Lógica de reproducción con soporte para generación dinámica (POST)
   */const handlePlayAudio = useCallback(async () => {
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

        const fileInfo = await FileSystem.getInfoAsync(cachePath);
        console.log("Información del archivo:", fileInfo);

        console.log("Descargando audio desde el servidor...");
        const blob = await aiApi.generateAudio(entry.description);

        if (blob.size < 100) { 
            throw new Error("El servidor devolvió un archivo demasiado pequeño. Posible error de API.");
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        await FileSystem.writeAsStringAsync(cachePath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        finalUri = cachePath;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: finalUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis) setPlayProgress(status.positionMillis / status.durationMillis);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlayProgress(0);
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      console.error("DETALLE DEL ERROR:", e);
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

  const dColors = dangerColors[entry.danger_level] ?? dangerColors.UNKNOWN;
  const bars    = waveBars(entry.audio_url || entry.description);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          <Image source={{ uri: buildFileUrl(entry.photo_url) }} style={{ width: '100%', height: HERO_HEIGHT }} />
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', top: insets.top + spacing.md, left: spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={{ padding: spacing.lg, marginTop: -spacing.xl }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary }}>
            {CLASSIFICATION_LABELS[entry.classification]}
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md }}>
            <ClassificationBadge classification={entry.classification} />
            <View style={{ backgroundColor: dColors.bg, paddingHorizontal: spacing.sm, borderRadius: radii.full, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: '#fff' }}>{DANGER_LABELS[entry.danger_level]}</Text>
            </View>
          </View>

          {/* AI Analysis Bar */}
          <View style={{ backgroundColor: colors.bgSecondary, padding: spacing.md, borderRadius: radii.lg, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={{ fontFamily: fonts.heading, color: colors.textPrimary, fontSize: 12 }}>PROBABILIDAD IA</Text>
              <Text style={{ fontFamily: fonts.mono, color: colors.primary }}>{Math.round(entry.ai_confidence ? entry.ai_confidence * 100 : 0)}%</Text>
            </View>
            <View style={{ height: 4, backgroundColor: colors.bgTertiary, borderRadius: 2 }}>
              <Animated.View style={{ height: '100%', backgroundColor: colors.primary, width: confAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
            </View>
          </View>

          {/* Description */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 4 }}>FIELD_NOTES.LOG</Text>
            <Text style={{ fontFamily: fonts.body, color: colors.textPrimary, lineHeight: 22 }}>{entry.description}</Text>
          </View>

          {/* Waveform Card */}
          <View style={{ backgroundColor: colors.bgSecondary, borderRadius: radii.xl, padding: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 30, gap: 2, marginBottom: spacing.md }}>
              {bars.map((h, i) => (
                <View key={i} style={{ flex: 1, height: h, borderRadius: 1, backgroundColor: colors.textSuccess, opacity: (i / WAVEFORM_BARS < playProgress) ? 1 : 0.2 }} />
              ))}
            </View>
            
            <TouchableOpacity 
              onPress={handlePlayAudio} 
              disabled={isGenerating}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.textSuccess, alignItems: 'center', justifyContent: 'center' }}>
                {isGenerating ? <ActivityIndicator size="small" color={colors.textSuccess} /> : <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={colors.textSuccess} />}
              </View>
              <Text style={{ fontFamily: fonts.mono, color: colors.textSuccess, fontSize: 12 }}>
                {isGenerating ? "PROCESANDO NARRACIÓN..." : isPlaying ? "REPRODUCIENDO..." : "ESCUCHAR ANÁLISIS"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{ position: 'absolute', bottom: insets.bottom, left: 0, right: 0, height: 60, borderTopWidth: 1, borderColor: colors.borderDefault, flexDirection: 'row', backgroundColor: colors.bgPrimary }}>
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