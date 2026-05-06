// mobile/src/store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { KeycloakUser, KeycloakTokens, parseJwt, refreshAccessToken } from '@/services/auth/keycloak';
import type { DbUserProfile } from '@/services/api/users.api';
import { useResourceStore } from '@/store/resourceStore';

const KEYS = {
  accessToken:  'ls_access_token',
  refreshToken: 'ls_refresh_token',
  idToken:      'ls_id_token',
};

interface AuthState {
  user:         KeycloakUser | null;
  dbUser:       DbUserProfile | null;
  tokens:       KeycloakTokens | null;
  isLoading:    boolean;
  setSession:   (tokens: KeycloakTokens) => Promise<void>;
  setDbUser:    (dbUser: DbUserProfile) => void;
  setLoading:   (loading: boolean) => void;
  clearSession: () => Promise<void>;
  loadSession:  () => Promise<void>;
  refresh:      () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  dbUser:    null,
  tokens:    null,
  isLoading: true,

  setSession: async (tokens) => {
    await SecureStore.setItemAsync(KEYS.accessToken,  tokens.accessToken);
    await SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken);
    await SecureStore.setItemAsync(KEYS.idToken,      tokens.idToken);
    const user = parseJwt(tokens.idToken);
    set({ user, tokens });
  },

  setDbUser:  (dbUser)   => set({ dbUser }),
  setLoading: (loading)  => set({ isLoading: loading }),

  clearSession: async () => {
    await SecureStore.deleteItemAsync(KEYS.accessToken);
    await SecureStore.deleteItemAsync(KEYS.refreshToken);
    await SecureStore.deleteItemAsync(KEYS.idToken);
    set({ user: null, dbUser: null, tokens: null });
  },

  loadSession: async () => {
    try {
      const accessToken  = await SecureStore.getItemAsync(KEYS.accessToken);
      const refreshToken = await SecureStore.getItemAsync(KEYS.refreshToken);
      const idToken      = await SecureStore.getItemAsync(KEYS.idToken);

      if (!accessToken || !refreshToken || !idToken) {
        set({ isLoading: false });
        return;
      }

      const user = parseJwt(idToken);
      set({ user, tokens: { accessToken, refreshToken, idToken } });

      const { usersApi } = await import('@/services/api/users.api');

      try {
        const dbUser = await usersApi.getMe();
        set({ dbUser, isLoading: false });
        useResourceStore.getState().fetchResources();
      } catch {
        const ok = await get().refresh();
        if (ok) {
          try {
            const dbUser = await usersApi.getMe();
            set({ dbUser, isLoading: false });
            useResourceStore.getState().fetchResources();
          } catch {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    try {
      const { tokens } = get();
      if (!tokens?.refreshToken) return false;
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      await get().setSession(newTokens);
      return true;
    } catch {
      await get().clearSession();
      return false;
    }
  },
}));
