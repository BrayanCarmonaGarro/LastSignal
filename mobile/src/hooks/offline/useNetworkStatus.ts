import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;

      setIsConnected((prev) => {
        if (prev === true && !connected) setWasOffline(true);
        if (prev === false && connected) setTimeout(() => setWasOffline(false), 3000);
        return connected;
      });
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, wasOffline };
}