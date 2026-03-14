import { useState, useEffect, useCallback } from 'react';

const CURRENT_VERSION = __APP_VERSION__;
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const VERSION_URL = '/version.json';

export default function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [notes, setNotes] = useState('');

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version && data.version !== CURRENT_VERSION) {
        setUpdateAvailable(true);
        setLatestVersion(data.version);
        setNotes(data.notes || '');
      }
    } catch {
      // Silent fail — network errors shouldn't bother users
    }
  }, []);

  useEffect(() => {
    // Initial check after 10s (give app time to load)
    const initialTimer = setTimeout(checkVersion, 10_000);
    // Then check every 5 minutes
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    // Also check when tab regains focus (user comes back)
    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkVersion]);

  const applyUpdate = useCallback(() => {
    // Tell service worker to clear cache and reload
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
    // Hard reload to get new assets
    setTimeout(() => window.location.reload(), 300);
  }, []);

  return { updateAvailable, latestVersion, currentVersion: CURRENT_VERSION, notes, applyUpdate };
}
