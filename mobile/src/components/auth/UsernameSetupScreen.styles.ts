import { StyleSheet } from 'react-native';
import type { useTheme } from '@/constants/theme';

type Theme = ReturnType<typeof useTheme>;

export const makeStyles = ({ colors, fonts, fontSizes, spacing, radii }: Theme) =>
  StyleSheet.create({
    container: {
      flex:            1,
      justifyContent:  'space-between',
      paddingVertical: 80,
      backgroundColor: colors.bgPrimary,
    },
    inner: {
      flex:           1,
      justifyContent: 'center',
      gap:            24,
      padding:        spacing.xl,
    },
    identity: {
      alignItems:   'center',
      marginBottom: 8,
    },
    avatar: {
      width:        72,
      height:       72,
      borderRadius: 36,
      borderWidth:  1,
      borderColor:  colors.borderDefault,
    },
    avatarFallback: {
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: colors.bgTertiary,
    },
    avatarInitial: {
      fontFamily: fonts.display,
      fontSize:   28,
      color:      colors.primary,
    },
    name: {
      fontFamily: fonts.heading,
      fontSize:   fontSizes.h2,
      color:      colors.textPrimary,
      marginTop:  spacing.lg,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize:   fontSizes.body,
      color:      colors.textMuted,
      marginTop:  spacing.xs,
      textAlign:  'center',
    },
    buttonActive: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: colors.primary,
      borderRadius:    radii.md,
      padding:         spacing.lg,
    },
    buttonDisabled: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: colors.bgTertiary,
      borderRadius:    radii.md,
      padding:         spacing.lg,
    },
    buttonTextActive: {
      fontFamily:    fonts.heading,
      fontSize:      fontSizes.body,
      color:         colors.bgPrimary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    buttonTextDisabled: {
      fontFamily:    fonts.heading,
      fontSize:      fontSizes.body,
      color:         colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
  });
