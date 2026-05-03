import { View, Text } from 'react-native';
import { useTheme } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const { colors, fonts, fontSizes, spacing, letterSpacings } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md, marginTop: spacing.xl }}>
      <Text
        style={{
          fontFamily:    fonts.display,
          fontSize:      fontSizes.h2,
          color:         colors.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: letterSpacings.wider,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: fonts.caption,
            fontSize:   fontSizes.caption,
            color:      colors.textMuted,
            marginTop:  2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
