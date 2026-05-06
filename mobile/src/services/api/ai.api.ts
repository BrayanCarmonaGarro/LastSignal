import { apiRequest } from './client';

export interface AIResponse {
  description: string;
  classification: string;
  danger_level: string;
  confidence: number;
  reasoning: string;
}

export const aiApi = {
  analyzeImage: (photo_url: string): Promise<AIResponse> =>
    apiRequest<AIResponse>('/classification/classify', {
      method: 'POST',
      body: JSON.stringify({ photo_url }),
    }),
  generateAudio: async (text: string): Promise<any> => {
    return apiRequest<AIResponse>('/classification/generate-audio', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, true);
  },
};