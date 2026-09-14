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
    react(), // habilita React (la librería con la que está hecha la interfaz)
    tailwindcss(), // Tailwind 4 se configura en CSS (@theme); no hay tailwind.config.js
    svgr(), // permite importar un *.svg como componente React
  ],
  resolve: {
    alias: {
      // "@/algo" en vez de una ruta larga con "../../../". Debe reflejar
      // exactamente el alias "@/*" de tsconfig.app.json.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom', // simula el DOM del navegador; los componentes no corren en Node puro
    globals: true, // permite usar describe/it/expect sin importarlos en cada archivo
    setupFiles: ['./src/test/setup.ts'], // matchers de jest-dom, mocks globales
    // Sin esto, "vitest run" termina con código de error cuando todavía no
    // existe ningún archivo de prueba (etapa inicial del proyecto).
    passWithNoTests: true,
    // Mide qué porcentaje del código quedó realmente ejecutado por las pruebas.
    coverage: {
      provider: 'v8', // ya viene con Node, no agrega instrumentación de Babel/Istanbul
      reporter: ['text', 'html', 'lcov'], // text: consola; html: local; lcov: artefacto CI
      // Umbral exigido por la guía DevOps del sprint (>70%). "test:coverage" falla
      // el proceso si cualquiera de estas métricas cae por debajo — es el mecanismo
      // real que hace del gate de CI un bloqueo, no solo un número informativo.
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
