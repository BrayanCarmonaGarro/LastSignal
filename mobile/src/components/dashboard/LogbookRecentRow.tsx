import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import type { DashboardLogbookEntry } from '@/types/logbook.types';
import { CLASSIFICATION_LABELS } from '@/constants/labels';
import { relativeTime } from '@/utils/formatters';

interface LogbookRecentRowProps {
  entry: DashboardLogbookEntry;
  onPress?: () => void;
}

export function LogbookRecentRow({ entry, onPress }: LogbookRecentRowProps) {
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
  const isDangerous = entry.danger_level === 'DANGEROUS';
  const label = CLASSIFICATION_LABELS[entry.classification] ?? entry.classification;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <View
        style={{
          backgroundColor: colors.bgSecondary,
          borderRadius: radii.md,
          borderLeftWidth: borderWidths.accent,
          borderLeftColor: classColors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {/* Body */}
        <View style={{ flex: 1 }}>
          {/* Classification badge */}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: classColors.bg,
              borderRadius: radii.full,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.caption,
                fontSize: fontSizes.micro,
                color: classColors.text,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {label}
            </Text>
          </View>

          {/* Description */}
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.body,
              color: colors.textSecondary,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {entry.description}
          </Text>
        </View>

        {/* Right side */}
        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          {isDangerous && (
            <Ionicons name="skull-outline" size={iconSizes.sm} color={colors.danger} />
          )}
          <Text
            style={{
              fontFamily: fonts.caption,
              fontSize: fontSizes.micro,
              color: colors.textMuted,
            }}
          >
            {relativeTime(entry.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
