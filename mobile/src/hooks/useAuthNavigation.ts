// src/hooks/useAuthNavigation.ts
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export function useAuthNavigation(fontsLoaded: boolean) {
  const { user, dbUser, isLoading } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuth        = segments[0] === '(auth)';
    const authenticated = !!user && !!dbUser?.username;

    if (!authenticated) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (inAuth) router.replace('/(app)/(tabs)/dashboard');
  }, [user, dbUser, isLoading, fontsLoaded, segments]);
}
