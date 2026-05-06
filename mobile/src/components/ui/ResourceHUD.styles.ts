import { StyleSheet } from "react-native";
import type { UseThemeReturn } from "@/constants/theme/hooks/useTheme";

export const makeStyles = (
  { colors, fonts, fontSizes, borderWidths }: UseThemeReturn,
  contentHeight: number,
  paddingTop: number,
) =>
  StyleSheet.create({
    container: {
      height: contentHeight + paddingTop,
      paddingTop,
      paddingHorizontal: 16,
      backgroundColor: colors.bgSecondary,
      borderBottomWidth: borderWidths.thin,
      borderBottomColor: colors.borderDefault,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
    },
    loadingText: {
      color: colors.textMuted,
      fontSize: fontSizes.micro,
      fontFamily: fonts.mono,
    },
    pctText: {
      fontFamily: fonts.mono,
      fontSize: fontSizes.micro,
      marginLeft: 4,
      letterSpacing: 0.5,
    },
  });
