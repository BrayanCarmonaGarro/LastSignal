import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useActiveTripBanner } from '@/hooks/dashboard/useActiveTripBanner';
import { formatElapsed } from '@/utils/formatters';
import { createStyles } from './ActiveTripBanner.styles';
import type { DashboardActiveTrip } from '@/types/trip.types';

interface ActiveTripBannerProps {
  trip: DashboardActiveTrip;
  onPress?: () => void;
}

export function ActiveTripBanner({ trip, onPress }: ActiveTripBannerProps) {
  const theme = useTheme();
  const { oxygenRemaining, oxygenPercent, fillColor, oxygenValueColor, borderOpacity } =
    useActiveTripBanner(trip);

  const styles = createStyles(theme, { oxygenValueColor, fillColor, oxygenPercent });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.animatedBorder, { opacity: borderOpacity }]}
          pointerEvents="none"
        />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="rocket-outline" size={theme.iconSizes.sm} color={theme.colors.oxygen} />
            <Text style={styles.title}>Viaje Activo</Text>
          </View>
          {trip.destination ? (
            <Text style={styles.destination}>{trip.destination}</Text>
          ) : null}
        </View>

        {/* Oxygen readout */}
        <Text style={styles.oxygenValue}>
          {oxygenRemaining.toFixed(1)}
          <Text style={styles.oxygenUnit}>{' '}L O₂</Text>
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>

        {/* Footer row */}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={theme.iconSizes.xs} color={theme.colors.textMuted} />
            <Text style={styles.elapsedText}>{formatElapsed(trip.started_at)}</Text>
          </View>
          <Text style={styles.tapHint}>Toca para ver mapa</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
