import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/services/api/users.api';
import { shipBasesApi } from '@/services/api/shipBases.api';
import { USERNAME_PATTERN, USERNAME_MIN_LENGTH } from '@/constants/validation';

export function useUsernameSetup() {
  const { setDbUser } = useAuthStore();
  const router = useRouter();

  const [username, setUsername]       = useState('');
  const [shipName, setShipName]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const trimmedUsername = username.trim();
  const trimmedShipName = shipName.trim();

  const isUsernameValid =
    trimmedUsername.length >= USERNAME_MIN_LENGTH && USERNAME_PATTERN.test(trimmedUsername);
  const isShipNameValid = trimmedShipName.length >= 1;
  const isValid = isUsernameValid && isShipNameValid;

  const inputError = (() => {
    if (!trimmedUsername) return null;
    if (trimmedUsername.length < USERNAME_MIN_LENGTH) return `Mínimo ${USERNAME_MIN_LENGTH} caracteres`;
    if (!USERNAME_PATTERN.test(trimmedUsername)) return 'Solo letras, números y guiones bajos';
    return serverError;
  })();

  const handleChangeUsername = (text: string) => {
    setUsername(text);
    if (serverError) setServerError(null);
  };

  const handleChangeShipName = (text: string) => {
    setShipName(text);
    if (serverError) setServerError(null);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setServerError(null);

    try {
      let { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted' && canAskAgain) {
        ({ status, canAskAgain } = await Location.requestForegroundPermissionsAsync());
      }

      if (status !== 'granted') {
        if (!canAskAgain) {
          Alert.alert(
            'Ubicación bloqueada',
            'Necesitamos tu ubicación para registrar las coordenadas de tu base en el momento del registro.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir configuración', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert(
            'Permiso de ubicación requerido',
            'Necesitamos tu ubicación para registrar las coordenadas de tu base en el momento del registro. Por favor, acepta el permiso para continuar.',
            [{ text: 'Entendido' }],
          );
        }
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const updated = await usersApi.setUsername(trimmedUsername);

      try {
        await shipBasesApi.create(trimmedShipName, latitude, longitude);
      } catch {
        // Si la base ya existe (409) ignoramos — el username ya fue guardado
      }

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

  return {
    username,
    shipName,
    handleChangeUsername,
    handleChangeShipName,
    handleSubmit,
    isValid,
    loading,
    inputError,
  };
}
