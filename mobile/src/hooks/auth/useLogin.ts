import { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { discovery, authRequestConfig } from '@/services/auth/keycloak';
import { usersApi } from '@/services/api/users.api';

export function useLogin() {
  const { user, dbUser, setSession, setDbUser, setLoading } = useAuthStore();
  const router = useRouter();
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    authRequestConfig,
    discovery,
  );

  useEffect(() => {
    if (user && dbUser !== null && !dbUser.username) {
      setShowUsernameSetup(true);
    }
  }, [user, dbUser]);

  useEffect(() => {
    if (response?.type !== 'success') return;

    const { code } = response.params;
    setLoading(true);

    AuthSession.exchangeCodeAsync(
      {
        clientId:    authRequestConfig.clientId,
        code,
        redirectUri: authRequestConfig.redirectUri,
        extraParams: { code_verifier: request!.codeVerifier! },
      },
      discovery,
    )
      .then((tokenResponse) =>
        setSession({
          accessToken:  tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken!,
          idToken:      tokenResponse.idToken!,
        }),
      )
      .then(async () => {
        const fetched = await usersApi.getMe();
        setDbUser(fetched);
        setLoading(false);
        if (fetched.username) {
          router.replace('/(app)/(tabs)/dashboard');
        } else {
          setShowUsernameSetup(true);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  }, [response]);

  return { request, promptAsync, showUsernameSetup };
}
