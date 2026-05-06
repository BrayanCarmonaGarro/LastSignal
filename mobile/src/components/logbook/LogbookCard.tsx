import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { CLASSIFICATION_LABELS } from '@/constants/labels';
import { relativeTime } from '@/utils/formatters';
import { buildFileUrl } from '@/services/api/client';
import type { LogbookEntry } from '@/types/logbook.types';

interface Props {
  entry: LogbookEntry;
  onPress: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
}

export function LogbookCard({ entry, onPress, onDelete, onLongPress }: Props) {
  const {
    colors,
    fonts,
    fontSizes,
    spacing,
    radii,
    borderWidths,
    iconSizes,
    classificationColors,
  } = useTheme();

  const classColors = classificationColors[entry.classification] ?? classificationColors.UNKNOWN_ORGANISM;
  const label       = CLASSIFICATION_LABELS[entry.classification] ?? entry.classification;
  const isDangerous = entry.danger_level === 'DANGEROUS';

  const swipeRef = useRef<Swipeable>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const imageUri = entry.photo_url ? buildFileUrl(entry.photo_url) : null;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar entrada',
      '¿Eliminar este registro de la bitácora?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => swipeRef.current?.close() },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => { swipeRef.current?.close(); onDelete?.(); },
        },
      ],
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange:  [-80, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.85}
        style={{
          width: 80,
          backgroundColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={iconSizes.md} color="#fff" />
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.micro,
              color: '#fff',
              marginTop: 2,
            }}
          >
            Eliminar
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
        delayLongPress={400}
      >
        <View
          style={{
            flexDirection: 'row',
            height: 88,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderBottomWidth: borderWidths.thin,
            borderBottomColor: colors.borderDefault,
            borderLeftWidth: 3,
            borderLeftColor: classColors.border,
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          {/* Thumbnail */}
          <View style={{ width: 60, height: 60, borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.bgTertiary }}>
            {!imgError && imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 60, height: 60 }}
                resizeMode="cover"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            ) : null}
            {!imgLoaded && !imgError && (
              <ActivityIndicator
                size="small"
                color={colors.textMuted}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            )}
            {imgError && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={28} height={28} viewBox="0 0 28 28">
                  <Circle cx={14} cy={14} r={10} fill="none" stroke={colors.textMuted} strokeWidth={1.5} opacity={0.5} />
                  <Circle cx={14} cy={14} r={3} fill={colors.textMuted} opacity={0.4} />
                  <Path d="M7 10 Q14 8 21 10" fill="none" stroke={colors.textMuted} strokeWidth={1} opacity={0.3} />
                </Svg>
              </View>
            )}
            {/* Classification pill overlay */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: `${classColors.border}E6`,
                paddingVertical: 2,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 7,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </View>

          {/* Center info */}
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: 15,
                color: colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>

            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: fontSizes.caption,
                color: colors.textSecondary,
                lineHeight: fontSizes.caption * 1.4,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {entry.description}
            </Text>

            {/* Meta row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isDangerous && (
                <>
                  <Ionicons name="warning" size={10} color={colors.danger} />
                  <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.danger }}>
                    PELIGROSO
                  </Text>
                </>
              )}
              {entry.is_ai_reviewed && (
                <>
                  {isDangerous && <View style={{ width: 1, height: 8, backgroundColor: colors.borderDefault }} />}
                  <Ionicons name="hardware-chip-outline" size={10} color={colors.primaryLight} />
                  <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.primaryLight }}>
                    IA
                  </Text>
                </>
              )}
              {entry.ai_confidence != null && (
                <>
                  <View style={{ width: 1, height: 8, backgroundColor: colors.borderDefault }} />
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                    {Math.round(entry.ai_confidence * 100)}%
                  </Text>
                </>
              )}
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted }}>
                {relativeTime(entry.created_at)}
              </Text>
            </View>
          </View>

          {/* Right */}
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            {entry.sync_status === 'PENDING' && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primaryLight,
                }}
              />
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}
