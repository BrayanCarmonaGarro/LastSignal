// mobile/src/services/auth/keycloak.ts
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const KEYCLOAK_URL    = process.env.EXPO_PUBLIC_KEYCLOAK_URL!;
const KEYCLOAK_REALM  = process.env.EXPO_PUBLIC_KEYCLOAK_REALM!;
const CLIENT_ID       = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID!;

const BASE = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect`;

export const discovery = {
  authorizationEndpoint: `${BASE}/auth`,
  tokenEndpoint:         `${BASE}/token`,
  revocationEndpoint:    `${BASE}/revoke`,
  endSessionEndpoint:    `${BASE}/logout`,
};

export const authRequestConfig: AuthSession.AuthRequestConfig = {
  clientId:    CLIENT_ID,
  scopes:      ['openid', 'profile', 'email'],
  redirectUri: AuthSession.makeRedirectUri({ 
    scheme: 'lastsignal',
  }),
  extraParams: { kc_idp_hint: 'google' },
};

export interface KeycloakTokens {
  accessToken:  string;
  refreshToken: string;
  idToken:      string;
}

export interface KeycloakUser {
  sub:               string;
  email:             string;
  name:              string;
  preferred_username: string;
  picture?:          string;
}

export function parseJwt(token: string): KeycloakUser {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export async function refreshAccessToken(refreshToken: string): Promise<KeycloakTokens> {
  const res = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) throw new Error('Failed to refresh token');

  const data = await res.json();
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    idToken:      data.id_token,
  };
}