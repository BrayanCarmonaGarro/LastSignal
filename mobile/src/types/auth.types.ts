export interface KeycloakTokens {
  accessToken:  string;
  refreshToken: string;
  idToken:      string;
}

export interface KeycloakUser {
  sub:                string;
  email:              string;
  name:               string;
  preferred_username: string;
  picture?:           string;
}
