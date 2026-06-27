import { useEffect, useState } from 'react';

/** Tracks browser online/offline state. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export type SyncStatus = 'off' | 'signedOut' | 'synced' | 'offline';

export function syncStatus(enabled: boolean, signedIn: boolean, online: boolean): SyncStatus {
  if (!enabled) return 'off';
  if (!signedIn) return 'signedOut';
  return online ? 'synced' : 'offline';
}

export const STATUS_LABEL: Record<SyncStatus, string> = {
  off: 'Not connected',
  signedOut: 'Sign in',
  synced: 'Synced',
  offline: 'Offline',
};
