import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AccessGate } from './components/AccessGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AccessGate>
    <App />
  </AccessGate>
);

// PWA: registra o service worker só no build de produção (no dev ele atrapalharia o HMR).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker não registrado:', err);
    });
  });
}
