import { apiRequest } from './client';

export interface ShipBase {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export const shipBasesApi = {
  create: (name: string, latitude: number, longitude: number): Promise<ShipBase> =>
    apiRequest<ShipBase>('/ship-bases', {
      method: 'POST',
      body: JSON.stringify({ name, latitude, longitude }),
    }),

  getMe: (): Promise<ShipBase> =>
    apiRequest<ShipBase>('/ship-bases/me'),
};
