// src/app/_layout.tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/authStore";
import { useAuthNavigation } from "@/hooks/useAuthNavigation";

export default function RootLayout() {
  const { loadSession } = useAuthStore();

  const [fontsLoaded] = useFonts({
    "BarlowCondensed-700": require("@/assets/fonts/BarlowCondensed-Bold.ttf"),
    "BarlowCondensed-500": require("@/assets/fonts/BarlowCondensed-Medium.ttf"),
    "Barlow-400": require("@/assets/fonts/Barlow-Regular.ttf"),
    "Barlow-300": require("@/assets/fonts/Barlow-Light.ttf"),
    ShareTechMono: require("@/assets/fonts/ShareTechMono-Regular.ttf"),
  });

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useAuthNavigation(fontsLoaded);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
