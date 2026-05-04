// src/services/trip/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { tripService } from './tripService';

const QUEUE_KEY = 'last-signal-offline-queue';

type QueuedAction =
  | { id: string; type: 'complete_trip'; tripId: string; oxygenLevel: number; queuedAt: string; retries: number }
  | { id: string; type: 'collect_drop'; dropId: string; tripId: string; queuedAt: string; retries: number };

async function loadQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const offlineQueue = {
  enqueueComplete: async (tripId: string, oxygenLevel: number): Promise<void> => {
    const queue = await loadQueue();
    queue.push({
      id: `action_${Date.now()}`,
      type: 'complete_trip',
      tripId,
      oxygenLevel,
      queuedAt: new Date().toISOString(),
      retries: 0,
    });
    await saveQueue(queue);
  },

  enqueueCollect: async (dropId: string, tripId: string): Promise<void> => {
    const queue = await loadQueue();
    queue.push({
      id: `action_${Date.now()}`,
      type: 'collect_drop',
      dropId,
      tripId,
      queuedAt: new Date().toISOString(),
      retries: 0,
    });
    await saveQueue(queue);
  },

  flush: async (): Promise<void> => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    const queue = await loadQueue();
    if (queue.length === 0) return;

    const remaining: QueuedAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === 'complete_trip') {
          const oxygenConsumed = parseFloat((100 - action.oxygenLevel).toFixed(2));
          await tripService.updateOxygenConsumed(action.tripId, oxygenConsumed);
          await tripService.completeTrip(action.tripId);
        } else if (action.type === 'collect_drop') {
          await tripService.collectDrop(action.dropId, action.tripId);
        }
      } catch {
        if (action.retries < 3) {
          remaining.push({ ...action, retries: action.retries + 1 });
        }
      }
    }

    await saveQueue(remaining);
  },

  pendingCount: async (): Promise<number> => {
    const queue = await loadQueue();
    return queue.length;
  },

  clear: async () => AsyncStorage.removeItem(QUEUE_KEY),
};