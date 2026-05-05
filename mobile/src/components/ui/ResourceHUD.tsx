import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme';
import { useResourceStore } from '@/store/resourceStore';
import { HUD_RESOURCE_NAMES, HUD_RESOURCE_CATEGORY, getResourceIcon } from '@/constants/resources';
import { calcResourcePct } from '@/utils/resources';
import { makeStyles } from './ResourceHUD.styles';
import type { Resource } from '@/types/resource.types';

const CONTENT_HEIGHT = 28;

export function ResourceHUD() {
  const { resources, loading, error, fetchResources } = useResourceStore();
  const theme = useTheme();
  const { colors, resourceColors } = theme;
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, CONTENT_HEIGHT, insets.top);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  if (error) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        {HUD_RESOURCE_NAMES.map((name) => (
          <View key={name} style={styles.item}>
            <Text style={styles.loadingText}>•••</Text>
          </View>
        ))}
      </View>
    );
  }

  const hudResources = HUD_RESOURCE_NAMES
    .map((name) => resources.find((r) => r.name === name))
    .filter((r): r is Resource => r !== undefined);

  if (hudResources.length === 0) return null;

  return (
    <View style={styles.container}>
      {hudResources.map((resource) => {
        const pct = calcResourcePct(resource.name, resource.current_amount);
        const isCritical = resource.current_amount <= resource.min_threshold;
        const category = HUD_RESOURCE_CATEGORY[resource.name as keyof typeof HUD_RESOURCE_CATEGORY] ?? resource.category;
        const catColor = resourceColors[category].primary;
        const iconColor = isCritical ? colors.danger : catColor;
        const textColor = isCritical ? colors.textDanger : catColor;

        return (
          <View key={resource.id} style={styles.item}>
            <Ionicons
              name={getResourceIcon(resource.name, resource.category) as any}
              size={13}
              color={iconColor}
            />
            <Text style={[styles.pctText, { color: textColor }]}>
              {pct}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}
