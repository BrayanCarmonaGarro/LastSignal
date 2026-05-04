import React, { createContext, useContext } from "react";
import type { SwipeTabsState } from "@/hooks/useSwipeTabsGesture";
import { useSwipeTabsGestureLogic } from "@/hooks/useSwipeTabsGesture";

const SwipeTabsContext = createContext<SwipeTabsState | null>(null);

export function SwipeTabsProvider({ children }: { children: React.ReactNode }) {
  const swipeState = useSwipeTabsGestureLogic();

  return (
    <SwipeTabsContext.Provider value={swipeState}>
      {children}
    </SwipeTabsContext.Provider>
  );
}

export function useSwipeTabsGesture() {
  const ctx = useContext(SwipeTabsContext);
  if (!ctx) {
    throw new Error(
      "useSwipeTabsGesture must be used inside SwipeTabsProvider",
    );
  }
  return ctx;
}
