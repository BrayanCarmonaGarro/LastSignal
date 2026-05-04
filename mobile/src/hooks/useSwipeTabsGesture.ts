import { useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  ENTER_FRICTION,
  ENTER_TENSION,
  PULL_MAX_DISPLAY,
  PULL_RUBBER_BAND,
  PULL_START_ZONE_Y,
  PULL_THRESHOLD,
  RUBBER_BAND_FACTOR,
  SNAP_FRICTION,
  SNAP_TENSION,
  TAB_ORDER,
  clamp,
  createSpring,
  getSwipeTargetIndex,
  getTabIndexFromPath,
} from "./useSwipeTabsGesture.utils";

type GestureDirection = "unknown" | "horizontal" | "vertical";

export interface SwipeTabsState {
  pageOffset: Animated.Value;
  pullOffset: Animated.Value;
  panHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  currentTabIndex: number;
  registerRefreshHandler: (tabIndex: number, fn: () => void) => void;
}

export function useSwipeTabsGestureLogic(): SwipeTabsState {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const pageOffset = useRef(new Animated.Value(0)).current;
  const pullOffset = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const tabIndexRef = useRef(0);
  const gestureDirectionRef = useRef<GestureDirection>("unknown");
  const refreshHandlersRef = useRef<Map<number, () => void>>(new Map());
  const isRefreshingRef = useRef(false);

  const registerRefreshHandler = (tabIndex: number, fn: () => void) => {
    refreshHandlersRef.current.set(tabIndex, fn);
  };

  const currentTabIndex = useMemo(() => {
    return getTabIndexFromPath(pathname);
  }, [pathname]);

  useEffect(() => {
    tabIndexRef.current = currentTabIndex;
    isAnimating.current = true;
    createSpring(
      pageOffset,
      currentTabIndex,
      ENTER_TENSION,
      ENTER_FRICTION,
      () => {
        isAnimating.current = false;
      },
    );
  }, [currentTabIndex, pageOffset]);

  const navigateToTab = (index: number) => {
    router.navigate(`/(app)/(tabs)/${TAB_ORDER[index]}` as never);
  };

  const snapToIndex = (index: number) => {
    createSpring(pageOffset, index, SNAP_TENSION, SNAP_FRICTION);
  };

  const animateToIndex = (index: number) => {
    isAnimating.current = true;
    navigateToTab(index);
    createSpring(pageOffset, index, ENTER_TENSION, ENTER_FRICTION, () => {
      isAnimating.current = false;
    });
  };

  const snapPullBack = () => {
    Animated.spring(pullOffset, {
      toValue: 0,
      tension: SNAP_TENSION,
      friction: SNAP_FRICTION,
      useNativeDriver: true,
    }).start(() => {
      isRefreshingRef.current = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        const dx = Math.abs(gs.dx);
        const dy = Math.abs(gs.dy);

        // Vertical pull-to-refresh: downward drag starting near top of screen
        if (
          dy > 12 &&
          gs.dy > 0 &&
          dy > dx * 1.5 &&
          gs.y0 < PULL_START_ZONE_Y &&
          !isRefreshingRef.current
        ) {
          return true;
        }

        // Horizontal tab swipe (disabled on trips tab)
        if (tabIndexRef.current === TAB_ORDER.indexOf("trips")) return false;
        return dx > 12 && dx > dy * 1.5;
      },

      onPanResponderGrant: () => {
        gestureDirectionRef.current = "unknown";
      },

      onPanResponderMove: (_, gs) => {
        const dx = Math.abs(gs.dx);
        const dy = Math.abs(gs.dy);

        // Lock direction on first significant move
        if (gestureDirectionRef.current === "unknown") {
          if (dx > dy * 1.5) gestureDirectionRef.current = "horizontal";
          else if (dy > dx * 1.5) gestureDirectionRef.current = "vertical";
        }

        if (gestureDirectionRef.current === "horizontal") {
          if (isAnimating.current) return;
          const rawOffset = tabIndexRef.current - gs.dx / width;
          const clamped = clamp(rawOffset, 0, TAB_ORDER.length - 1);
          pageOffset.setValue(
            clamped + (rawOffset - clamped) * RUBBER_BAND_FACTOR,
          );
        } else if (gestureDirectionRef.current === "vertical" && gs.dy > 0) {
          const raw = gs.dy * PULL_RUBBER_BAND;
          pullOffset.setValue(Math.min(raw, PULL_MAX_DISPLAY));
        }
      },

      onPanResponderRelease: (_, gs) => {
        if (gestureDirectionRef.current === "horizontal") {
          if (isAnimating.current) return;
          const target = getSwipeTargetIndex({
            currentIndex: tabIndexRef.current,
            dx: gs.dx,
            vx: gs.vx,
            width,
          });
          if (target === tabIndexRef.current) {
            snapToIndex(target);
          } else {
            animateToIndex(target);
          }
        } else if (gestureDirectionRef.current === "vertical") {
          if (gs.dy >= PULL_THRESHOLD && !isRefreshingRef.current) {
            isRefreshingRef.current = true;
            refreshHandlersRef.current.get(tabIndexRef.current)?.();
          }
          snapPullBack();
        }

        gestureDirectionRef.current = "unknown";
      },

      onPanResponderTerminate: () => {
        gestureDirectionRef.current = "unknown";
        isAnimating.current = false;
        snapToIndex(tabIndexRef.current);
        snapPullBack();
      },
    }),
  ).current;

  return {
    pageOffset,
    pullOffset,
    panHandlers: panResponder.panHandlers,
    currentTabIndex,
    registerRefreshHandler,
  };
}
