import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'public/index.html'
    },
    assetsInlineLimit: 0
  },
  server: {
    host: true,
    port: 5173
  }
});
