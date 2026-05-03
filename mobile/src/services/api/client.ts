// mobile/src/services/api/client.ts
// Cliente HTTP centralizado con refresh automático del access token
import { useAuthStore } from '@/store/authStore';

const BASE_URL   = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_PREFIX = '/api/v1';

// Mutex de refresh: evita que múltiples 401 simultáneos disparen varios refreshes
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function waitForRefresh(): Promise<string> {
  return new Promise((resolve) => {
    refreshQueue.push(resolve);
  });
}

function resolveQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

function rejectQueue() {
  refreshQueue.forEach((cb) => cb(''));
  refreshQueue = [];
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const doFetch = (accessToken: string | null) =>
    fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers as Record<string, string> | undefined ?? {}),
      },
    });

  let res = await doFetch(useAuthStore.getState().tokens?.accessToken ?? null);

  if (res.status === 401) {
    if (isRefreshing) {
      // Otro refresh en curso — esperar su resultado y reintentar
      const newToken = await waitForRefresh();
      if (!newToken) throw new Error('Sesión expirada');
      res = await doFetch(newToken);
    } else {
      isRefreshing = true;
      const ok = await useAuthStore.getState().refresh();
      isRefreshing = false;

      if (ok) {
        const newToken = useAuthStore.getState().tokens?.accessToken ?? '';
        resolveQueue(newToken);
        res = await doFetch(newToken);
      } else {
        // refresh() ya llamó clearSession() → _layout.tsx guard redirige a login
        rejectQueue();
        throw new Error('Sesión expirada');
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
