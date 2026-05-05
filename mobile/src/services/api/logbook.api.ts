// mobile/src/services/api/logbook.api.ts
import { apiRequest } from './client';

export interface CreateLogbookDTO {
  photo_url: string;
  description: string;
  classification: string;
  danger_level: string;
}

export const logbookApi = {
  create: (data: CreateLogbookDTO) =>
    apiRequest('/logbook', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};