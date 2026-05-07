import React from 'react';
import { View, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function LogbookSearchBar({ value, onChangeText, onSubmit, onClear, isLoading }: Props) {
  const { colors, fonts, fontSizes, spacing, radii, borderWidths, iconSizes } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 48, 
        backgroundColor: colors.bgTertiary,
        borderRadius: radii.xl,
        borderWidth: borderWidths.base,
        borderColor: isLoading ? colors.primary : colors.borderDefault,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        marginBottom: 12,
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="search" size={iconSizes.sm} color={colors.textMuted} />
      )}
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit} 
        placeholder="Pregunta a la IA sobre hallazgos..."
        placeholderTextColor={colors.textMuted}
        style={{
          flex: 1,
          fontFamily: fonts.body,
          fontSize: fontSizes.body,
          color: colors.textPrimary,
          padding: 0,
        }}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}