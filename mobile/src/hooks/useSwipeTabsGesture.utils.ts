import { Animated } from "react-native";

export const TAB_ORDER = [
  "dashboard",
  "logbook",
  "resources",
  "trips",
] as const;
export type TabName = (typeof TAB_ORDER)[number];

export const SWIPE_THRESHOLD_RATIO = 0.25;
export const VELOCITY_THRESHOLD = 0.5;
export const RUBBER_BAND_FACTOR = 0.15;
export const ENTER_TENSION = 200;
export const ENTER_FRICTION = 20;
export const SNAP_TENSION = 80;
export const SNAP_FRICTION = 12;

export const PULL_THRESHOLD = 70;
export const PULL_MAX_DISPLAY = 60;
export const PULL_START_ZONE_Y = 200;
export const PULL_RUBBER_BAND = 0.4;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getTabIndexFromPath = (pathname: string) => {
  const segment = pathname
    .split("/")
    .find((seg) => TAB_ORDER.includes(seg as TabName));
  return segment ? TAB_ORDER.indexOf(segment as TabName) : 0;
};

export const createSpring = (
  value: Animated.Value,
  toValue: number,
  tension: number,
  friction: number,
  onEnd?: () => void,
) =>
  Animated.spring(value, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (finished) onEnd?.();
  });

export const getSwipeTargetIndex = ({
  currentIndex,
  dx,
  vx,
  width,
}: {
  currentIndex: number;
  dx: number;
  vx: number;
  width: number;
}) => {
  const threshold = width * SWIPE_THRESHOLD_RATIO;
  const goLeft = dx < -threshold || vx < -VELOCITY_THRESHOLD;
  const goRight = dx > threshold || vx > VELOCITY_THRESHOLD;
  const atLeft = currentIndex === 0;
  const atRight = currentIndex === TAB_ORDER.length - 1;

  if (goLeft && !atRight) return currentIndex + 1;
  if (goRight && !atLeft) return currentIndex - 1;
  return currentIndex;
};
