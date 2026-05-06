import { readStorage, writeStorage, removeStorage } from '@/utils/storage';
import { storageApi } from '@/services/api/storage.api';
import { aiApi } from '@/services/api/ai.api';
import { logbookApi } from '@/services/api/logbook.api';

const QUEUE_KEY = 'last-signal-photo-queue';

export type PendingPhoto = {
  id: string;
  photoUri: string;
  base64: string;
  queuedAt: string;
  retries: number;
};

const load = async (): Promise<PendingPhoto[]> => (await readStorage<PendingPhoto[]>(QUEUE_KEY)) ?? [];
const save = (queue: PendingPhoto[]) => writeStorage(QUEUE_KEY, queue);

export const photoQueue = {
  enqueue: async (photoUri: string, base64: string): Promise<void> => {
    const queue = await load();
    queue.push({
      id: `photo_${Date.now()}`,
      photoUri,
      base64,
      queuedAt: new Date().toISOString(),
      retries: 0,
    });
    await save(queue);
  },

  getPending: (): Promise<PendingPhoto[]> => load(),

  pendingCount: async (): Promise<number> => {
    const queue = await load();
    return queue.length;
  },

  flush: async (onProgress?: (done: number, total: number) => void): Promise<number> => {
    const queue = await load();
    if (queue.length === 0) return 0;

    const remaining: PendingPhoto[] = [];
    let synced = 0;
    const total = queue.length;

    for (const item of queue) {
      try {
        const upload = await storageApi.uploadImage(item.base64);
        const aiData = await aiApi.analyzeImage(upload.url_acceso);
        await logbookApi.create({
          photo_url:      upload.url_acceso,
          description:    aiData.description    || 'Sin descripción',
          classification: aiData.classification || 'UNKNOWN_ORGANISM',
          danger_level:   aiData.danger_level   || 'UNKNOWN',
        });
        synced++;
        onProgress?.(synced, total);
      } catch {
        if (item.retries < 3) {
          remaining.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    await save(remaining);
    return synced;
  },

  clear: (): Promise<void> => removeStorage(QUEUE_KEY),
};
