import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Svg, Polygon } from 'react-native-svg';

// Generates SVG polygon points for a 5-pointed star of the given size
function starPoints(size: number): string {
  const c = size / 2;
  const r = size / 2;
  const ir = r * 0.42;
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const rad = i % 2 === 0 ? r : ir;
    return `${c + rad * Math.cos(angle)},${c + rad * Math.sin(angle)}`;
  }).join(' ');
}

type StarConfig = {
  x: number;
  y: number;
  size: number;
  points: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  maxOpacity: number;
};

function Star({ x, y, size, points, duration, delay, driftX, driftY, maxOpacity }: StarConfig) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: maxOpacity, duration: duration * 0.4, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.05, duration: duration * 0.6, useNativeDriver: true }),
          ]),
        ),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateX, { toValue: driftX, duration: duration * 1.4, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 0, duration: duration * 1.4, useNativeDriver: true }),
          ]),
        ),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, { toValue: driftY, duration: duration, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: duration, useNativeDriver: true }),
          ]),
        ),
      ]),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      style={[
        s.star,
        { left: x, top: y, width: size, height: size },
        { opacity, transform: [{ translateX }, { translateY }] },
      ]}
    >
      <Svg width={size} height={size}>
        <Polygon points={points} fill="#D4A012" />
      </Svg>
    </Animated.View>
  );
}

export function StarField() {
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const stars = useMemo<StarConfig[]>(() => {
    if (!dims.w) return [];
    return Array.from({ length: 22 }, () => {
      const size = Math.random() * 8 + 5;
      return {
        x: Math.random() * (dims.w - size),
        y: Math.random() * Math.max(dims.h - size, 10),
        size,
        points: starPoints(size),
        duration: Math.random() * 2500 + 2000,
        delay: Math.random() * 3000,
        driftX: (Math.random() - 0.5) * 30,
        driftY: (Math.random() - 0.5) * 20,
        maxOpacity: Math.random() * 0.3 + 0.65,
      };
    });
  }, [dims.w, dims.h]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={e =>
        setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {stars.map((star, i) => (
        <Star key={i} {...star} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  star: { position: 'absolute' },
});
