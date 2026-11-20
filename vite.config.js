import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // GitHub Pages 배포 시 서브패스 호환을 위한 상대 경로
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});

