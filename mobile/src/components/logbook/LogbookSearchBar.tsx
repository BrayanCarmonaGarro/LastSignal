import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export function LogbookSearchBar({ value, onChangeText }: Props) {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        backgroundColor: colors.bgTertiary,
        borderRadius: radii.xl,
        borderWidth: borderWidths.base,
        borderColor: colors.borderDefault,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        marginBottom: 12,
      }}
    >
      <Ionicons name="search" size={iconSizes.sm} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Buscar en bitácora..."
        placeholderTextColor={colors.textMuted}
        style={{
          flex: 1,
          fontFamily: fonts.body,
          fontSize: fontSizes.body,
          color: colors.textPrimary,
          padding: 0,
        }}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}
