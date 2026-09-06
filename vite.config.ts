/**
 * Configuración de Vite para cameia-web.
 *
 * Usa `defineConfig` de `vitest/config` (no de `vite`) para que el bloque
 * `test` de abajo quede tipado, sin depender de una referencia de tipos aparte.
 */
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind 4 se configura en CSS (@theme); no hay tailwind.config.js
    svgr(), // permite importar un *.svg como componente React
  ],
  resolve: {
    alias: {
      // Debe reflejar exactamente el alias "@/*" de tsconfig.app.json.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true, // permite usar describe/it/expect sin importarlos en cada archivo
    setupFiles: ['./src/test/setup.ts'],
    // Sin esto, "vitest run" termina con código de error cuando todavía no
    // existe ningún archivo de prueba (etapa inicial del proyecto).
    passWithNoTests: true,
  },
});
