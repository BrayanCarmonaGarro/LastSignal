// mobile/src/services/api/storage.api.ts
import { apiRequest } from './client';

export interface UploadResponse {
  url_acceso: string;
}

export const storageApi = {
  uploadImage: (base64: string, nombre = 'discovery.jpg'): Promise<UploadResponse> =>
    apiRequest<UploadResponse>('/storage/subir-imagen/', {
      method: 'POST',
      body: JSON.stringify({
        nombre_archivo: nombre,
        base64_str: base64,
      }),
    }),
};