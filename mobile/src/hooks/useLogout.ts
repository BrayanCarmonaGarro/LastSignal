import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTripStore } from '@/store/tripStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  const logout = async () => {
    const { setActiveTrip, setSupplyDrops, setWaypoints, setDangerZones, clearRoute, resetOxygen } =
      useTripStore.getState();

    // Limpiar estado en memoria
    setActiveTrip(null);
    setSupplyDrops([]);
    setWaypoints([]);
    setDangerZones([]);
    clearRoute();
    resetOxygen();

    // Limpiar AsyncStorage para que no rehidrate datos del usuario anterior
    await AsyncStorage.removeItem('last-signal-trip-store');

    await clearSession();
    router.replace('/(auth)/login');
  };

  return { logout };
}