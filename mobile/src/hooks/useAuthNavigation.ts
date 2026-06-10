import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export function useAuthNavigation(fontsLoaded: boolean) {
  const { user, dbUser, isLoading } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || !fontsLoaded || !segments[0]) return;

    const inAuth        = segments[0] === '(auth)';
    const inApp         = segments[0] === '(app)';
    const authenticated = !!user && !!dbUser?.username;

    if (!authenticated && inApp) {
      router.replace('/(auth)/login');
    }

    if (authenticated && inAuth) {
      router.replace('/(app)/(tabs)/dashboard');
    }

  }, [user, dbUser, isLoading, fontsLoaded, segments]);
}