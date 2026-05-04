import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';

interface TextInputFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function TextInputField({ label, error, style, ...props }: TextInputFieldProps) {
  const theme = useTheme();
  const styles = makeStyles(theme, !!error);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, style]}
      />
      <View style={styles.errorSlot}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (
  { colors, fonts, fontSizes, spacing, radii }: ReturnType<typeof useTheme>,
  hasError: boolean,
) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    label: {
      fontFamily:    fonts.heading,
      fontSize:      fontSizes.caption,
      color:         hasError ? colors.danger : colors.textMuted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom:  spacing.xs,
    },
    input: {
      fontFamily:        fonts.mono,
      fontSize:          fontSizes.body,
      color:             colors.textData,
      backgroundColor:   colors.bgTertiary,
      borderColor:       hasError ? colors.danger : colors.borderDefault,
      borderRadius:      radii.md,
      paddingVertical:   spacing.md,
      paddingHorizontal: spacing.lg,
      borderWidth:       1,
    },
    errorSlot: {
      minHeight: fontSizes.caption + spacing.xs,
    },
    errorText: {
      fontFamily: fonts.body,
      fontSize:   fontSizes.caption,
      color:      colors.danger,
      marginTop:  spacing.xs,
    },
  });
