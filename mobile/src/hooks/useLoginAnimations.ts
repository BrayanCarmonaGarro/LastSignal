import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export type Star = {
  x:    number;
  y:    number;
  size: number;
  anim: Animated.Value;
};

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x:    Math.random() * width,
    y:    Math.random() * height,
    size: Math.random() * 2 + 0.5,
    anim: new Animated.Value(Math.random()),
  }));
}

export function useLoginAnimations() {
  const sweepAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const nebulaAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0.3)).current;
  const dotAnim    = useRef(new Animated.Value(1)).current;
  const scanAnim   = useRef(new Animated.Value(0)).current;

  const [stars] = useState<Star[]>(() => makeStars(60));
  const [time, setTime]  = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      setTime(`${h}:${m} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweepAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();

    Animated.timing(nebulaAnim, { toValue: 1, duration: 2000, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.2, duration: 800,  useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1,   duration: 800,  useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0,   duration: 1500, useNativeDriver: true }),
      ]),
    ).start();

    stars.forEach((star) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(star.anim, {
            toValue:         Math.random() * 0.5 + 0.1,
            duration:        800 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(star.anim, {
            toValue:         Math.random() * 0.8 + 0.2,
            duration:        800 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => { if (finished) loop(); });
      };
      loop();
    });
  }, []);

  const sweepRotation = sweepAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0.8, 0.3, 0.8],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.95, 1.08],
  });

  return { sweepRotation, pulseOpacity, pulseScale, nebulaAnim, glowAnim, dotAnim, scanAnim, stars, time };
}
