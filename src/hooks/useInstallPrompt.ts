import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode =
  | 'installed' // já está rodando como app instalado
  | 'prompt' // Chrome/Edge/Android: dá para abrir o diálogo de instalação
  | 'ios' // Safari no iPhone/iPad: só pelo menu Compartilhar
  | 'unavailable'; // navegador sem suporte ou já instalado fora do app

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

// O evento pode disparar antes do React montar; guardamos aqui para não perdê-lo.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

function currentMode(): InstallMode {
  if (isStandalone()) return 'installed';
  if (deferredPrompt) return 'prompt';
  if (isIOS()) return 'ios';
  return 'unavailable';
}

export function useInstallPrompt() {
  const [mode, setMode] = useState<InstallMode>(() => currentMode());

  useEffect(() => {
    const update = () => setMode(currentMode());
    listeners.add(update);
    window.addEventListener('appinstalled', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('appinstalled', update);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    const evt = deferredPrompt;
    deferredPrompt = null;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setMode(currentMode());
    return outcome === 'accepted';
  }, []);

  return { mode, install };
}
