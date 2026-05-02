import { useEffect, useRef, useMemo, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

function getTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function useLoginAnimations() {
  const sweepAnim    = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const nebulaAnim   = useRef(new Animated.Value(0.5)).current;
  const glowAnim     = useRef(new Animated.Value(0.4)).current;
  const dotAnim      = useRef(new Animated.Value(1)).current;
  const scanAnim     = useRef(new Animated.Value(0.15)).current;

  const [time, setTime] = useState(getTime);

  const stars = useMemo(() =>
    Array.from({ length: 70 }, () => ({
      x:        Math.random() * width,
      y:        Math.random() * height * 0.85,
      size:     Math.random() * 2 + 0.5,
      anim:     new Animated.Value(Math.random()),
      duration: 1000 + Math.random() * 2500,
      delay:    Math.random() * 4000,
    })),
  []);

  useEffect(() => {
    const clockInterval = setInterval(() => setTime(getTime()), 30000);

    const runSweep = () => {
      sweepAnim.setValue(0);
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) runSweep(); });
    };
    runSweep();

    const runPulse = () => {
      pulseOpacity.setValue(0.7);
      pulseScale.setValue(1);
      Animated.parallel([
        Animated.timing(pulseOpacity, { toValue: 0,    duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseScale,   { toValue: 1.25, duration: 2500, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) runPulse(); });
    };
    runPulse();

    Animated.loop(Animated.sequence([
      Animated.timing(nebulaAnim, { toValue: 1,   duration: 7000, useNativeDriver: true }),
      Animated.timing(nebulaAnim, { toValue: 0.5, duration: 7000, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1,   duration: 2000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 0.1, duration: 700, useNativeDriver: true }),
      Animated.timing(dotAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 0.85, duration: 1250, useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0.15, duration: 1250, useNativeDriver: true }),
    ])).start();

    const timeouts = stars.map((star) =>
      setTimeout(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(star.anim, { toValue: 0.08, duration: star.duration / 2, useNativeDriver: true }),
          Animated.timing(star.anim, { toValue: 1,    duration: star.duration / 2, useNativeDriver: true }),
        ])).start();
      }, star.delay)
    );

    return () => {
      clearInterval(clockInterval);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const sweepRotation = sweepAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    sweepRotation,
    pulseOpacity,
    pulseScale,
    nebulaAnim,
    glowAnim,
    dotAnim,
    scanAnim,
    stars,
    time,
  };
}
