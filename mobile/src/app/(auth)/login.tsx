import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useLogin } from '@/hooks/auth/useLogin';
import { UsernameSetupScreen } from '@/components/auth/UsernameSetupScreen';
import { makeStyles } from './login.styles';

export default function LoginScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { request, promptAsync, showUsernameSetup } = useLogin();

  if (showUsernameSetup) return <UsernameSetupScreen />;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>LAST SIGNAL</Text>
        <Text style={styles.subtitle}>Sistema de supervivencia — Misión activa</Text>
      </View>

      <TouchableOpacity
        disabled={!request}
        onPress={() => promptAsync()}
        activeOpacity={0.85}
        style={styles.loginButton}
      >
        {!request ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <>
            <Ionicons name="logo-google" size={22} color={theme.colors.textPrimary} />
            <Text style={styles.loginButtonText}>Continuar con Google</Text>
          </>
        )}
      </TouchableOpacity>

    </View>
  );
}
