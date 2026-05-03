import { StyleSheet } from 'react-native';
import type { useTheme } from '@/constants/theme';

type Theme = ReturnType<typeof useTheme>;

export const makeStyles = ({ colors, fonts, fontSizes, spacing, radii, shadows }: Theme) =>
  StyleSheet.create({
    container: {
      flex:            1,
      justifyContent:  'space-between',
      paddingVertical: 80,
      padding:         spacing.xl,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      alignItems: 'center',
    },
    title: {
      fontFamily:    fonts.display,
      fontSize:      fontSizes.display,
      color:         colors.primary,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize:   fontSizes.body,
      color:      colors.textMuted,
      marginTop:  spacing.sm,
      textAlign:  'center',
    },
    loginButton: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: colors.bgTertiary,
      borderRadius:    radii.md,
      borderWidth:     1,
      borderColor:     colors.borderDefault,
      padding:         spacing.lg,
      ...shadows.md,
    },
    loginButtonText: {
      fontFamily:    fonts.heading,
      fontSize:      fontSizes.body,
      color:         colors.textPrimary,
      marginLeft:    spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
