import { apiRequest } from './client';
import type {
  LogbookEntry,
  LogbookListParams,
  LogbookListResponse,
} from '@/types/logbook.types';

export interface CreateLogbookDTO {
  photo_url: string;
  description: string;
  classification: string;
  danger_level: string;
}

function buildQuery(params: LogbookListParams): string {
  const q = new URLSearchParams();
  if (params.page   != null) q.set('page',   String(params.page));
  if (params.limit  != null) q.set('limit',  String(params.limit));
  if (params.classification) q.set('classification', params.classification);
  if (params.danger)         q.set('danger',          params.danger);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const logbookApi = {
  getAll: (params: LogbookListParams = {}) =>
    apiRequest<LogbookListResponse>(`/logbook${buildQuery(params)}`),

  getById: (id: string) =>
    apiRequest<LogbookEntry>(`/logbook/${id}`),

  create: (data: CreateLogbookDTO) =>
    apiRequest<LogbookEntry>('/logbook', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  downloadEntry: (id: string) =>
    apiRequest<{ downloaded_until: string }>(`/logbook/${id}/download`, {
      method: 'POST',
    }),

  downloadAll: () =>
    apiRequest<{ downloaded_until: string }>('/logbook/download-all', {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiRequest<void>(`/logbook/${id}`, { method: 'DELETE' }),
};
