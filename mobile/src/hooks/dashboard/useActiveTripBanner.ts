import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '@/constants/theme';
import type { DashboardActiveTrip } from '@/types/trip.types';

const OXYGEN_CRITICAL_THRESHOLD = 0.3;
const OXYGEN_WARNING_THRESHOLD = 0.6;
const BLINK_DURATION_MS = 700;
const BLINK_MIN_OPACITY = 0.2;

export function useActiveTripBanner(trip: DashboardActiveTrip) {
  const { colors } = useTheme();

  const oxygenRemaining = trip.initial_oxygen - trip.oxygen_consumed;
  const oxygenPercent = Math.max(oxygenRemaining / Math.max(trip.initial_oxygen, 1), 0);
  const isCritical = oxygenPercent < OXYGEN_CRITICAL_THRESHOLD;

  const fillColor =
    oxygenPercent > OXYGEN_WARNING_THRESHOLD
      ? colors.oxygen
      : oxygenPercent > OXYGEN_CRITICAL_THRESHOLD
        ? colors.textWarning
        : colors.danger;

  const oxygenValueColor = isCritical ? colors.textDanger : colors.textOxygen;

  const borderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isCritical) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(borderOpacity, {
            toValue: BLINK_MIN_OPACITY,
            duration: BLINK_DURATION_MS,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(borderOpacity, {
            toValue: 1,
            duration: BLINK_DURATION_MS,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      borderOpacity.setValue(1);
    }
    return () => animation?.stop();
  }, [isCritical, borderOpacity]);

  return {
    oxygenRemaining,
    oxygenPercent,
    isCritical,
    fillColor,
    oxygenValueColor,
    borderOpacity,
  };
}
