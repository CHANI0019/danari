import { SolarSystemScene } from './scene.js';
import { UIManager } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-container');
  const scene = new SolarSystemScene(container);
  const ui = new UIManager(scene);

  // Global access for debugging / exploration
  window.DANARI_SCENE = scene;
  window.DANARI_UI = ui;

  console.log('🌌 DANARI UNIVERSE 3D initialized successfully.');
});
