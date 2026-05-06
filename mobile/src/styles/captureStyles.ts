import { StyleSheet } from 'react-native';
import { palette } from '@/constants/theme';
import type { UseThemeReturn } from '@/constants/theme/hooks/useTheme';

export const makeStyles = ({
  colors,
  fonts,
  fontSizes,
  spacing,
  radii,
  layout,
}: UseThemeReturn) =>
  StyleSheet.create({
    container:         { flex: 1, backgroundColor: colors.bgPrimary },
    center:            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: layout.screenPaddingH, backgroundColor: colors.bgPrimary },
    camera:            { flex: 1, justifyContent: 'flex-end' },
    controls:          { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: spacing['2xl'], paddingHorizontal: layout.screenPaddingH },
    captureBtn:        { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.white, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
    iconBtn:           { width: 56, height: 56, backgroundColor: colors.overlayLight, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    text:              { fontFamily: fonts.body, fontSize: fontSizes.h3, textAlign: 'center', marginBottom: spacing.xl, color: colors.textPrimary },
    btn:               { padding: spacing.lg, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
    btnText:           { fontFamily: fonts.heading, color: colors.textPrimary, fontSize: fontSizes.body },
    btnTextNeutral:    { fontFamily: fonts.heading, color: colors.textPrimary, fontSize: fontSizes.body },
    btnTextLg:         { fontFamily: fonts.heading, color: '#FFFFFF', fontSize: fontSizes.h2 },
    btnGray:           { backgroundColor: colors.bgPrimary, flex: 1, borderWidth: 1, borderColor: colors.borderDefault },
    btnRed:            { backgroundColor: colors.bgPrimary, flex: 1, borderWidth: 1, borderColor: colors.borderDefault },
    btnBlue:           { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radii.xl },
    preview:           { flex: 1, width: '100%' },
    previewControls:   { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.bgSecondary, paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg },
    row:               { flexDirection: 'row', justifyContent: 'space-between', gap: layout.cardGap },
    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    processingText:    { fontFamily: fonts.mono, color: colors.textSuccess, marginTop: spacing.lg, fontSize: fontSizes.h3, textAlign: 'center', paddingHorizontal: layout.screenPaddingH },
    errorContainer:    { position: 'absolute', top: 50, left: layout.screenPaddingH, right: layout.screenPaddingH, backgroundColor: colors.dangerBg, padding: spacing.sm, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderDanger },
    error:             { fontFamily: fonts.body, color: colors.textDanger, textAlign: 'center' },
    backBtn:           { position: 'absolute', top: 50, left: layout.screenPaddingH, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.overlayLight, alignItems: 'center', justifyContent: 'center' },
    flashBtn:          { position: 'absolute', top: 50, right: layout.screenPaddingH, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.overlayLight, alignItems: 'center', justifyContent: 'center' },
  });
