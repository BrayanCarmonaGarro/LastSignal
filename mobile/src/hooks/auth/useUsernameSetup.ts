import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/services/api/users.api';
import { USERNAME_PATTERN, USERNAME_MIN_LENGTH } from '@/constants/validation';

export function useUsernameSetup() {
  const { setDbUser } = useAuthStore();
  const router = useRouter();

  const [username, setUsername]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const trimmed = username.trim();
  const isValid = trimmed.length >= USERNAME_MIN_LENGTH && USERNAME_PATTERN.test(trimmed);

  const inputError = (() => {
    if (!trimmed) return null;
    if (trimmed.length < USERNAME_MIN_LENGTH) return `Mínimo ${USERNAME_MIN_LENGTH} caracteres`;
    if (!USERNAME_PATTERN.test(trimmed)) return 'Solo letras, números y guiones bajos';
    return serverError;
  })();

  const handleChange = (text: string) => {
    setUsername(text);
    if (serverError) setServerError(null);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setServerError(null);
    try {
      const updated = await usersApi.setUsername(trimmed);
      setDbUser(updated);
      router.replace('/(app)/(tabs)/dashboard');
    } catch (e: any) {
      setServerError(
        e.message.includes('en uso')
          ? 'Ese nombre ya está ocupado, prueba otro'
          : 'No se pudo guardar, intenta de nuevo',
      );
    } finally {
      setLoading(false);
    }
  };

  return { username, handleChange, handleSubmit, isValid, loading, inputError };
}
