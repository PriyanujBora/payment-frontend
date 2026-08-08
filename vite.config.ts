import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite'
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    allowedHosts: true
  }
});
