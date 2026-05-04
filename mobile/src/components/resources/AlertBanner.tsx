import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resourcesTheme as T } from '@/constants/theme/screens/resources';

interface Props {
  criticals: string[];
  lows: string[];
}

export function AlertBanner({ criticals, lows }: Props) {
  if (criticals.length === 0 && lows.length === 0) return null;

  return (
    <View style={[
      styles.container,
      criticals.length > 0 && styles.containerCritical,
    ]}>
      <View style={styles.header}>
        <Text style={styles.title}>RESUMEN DEL SISTEMA</Text>
        <View style={styles.divider} />
      </View>

      {criticals.length > 0 && (
        <View style={styles.row}>
          <Ionicons name="warning-outline" size={12} color={T.statusCritical} style={styles.icon} />
          <Text style={styles.label}>Recursos Críticos:</Text>
          <Text style={[styles.value, { color: T.statusCritical }]}>
            {criticals.join(', ')}
          </Text>
        </View>
      )}

      {lows.length > 0 && (
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={12} color={T.statusLow} style={styles.icon} />
          <Text style={styles.label}>Recursos Bajos:</Text>
          <Text style={[styles.value, { color: T.statusLow }]}>
            {lows.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.bgSummary,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 2,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  containerCritical: {
    borderTopWidth: 2,
    borderTopColor: T.statusCritical,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontFamily: 'BarlowCondensed-700',
    fontSize: 11,
    letterSpacing: 3,
    color: T.textSecondary,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: T.textSecondary,
    letterSpacing: 0.5,
    marginRight: 4,
  },
  value: {
    fontFamily: 'BarlowCondensed-700',
    fontSize: 12,
    letterSpacing: 1,
    flex: 1,
  },
});
