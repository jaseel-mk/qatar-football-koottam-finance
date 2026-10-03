import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'shared-finance-favicon',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => html.replace(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/png" href="../assets/brand/qfk-logo.png" />'),
    },
  }],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  optimizeDeps: { exclude: ['lucide-react'] },
  build: { outDir: '../matchday', emptyOutDir: false, assetsInlineLimit: 800000 },
});
