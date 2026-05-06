import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useToast } from '@/context/ToastContext';
import { photoQueue } from '@/services/offline/queue';
import { offlineQueue } from '@/services/trip/offlineQueue';
import { useLogbookStore } from '@/store/logbookStore';

export function useOfflineSync() {
  const { isConnected } = useNetworkStatus();
  const { showToast } = useToast();
  const prevConnected = useRef<boolean | null>(null);

  useEffect(() => {
    const wasOffline = prevConnected.current === false;
    const nowOnline  = isConnected === true;

    if (wasOffline && nowOnline) {
      (async () => {
        try {
          const [synced] = await Promise.all([
            photoQueue.flush(),
            offlineQueue.flush(),
          ]);

          if (synced > 0) {
            useLogbookStore.getState().refresh();
            showToast(`${synced} foto${synced > 1 ? 's' : ''} sincronizada${synced > 1 ? 's' : ''}`, 'success');
          }
        } catch {
          showToast('Error al sincronizar. Intenta de nuevo.', 'error');
        }
      })();
    }

    prevConnected.current = isConnected;
  }, [isConnected]);
}
