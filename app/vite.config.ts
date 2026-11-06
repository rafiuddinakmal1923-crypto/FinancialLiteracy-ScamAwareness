import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { celikContent } from './vite-plugins/ink';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    celikContent(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2,json,png,ogg,mp3}'] },
      manifest: {
        name: 'Celik',
        short_name: 'Celik',
        lang: 'ms',
        theme_color: '#2D2A6E',
        background_color: '#FFF8EE',
        display: 'standalone',
      },
    }),
  ],
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'vite-plugins/**/*.test.ts'],
    passWithNoTests: true,
  },
});
