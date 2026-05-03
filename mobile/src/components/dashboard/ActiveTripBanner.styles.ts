import { StyleSheet } from 'react-native';
import type { UseThemeReturn } from '@/constants/theme/hooks/useTheme';

const PROGRESS_BAR_HEIGHT = 4;
const TITLE_LETTER_SPACING = 2;

interface DynamicProps {
  oxygenValueColor: string;
  fillColor: string;
  oxygenPercent: number;
}

export const createStyles = (
  { colors, fonts, fontSizes, spacing, radii, borderWidths }: UseThemeReturn,
  { oxygenValueColor, fillColor, oxygenPercent }: DynamicProps,
) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.oxygenBg,
      borderRadius: radii.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    animatedBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radii.lg,
      borderWidth: borderWidths.thick,
      borderColor: colors.oxygen,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: fontSizes.h3,
      color: colors.textOxygen,
      textTransform: 'uppercase',
      letterSpacing: TITLE_LETTER_SPACING,
    },
    destination: {
      fontFamily: fonts.caption,
      fontSize: fontSizes.caption,
      color: colors.textMuted,
    },
    oxygenValue: {
      fontFamily: fonts.mono,
      fontSize: fontSizes.dataXl,
      color: oxygenValueColor,
      lineHeight: fontSizes.dataXl * 1.1,
    },
    oxygenUnit: {
      fontSize: fontSizes.body,
      color: colors.textMuted,
    },
    progressBarTrack: {
      height: PROGRESS_BAR_HEIGHT,
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      overflow: 'hidden',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    progressBarFill: {
      height: '100%',
      width: `${oxygenPercent * 100}%`,
      backgroundColor: fillColor,
      borderRadius: radii.sm,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    elapsedText: {
      fontFamily: fonts.mono,
      fontSize: fontSizes.data,
      color: colors.textMuted,
    },
    tapHint: {
      fontFamily: fonts.caption,
      fontSize: fontSizes.caption,
      color: colors.textMuted,
    },
  });
