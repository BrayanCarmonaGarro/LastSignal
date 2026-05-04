import { StyleSheet } from 'react-native';
import type { UseThemeReturn } from '@/constants/theme/hooks/useTheme';

interface DynamicProps {
  inputHasError: boolean;
}

export const createStyles = (
  { colors, fonts, fontSizes, spacing, radii, layout }: UseThemeReturn,
  { inputHasError }: DynamicProps,
) =>
  StyleSheet.create({
    overlay: {
      flex:              1,
      backgroundColor:   'rgba(0,0,0,0.88)',
      justifyContent:    'center',
      alignItems:        'center',
      paddingHorizontal: layout.screenPaddingH,
    },
    panel: {
      width:           '100%',
      backgroundColor: colors.bgSecondary,
      borderRadius:    radii.lg,
      borderWidth:     1,
      borderColor:     colors.borderDefault,
      overflow:        'hidden',
    },
    avatarSection: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        spacing.xl,
      gap:            spacing.lg,
    },
    avatarLarge: {
      width:        64,
      height:       64,
      borderRadius: 32,
    },
    avatarFallbackLarge: {
      width:           64,
      height:          64,
      borderRadius:    32,
      backgroundColor: colors.bgTertiary,
      borderWidth:     1,
      borderColor:     colors.borderDefault,
      alignItems:      'center',
      justifyContent:  'center',
    },
    avatarFallbackText: {
      fontFamily: fonts.mono,
      fontSize:   fontSizes.h2,
      color:      colors.primary,
    },
    displayName: {
      fontFamily:    fonts.display,
      fontSize:      fontSizes.h2,
      color:         colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    levelInfo: {
      fontFamily:    fonts.mono,
      fontSize:      fontSizes.caption,
      color:         colors.textMuted,
      letterSpacing: 1,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: colors.borderDefault,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           spacing.sm,
      padding:       spacing.lg,
    },
    menuRowBordered: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             spacing.sm,
      padding:         spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDefault,
    },
    menuText: {
      fontFamily:    fonts.mono,
      fontSize:      fontSizes.body,
      color:         colors.textSecondary,
      letterSpacing: 1,
    },
    dangerText: {
      fontFamily:    fonts.mono,
      fontSize:      fontSizes.body,
      color:         colors.danger,
      letterSpacing: 1,
    },
    editHeader: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             spacing.sm,
      padding:         spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDefault,
    },
    editTitle: {
      fontFamily:    fonts.mono,
      fontSize:      fontSizes.body,
      color:         colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    editForm: {
      padding: spacing.lg,
      gap:     spacing.sm,
    },
    textInput: {
      fontFamily:        fonts.mono,
      fontSize:          fontSizes.body,
      color:             colors.textData,
      backgroundColor:   colors.bgTertiary,
      borderWidth:       1,
      borderColor:       inputHasError ? colors.danger : colors.borderDefault,
      borderRadius:      radii.md,
      paddingVertical:   spacing.md,
      paddingHorizontal: spacing.lg,
    },
    inputErrorText: {
      fontFamily: fonts.caption,
      fontSize:   fontSizes.caption,
      color:      colors.danger,
    },
    confirmRow: {
      borderTopWidth: 1,
      borderTopColor: colors.borderDefault,
    },
    confirmButton: {
      padding:    spacing.lg,
      alignItems: 'center',
    },
    confirmText: {
      fontFamily:    fonts.mono,
      fontSize:      fontSizes.body,
      color:         colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
  });
