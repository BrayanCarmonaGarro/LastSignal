import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useResourceStore } from '@/store/resourceStore';
import { usersApi } from '@/services/api/users.api';
import { USERNAME_PATTERN, USERNAME_MIN_LENGTH } from '@/constants/validation';
import { CATEGORY_ORDER, ResourceCategory } from '@/types/resource.types';

const STALE_THRESHOLD_MS = 60_000;

export function useDashboard() {
  const router = useRouter();

  const { data, isLoading, isRefreshing, error, fetch, refresh: refreshDashboard, lastFetchedAt, clear: clearDashboard } =
    useDashboardStore();
  const { fetchResources } = useResourceStore();
  const { clearSession } = useAuthStore();

  const refresh = useCallback(async () => {
    await Promise.all([refreshDashboard(), fetchResources()]);
  }, [refreshDashboard, fetchResources]);

  const [profileVisible, setProfileVisible] = useState(false);
  const [profileView, setProfileView]       = useState<'menu' | 'edit'>('menu');
  const [editUsername, setEditUsername]     = useState('');
  const [editError, setEditError]           = useState<string | null>(null);
  const [editLoading, setEditLoading]       = useState(false);

  useFocusEffect(
    useCallback(() => {
      const stale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_THRESHOLD_MS;
      if (stale && !isLoading) fetch();
    }, [lastFetchedAt, isLoading, fetch]),
  );

  const openProfile = () => {
    setProfileView('menu');
    setEditUsername('');
    setEditError(null);
    setProfileVisible(true);
  };

  const confirmLogout = async () => {
    setProfileVisible(false);
    await clearSession();
    clearDashboard();
  };

  const trimmedEdit = editUsername.trim();
  const editIsValid =
    trimmedEdit.length >= USERNAME_MIN_LENGTH && USERNAME_PATTERN.test(trimmedEdit);

  const editInputError = (() => {
    if (!trimmedEdit) return null;
    if (trimmedEdit.length < USERNAME_MIN_LENGTH) return `Mínimo ${USERNAME_MIN_LENGTH} caracteres`;
    if (!USERNAME_PATTERN.test(trimmedEdit)) return 'Solo letras, números y guiones bajos';
    return editError;
  })();

  const submitUsername = async () => {
    if (!editIsValid || editLoading) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await usersApi.setUsername(trimmedEdit);
      await fetch();
      setProfileVisible(false);
    } catch (e: unknown) {
      const msg = (e as Error).message ?? '';
      setEditError(
        msg.includes('en uso') ? 'Ese nombre de usuario ya está ocupado' : 'No se pudo guardar',
      );
    } finally {
      setEditLoading(false);
    }
  };

  const criticalCount = data?.critical_resources_below_threshold ?? 0;

  const criticalResources = (data?.resource_groups ?? []).flatMap((g) =>
    g.resources.filter((r) => r.current_amount <= r.min_threshold),
  );

  const orderedGroups = [...(data?.resource_groups ?? [])].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category as ResourceCategory) -
      CATEGORY_ORDER.indexOf(b.category as ResourceCategory),
  );

  return {
    router,
    data,
    isLoading,
    isRefreshing,
    error,
    fetch,
    refresh,
    criticalCount,
    criticalResources,
    orderedGroups,
    profileVisible,
    profileView,
    editUsername,
    editError,
    editLoading,
    editIsValid,
    editInputError,
    openProfile,
    confirmLogout,
    submitUsername,
    setProfileVisible,
    setProfileView,
    setEditUsername: (t: string) => { setEditUsername(t); setEditError(null); },
  };
}
