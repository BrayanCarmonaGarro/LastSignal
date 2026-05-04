// src/hooks/ui/useTabNavigation.ts
import { useRouter, usePathname } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TAB_CONFIG, TAB_KEYS, type TabKey } from "@/constants/tabs";

const STANDALONE_ROUTES = TAB_KEYS.map((name) => ({ name, key: name }));

const isTabKey = (name: string): name is TabKey => name in TAB_CONFIG;

export function useTabNavigation(
  state?: BottomTabBarProps["state"],
  navigation?: BottomTabBarProps["navigation"],
) {
  const router = useRouter();
  const pathname = usePathname();
  const fallbackTab: TabKey = "dashboard";

  const activeTabName = state
    ? ((state.routes[state.index]?.name as TabKey | undefined) ?? fallbackTab)
    : (pathname.split("/").find((seg) => isTabKey(seg)) ?? fallbackTab);

  const routes = state
    ? state.routes.filter((r): r is typeof r & { name: TabKey } =>
        isTabKey(r.name),
      )
    : STANDALONE_ROUTES;

  const makeOnPress = (route: { name: TabKey; key: string }) => () => {
    if (route.name === activeTabName) return;

    if (state && navigation) {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) navigation.navigate(route.name);
    } else {
      router.navigate(`/(app)/(tabs)/${route.name}` as never);
    }
  };

  return { activeTabName, routes, makeOnPress };
}
