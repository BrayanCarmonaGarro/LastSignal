// Pantalla de login Keycloak
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { discovery, authRequestConfig } from '@/services/auth/keycloak';

export default function LoginScreen() {
  const { colors, fonts, fontSizes, spacing, radii, shadows } = useTheme();
  const router     = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  console.log('Redirect URI:', AuthSession.makeRedirectUri({ scheme: 'lastsignal', path: 'auth' }));

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    authRequestConfig,
    discovery,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;

    const { code } = response.params;

    // Intercambiamos el code por tokens
    AuthSession.exchangeCodeAsync(
      {
        clientId:     authRequestConfig.clientId,
        code,
        redirectUri:  authRequestConfig.redirectUri,
        extraParams:  { code_verifier: request!.codeVerifier! },
      },
      discovery,
    )
      .then((tokenResponse) =>
        setSession({
          accessToken:  tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken!,
          idToken:      tokenResponse.idToken!,
        })
      )
      .then(() => router.replace('/(app)/(tabs)/dashboard'))
      .catch(console.error);
  }, [response]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, padding: spacing.xl }]}>

      <View style={styles.header}>
        <Text style={{
          fontFamily: fonts.display,
          fontSize:   fontSizes.display,
          color:      colors.primary,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          LAST SIGNAL
        </Text>
        <Text style={{
          fontFamily: fonts.body,
          fontSize:   fontSizes.body,
          color:      colors.textMuted,
          marginTop:  spacing.sm,
          textAlign:  'center',
        }}>
          Sistema de supervivencia — Misión activa
        </Text>
      </View>

      <TouchableOpacity
        disabled={!request}
        onPress={() => promptAsync()}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            backgroundColor: colors.bgTertiary,
            borderRadius:    radii.md,
            borderWidth:     1,
            borderColor:     colors.borderDefault,
            padding:         spacing.lg,
            ...shadows.md,
          },
        ]}
      >
        {!request ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Ionicons name="logo-google" size={22} color={colors.textPrimary} />
            <Text style={{
              fontFamily:  fonts.heading,
              fontSize:    fontSizes.body,
              color:       colors.textPrimary,
              marginLeft:  spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Continuar con Google
            </Text>
          </>
        )}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
  },
  button: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
});