/*
import { useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  ENTER_FRICTION,
  ENTER_TENSION,
  RUBBER_BAND_FACTOR,
  SNAP_FRICTION,
  SNAP_TENSION,
  TAB_ORDER,
  clamp,
  createSpring,
  getSwipeTargetIndex,
  getTabIndexFromPath,
} from "./useSwipeTabsGesture.utils";

export interface SwipeTabsState {
  pageOffset: Animated.Value;
  panHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  currentTabIndex: number;
}

export function useSwipeTabsGestureLogic(): SwipeTabsState {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const pageOffset = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const tabIndexRef = useRef(0);

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        if (tabIndexRef.current === TAB_ORDER.indexOf("trips")) return false;
        const dx = Math.abs(gs.dx);
        const dy = Math.abs(gs.dy);
        return dx > 12 && dx > dy * 1.5;
      },
      onPanResponderMove: (_, gs) => {
        if (isAnimating.current) return;

        const rawOffset = tabIndexRef.current - gs.dx / width;
        const clamped = clamp(rawOffset, 0, TAB_ORDER.length - 1);
        // Rubber-band effect when pulling past tab bounds.
        pageOffset.setValue(
          clamped + (rawOffset - clamped) * RUBBER_BAND_FACTOR,
        );
      },
      onPanResponderRelease: (_, gs) => {
        if (isAnimating.current) return;

        const target = getSwipeTargetIndex({
          currentIndex: tabIndexRef.current,
          dx: gs.dx,
          vx: gs.vx,
          width,
        });
        if (target === tabIndexRef.current) {
          snapToIndex(target);
          return;
        }

        animateToIndex(target);
      },
      onPanResponderTerminate: () => {
        isAnimating.current = false;
        snapToIndex(tabIndexRef.current);
      },
    }),
  ).current;

  return {
    pageOffset,
    panHandlers: panResponder.panHandlers,
    currentTabIndex,
  };
}

*/