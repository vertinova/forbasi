import { useState, useEffect } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
      background: '#1d3557', color: '#fff', padding: '12px 20px', borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999, maxWidth: '90vw'
    }}>
      <span style={{ fontSize: '0.9rem' }}>Install aplikasi FORBASI?</span>
      <button onClick={handleInstall} style={{
        background: '#0d9500', color: '#fff', border: 'none', padding: '8px 16px',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap'
      }}>Install</button>
      <button onClick={() => setShowPrompt(false)} style={{
        background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '1.2rem'
      }}>&times;</button>
    </div>
  );
}
