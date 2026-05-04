import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { TextInputField } from '@/components/ui/TextInputField';
import { useUsernameSetup } from '@/hooks/auth/useUsernameSetup';
import { makeStyles } from './UsernameSetupScreen.styles';

export function UsernameSetupScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { user } = useAuthStore();
  const {
    username,
    shipName,
    handleChangeUsername,
    handleChangeShipName,
    handleSubmit,
    isValid,
    loading,
    inputError,
  } = useUsernameSetup();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        <View style={styles.identity}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(user?.name ?? '?')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.name}>
            Hola, {user?.name?.split(' ')[0] ?? 'astronauta'}
          </Text>

          <Text style={styles.subtitle}>
            Elige cómo aparecer en la misión
          </Text>
        </View>

        <TextInputField
          label="Nombre de usuario"
          value={username}
          onChangeText={handleChangeUsername}
          onSubmitEditing={handleSubmit}
          placeholder="ej: nova_7"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          returnKeyType="next"
          error={inputError}
        />

        <View>
          <TextInputField
            label="Nombre de la base"
            value={shipName}
            onChangeText={handleChangeShipName}
            onSubmitEditing={handleSubmit}
            placeholder="ej: Base Sigma-7"
            autoCorrect={false}
            maxLength={120}
            returnKeyType="done"
          />
          <Text style={styles.subtitle}>
            Tu base se creará en tu ubicación actual
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !isValid}
          activeOpacity={0.85}
          style={isValid && !loading ? styles.buttonActive : styles.buttonDisabled}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.bgPrimary} />
          ) : (
            <Text style={isValid ? styles.buttonTextActive : styles.buttonTextDisabled}>
              Continuar
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}
