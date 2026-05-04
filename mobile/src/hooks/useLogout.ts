// mobile/src/hooks/useLogout.ts
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTripStore } from '@/store/tripStore';

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  const logout = async () => {
    // Limpia el trip store antes de cerrar sesión
    const { setActiveTrip, setSupplyDrops, setWaypoints, setDangerZones, clearRoute, resetOxygen } =
      useTripStore.getState();

    setActiveTrip(null);
    setSupplyDrops([]);
    setWaypoints([]);
    setDangerZones([]);
    clearRoute();
    resetOxygen();

    await clearSession();
    router.replace('/(auth)/login');
  };

  return { logout };
}