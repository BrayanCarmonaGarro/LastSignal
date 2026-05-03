// src/app/_layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/store/authStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'BarlowCondensed-700': require('@/assets/fonts/BarlowCondensed-Bold.ttf'),
    'BarlowCondensed-500': require('@/assets/fonts/BarlowCondensed-Medium.ttf'),
    'Barlow-400':          require('@/assets/fonts/Barlow-Regular.ttf'),
    'Barlow-300':          require('@/assets/fonts/Barlow-Light.ttf'),
    'ShareTechMono':       require('@/assets/fonts/ShareTechMono-Regular.ttf'),
  });

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(app)/(tabs)/dashboard');
    }
  }, [user, isLoading, fontsLoaded, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}