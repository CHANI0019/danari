import { SolarSystemScene } from './scene.js';
import { UIManager } from './ui.js';

let deferredInstallPrompt = null;

function setupPWA() {
  // 1. Register Service Worker for offline & installable PWA support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then(() => console.log('🚀 PWA Service Worker registered.'))
        .catch((err) => console.warn('Service Worker registration skipped:', err));
    });
  }

  // 2. Handle install prompt button
  const installBtn = document.getElementById('btn-install-pwa');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.style.display = 'none';
      }
      deferredInstallPrompt = null;
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    deferredInstallPrompt = null;
  });
}

function bootstrap() {
  const container = document.getElementById('webgl-container');
  if (!container) return;

  try {
    const scene = new SolarSystemScene(container);
    const ui = new UIManager(scene);

    window.DANARI_SCENE = scene;
    window.DANARI_UI = ui;

    setupPWA();
    console.log('🌌 DANARI UNIVERSE 3D initialized successfully.');
  } catch (err) {
    console.error('DANARI UNIVERSE initialization failed:', err);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
