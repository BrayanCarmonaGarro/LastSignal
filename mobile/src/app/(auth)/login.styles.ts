import { Dimensions, StyleSheet } from 'react-native';
import { palette } from '@/constants/theme';
import type { useTheme } from '@/constants/theme';

type Theme = ReturnType<typeof useTheme>;

const { height } = Dimensions.get('window');

export const makeStyles = ({ colors, fonts, fontSizes, spacing }: Theme) =>
  StyleSheet.create({
    root: {
      flex:            1,
      backgroundColor: colors.bgPrimary,
    },
    content: {
      flexGrow:          1,
      alignItems:        'center',
      justifyContent:    'center',
      paddingHorizontal: spacing.xl,
      paddingTop:        spacing['3xl'],
      paddingBottom:     spacing.xl,
      gap:               spacing.md,
    },
    statusBar: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      width:          '100%',
      marginBottom:   -4,
    },
    statusText: {
      fontFamily:    fonts.mono,
      fontSize:      10,
      color:         colors.textMuted,
      letterSpacing: 1,
    },
    badge: {
      flexDirection:     'row',
      alignItems:        'center',
      borderWidth:       1,
      borderRadius:      999,
      paddingHorizontal: spacing.md,
      paddingVertical:   5,
      gap:               7,
    },
    badgeDot: {
      width:        7,
      height:       7,
      borderRadius: 3.5,
    },
    badgeText: {
      fontFamily:    fonts.mono,
      fontSize:      11,
      letterSpacing: 2,
    },
    logoWrap: {
      width:          120,
      height:         120,
      marginVertical: spacing.sm,
    },
    wordmarkWrap: {
      alignItems:     'center',
      justifyContent: 'center',
      marginVertical: -4,
    },
    wordmarkBase: {
      fontFamily:    fonts.display,
      fontSize:      34,
      letterSpacing: 6,
      textTransform: 'uppercase',
    },
    wordmarkTop: {
      position: 'absolute',
    },
    subtitle: {
      fontFamily:    fonts.mono,
      fontSize:      11,
      color:         colors.textMuted,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    divider: {
      marginVertical: spacing.xs,
    },
    authLabel: {
      fontFamily:    fonts.mono,
      fontSize:      9,
      color:         colors.textMuted,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
    },
    btn: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'center',
      gap:               spacing.md,
      width:             280,
      paddingVertical:   15,
      paddingHorizontal: spacing.xl,
      borderRadius:      4,
      borderWidth:       1,
      marginTop:         spacing.xs,
    },
    btnText: {
      fontFamily:    fonts.heading,
      fontSize:      fontSizes.data,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    scanBar: {
      width:  280,
      height: 1,
    },
    footer: {
      alignItems: 'center',
      gap:        3,
      marginTop:  spacing.sm,
    },
    footerText: {
      fontFamily:    fonts.mono,
      fontSize:      9,
      color:         colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    nebula1: {
      position:        'absolute',
      left:            -80,
      top:             height * 0.05,
      width:           320,
      height:          320,
      borderRadius:    160,
      backgroundColor: colors.oxygenBg,
    },
    nebula2: {
      position:        'absolute',
      right:           -60,
      top:             height * 0.35,
      width:           260,
      height:          260,
      borderRadius:    130,
      backgroundColor: palette.fungiBg,
    },
  });
