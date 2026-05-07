// mobile/src/services/api/users.api.ts
import { apiRequest } from "./client";

export interface DbUserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  experience_pts: number;
  role: "ASTRONAUT" | "ADMIN";
  created_at: string;
}

export const usersApi = {
  getMe: (): Promise<DbUserProfile> => apiRequest<DbUserProfile>("/users/me"),

  setUsername: (username: string): Promise<DbUserProfile> =>
    apiRequest<DbUserProfile>("/users/me/username", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    }),

  addXp: (amount: number): Promise<void> =>
    apiRequest<void>("/users/me/xp", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
};
