import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  const logout = async () => {
    await clearSession();
    router.replace('/(auth)/login');
  };

  return { logout };
}