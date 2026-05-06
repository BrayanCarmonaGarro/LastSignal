import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/constants/theme';
import type { LifeFormCategory } from '@/types/logbook.types';

type FilterKey =
  | 'ALL'
  | 'PELIGROSAS'
  | LifeFormCategory;

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',              label: 'TODAS'       },
  { key: 'PELIGROSAS',       label: 'PELIGROSAS'  },
  { key: 'ANIMAL',           label: 'ANIMAL'      },
  { key: 'PLANT',            label: 'PLANTA'      },
  { key: 'FUNGI',            label: 'FUNGI'       },
  { key: 'MINERAL',          label: 'MINERAL'     },
  { key: 'UNKNOWN_ORGANISM', label: 'DESCONOCIDO' },
];

interface Props {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}

export function LogbookFilterChips({ active, onChange }: Props) {
  const { colors, fonts, spacing, borderWidths } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginVertical: 8 }}
      contentContainerStyle={{
        paddingLeft: spacing.lg,
        paddingRight: spacing.md,
        gap: 6,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 0,
      }}
    >
      {CHIPS.map((chip) => {
        const isActive = chip.key === active;
        return (
          <TouchableOpacity
            key={chip.key}
            onPress={() => onChange(chip.key)}
            activeOpacity={0.75}
            style={{
              height: 28,
              paddingHorizontal: spacing.md,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isActive ? colors.primary : colors.bgTertiary,
              borderWidth: isActive ? 0 : borderWidths.base,
              borderColor: colors.borderDefault,
            }}
          >
            <Text
              style={{
                fontFamily: isActive ? fonts.heading : fonts.caption,
                fontSize: 12,
                color: isActive ? colors.bgPrimary : colors.textMuted,
                letterSpacing: 0.5,
              }}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export type { FilterKey };
