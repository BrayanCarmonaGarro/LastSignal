import { StyleSheet } from "react-native";
import type { useTheme } from "@/constants/theme";

type Theme = ReturnType<typeof useTheme>;

export const makeStyles = ({
  colors,
  fonts,
  fontSizes,
  borderWidths,
  radii,
}: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgSecondary,
      borderTopColor: colors.borderDefault,
      borderTopWidth: borderWidths.thin,
    },
    side: {
      flex: 1,
      flexDirection: "row",
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 10,
      paddingBottom: 4,
    },
    tabActive: {
      borderTopWidth: 2,
      borderTopColor: colors.primary,
    },
    label: {
      fontFamily: fonts.caption,
      fontSize: fontSizes.micro,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginTop: 3,
    },
    labelActive: {
      color: colors.primary,
    },
    labelInactive: {
      color: colors.textMuted,
    },
    centerWrapper: {
      width: 72,
      alignItems: "center",
      justifyContent: "center",
    },
    captureButton: {
      width: 58,
      height: 58,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: radii.full,
    },
  });
