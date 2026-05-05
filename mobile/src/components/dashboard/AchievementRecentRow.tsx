import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import type { DashboardAchievement } from '@/types/achievement.types';
import { relativeTime } from '@/utils/formatters';

interface AchievementRecentRowProps {
  item: DashboardAchievement;
}

export function AchievementRecentRow({ item }: AchievementRecentRowProps) {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.bgSecondary,
        borderRadius: radii.md,
        borderLeftWidth: borderWidths.accent,
        borderLeftColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="trophy" size={iconSizes.md} color={colors.primary} />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSizes.body,
            color: colors.textPrimary,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.achievement.name}
        </Text>
        {item.achievement.description ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.caption,
              color: colors.textSecondary,
              marginTop: 2,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.achievement.description}
          </Text>
        ) : null}
      </View>

      <Text
        style={{
          fontFamily: fonts.caption,
          fontSize: fontSizes.micro,
          color: colors.textMuted,
        }}
      >
        {relativeTime(item.earned_at)}
      </Text>
    </View>
  );
}
