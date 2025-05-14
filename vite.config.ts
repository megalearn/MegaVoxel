import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'megavoxel.js',
        assetFileNames: 'megavoxel.[ext]'
      }
    }
  }
}); 