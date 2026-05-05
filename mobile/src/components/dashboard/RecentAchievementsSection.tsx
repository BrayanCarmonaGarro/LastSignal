import { Text } from 'react-native';
import { useTheme } from '@/constants/theme';
import type { DashboardAchievement } from '@/types/achievement.types';
import { SectionHeader } from './SectionHeader';
import { AchievementRecentRow } from './AchievementRecentRow';

interface RecentAchievementsSectionProps {
  achievements: DashboardAchievement[];
}

export function RecentAchievementsSection({ achievements }: RecentAchievementsSectionProps) {
  const { colors, fonts, fontSizes, spacing } = useTheme();

  return (
    <>
      <SectionHeader
        title="Logros Recientes"
        subtitle="Hitos desbloqueados en tu expedición"
      />
      {achievements.length === 0 ? (
        <Text
          style={{
            fontFamily: fonts.caption,
            fontSize: fontSizes.body,
            color: colors.textMuted,
            marginBottom: spacing.xl,
          }}
        >
          Aún no has desbloqueado logros.
        </Text>
      ) : (
        achievements.map((item) => (
          <AchievementRecentRow key={item.id} item={item} />
        ))
      )}
    </>
  );
}
