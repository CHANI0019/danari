import { SolarSystemScene } from './scene.js';
import { UIManager } from './ui.js';

function bootstrap() {
  const container = document.getElementById('webgl-container');
  if (!container) return;

  try {
    const scene = new SolarSystemScene(container);
    const ui = new UIManager(scene);

    // Global access for debugging / exploration
    window.DANARI_SCENE = scene;
    window.DANARI_UI = ui;

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
