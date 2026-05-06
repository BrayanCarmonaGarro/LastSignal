import { create } from 'zustand';
import { readStorage, writeStorage, removeStorage } from '@/utils/storage';
import { storageApi } from '@/services/api/storage.api';
import { aiApi } from '@/services/api/ai.api';
import { logbookApi } from '@/services/api/logbook.api';

const QUEUE_KEY = 'last-signal-photo-queue';

export type PhotoStatus = 'pending' | 'uploading' | 'analyzing' | 'saving' | 'done' | 'error';

export type PendingPhoto = {
  id: string;
  photoUri: string;
  base64: string;
  queuedAt: string;
  retries: number;
  status: PhotoStatus;
  errorMessage?: string;
};

// Reactive store — the panel subscribes to this for live updates
export const usePhotoQueueStore = create<{ items: PendingPhoto[] }>(() => ({ items: [] }));

const getItems = () => usePhotoQueueStore.getState().items;
const setItems = (items: PendingPhoto[]) => usePhotoQueueStore.setState({ items });
const patchItem = (id: string, patch: Partial<PendingPhoto>) =>
  setItems(getItems().map(i => (i.id === id ? { ...i, ...patch } : i)));

// Persist only non-done items, always reset status to 'pending' on write
const persist = (items: PendingPhoto[]) =>
  writeStorage(QUEUE_KEY, items.filter(i => i.status !== 'done').map(i => ({ ...i, status: 'pending' as PhotoStatus })));

export const photoQueue = {
  // Call once on app start to hydrate the store from AsyncStorage
  load: async (): Promise<void> => {
    const stored = (await readStorage<PendingPhoto[]>(QUEUE_KEY)) ?? [];
    setItems(stored.map(i => ({ ...i, status: 'pending' as PhotoStatus })));
  },

  enqueue: async (photoUri: string, base64: string): Promise<void> => {
    const item: PendingPhoto = {
      id: `photo_${Date.now()}`,
      photoUri,
      base64,
      queuedAt: new Date().toISOString(),
      retries: 0,
      status: 'pending',
    };
    const items = [...getItems(), item];
    setItems(items);
    await persist(items);
  },

  getPending: (): PendingPhoto[] => getItems(),
  pendingCount: (): number => getItems().filter(i => i.status !== 'done').length,

  flush: async (onProgress?: (done: number, total: number) => void): Promise<number> => {
    // Snapshot pending items; skip any already in-flight to prevent concurrent flush calls
    // from processing the same item twice.
    const pending = getItems().filter(i => i.status === 'pending' || i.status === 'error');
    if (pending.length === 0) return 0;

    let synced = 0;
    const total = pending.length;

    for (const item of pending) {
      // Re-read current retries from store (not from the snapshot) to avoid stale counts
      // if flush() is called again before this loop finishes.
      const currentRetries = getItems().find(i => i.id === item.id)?.retries ?? item.retries;

      try {
        patchItem(item.id, { status: 'uploading' });
        const upload = await storageApi.uploadImage(item.base64);

        patchItem(item.id, { status: 'analyzing' });
        const aiData = await aiApi.analyzeImage(upload.url_acceso);

        patchItem(item.id, { status: 'saving' });
        await logbookApi.create({
          photo_url:      upload.url_acceso,
          description:    aiData.description    || 'Sin descripción',
          classification: aiData.classification || 'UNKNOWN_ORGANISM',
          danger_level:   aiData.danger_level   || 'UNKNOWN',
        });

        patchItem(item.id, { status: 'done' });
        synced++;
        onProgress?.(synced, total);
      } catch (e: unknown) {
        const errorMessage = (e instanceof Error && e.message) ? e.message : 'Error desconocido';
        if (currentRetries < 3) {
          patchItem(item.id, { status: 'error', errorMessage, retries: currentRetries + 1 });
        } else {
          setItems(getItems().filter(i => i.id !== item.id));
        }
      }
    }

    await persist(getItems());

    // Remove done items from memory after a brief delay so the panel can show the checkmark
    setTimeout(() => setItems(getItems().filter(i => i.status !== 'done')), 2000);

    return synced;
  },

  retry: (id: string): void => patchItem(id, { status: 'pending', errorMessage: undefined }),

  clear: async (): Promise<void> => {
    setItems([]);
    await removeStorage(QUEUE_KEY);
  },
};
