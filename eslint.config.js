/**
 * Configuración de ESLint (flat config) para cameia-web.
 *
 * La pieza más particular es `eslint-plugin-boundaries`: hace cumplir en el
 * linter la matriz de capas de docs/ARCHITECTURE.md §4. Sin esto la
 * estructura de carpetas del proyecto es solo una convención de buena fe que
 * cualquier import puede romper sin que nadie se entere hasta revisión.
 */
import js from '@eslint/js';
import queryPlugin from '@tanstack/eslint-plugin-query';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Capas de docs/ARCHITECTURE.md §4. Solo estas seis se restringen con
// boundaries/dependencies (mocks se sumó para las pruebas de humo de la
// capa de mocks); el resto se registra únicamente como destino válido de
// import (utils, lib, i18n, hooks, stores, config, ...).
// Los patrones usan "**" porque los archivos reales viven anidados
// (p. ej. src/design-system/atoms/Button.tsx), no como hijos directos.
//
// "app-routes" es un carve-out puntual, NO documentado todavía en
// docs/ARCHITECTURE.md §4 (se reporta en el PR de CM-46; decidir aparte si
// la matriz documentada se actualiza). Aísla únicamente
// src/app/router/routes.ts —un módulo hoja sin imports propios, ver su
// TSDoc: "Nadie escribe un string de ruta a mano fuera de este archivo"
// (acuerdo con DevOps del 4-sep-2026)— para que `features` y `layouts`
// puedan importar el catálogo de rutas sin ganar acceso al resto de `app`
// (arranque, providers, router, guards). `mode: 'file'` (deprecated pero
// vigente en @boundaries/elements@3.1.1, la librería que usa esta versión
// del plugin) es obligatorio aquí: el modo por defecto ('folder') solo
// clasifica carpetas —añade "**/*" al patrón—, así que sin esto este
// descriptor jamás matchearía un archivo suelto y "routes.ts" seguiría
// cayendo en "app" (verificado con eslint --stdin antes de fijar esto).
// Va ANTES que "app" en este arreglo por claridad de lectura, aunque con
// mode: 'file' el orden no determina la clasificación (a diferencia de
// mode: 'folder').
const boundariesElements = [
  { type: 'app-routes', mode: 'file', pattern: 'src/app/router/routes.ts' },
  { type: 'app', pattern: 'src/app/**' },
  { type: 'design-system', pattern: 'src/design-system/**' },
  { type: 'layouts', pattern: 'src/layouts/**' },
  { type: 'features', pattern: 'src/features/*/**', capture: ['feature'] },
  { type: 'services', pattern: 'src/services/**' },
  { type: 'stores', pattern: 'src/stores/**' },
  { type: 'hooks', pattern: 'src/hooks/**' },
  { type: 'lib', pattern: 'src/lib/**' },
  { type: 'utils', pattern: 'src/utils/**' },
  { type: 'i18n', pattern: 'src/i18n/**' },
  { type: 'config', pattern: 'src/config/**' },
  { type: 'types', pattern: 'src/types/**' },
  { type: 'styles', pattern: 'src/styles/**' },
  { type: 'mocks', pattern: 'src/mocks/**' },
];

export default tseslint.config(
  // "docs/_plantilla-feature/**": tiene routes.tsx e index.ts de EJEMPLO (solo
  // comentario, sin código funcional) para copiar al crear una feature. No
  // pertenecen a ningún tsconfig (tsconfig.app.json solo incluye "src"), así
  // que el "project service" de typescript-eslint no les encuentra programa.
  // El patrón es la ruta completa desde la raíz: no existe ningún "docs" ni
  // "_plantilla-feature" dentro de src/, así que no oculta nada real.
  { ignores: ['dist', 'coverage', 'docs/_plantilla-feature/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    // Este propio archivo (.js) y los scripts de scripts/ (.mjs) no
    // pertenecen a ningún tsconfig del proyecto: sin esto, projectService
    // fallaría al buscarles un programa de TS (mismo motivo por el que
    // docs/_plantilla-feature/**, más abajo, va en "ignores" en vez de aquí
    // — ahí no hay ningún código real que valga la pena lintear).
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      // "**/*.{ts,tsx}" (más abajo) declara globals.browser; estos archivos
      // corren en Node (eslint.config.js, scripts/), no en el navegador.
      globals: globals.node,
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      'boundaries/elements': boundariesElements,
      // Necesario para que boundaries resuelva imports con el alias "@/*", no solo relativos.
      // Sin esto los ve como paquete externo no resuelto y la regla nunca los evalúa.
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,

      // Regla dura de CLAUDE.md §3.3: nadie importa lucide-react salvo el registry de iconos.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message:
                'No importes lucide-react directamente. Usa <Icon name="..." /> desde design-system/icons.',
            },
          ],
        },
      ],

      // Matriz de docs/ARCHITECTURE.md §4 — API v7 del plugin (boundaries/dependencies + policies).
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'design-system' } },
              allow: {
                to: [
                  { element: { type: 'design-system' } },
                  { element: { type: 'utils' } },
                  { element: { type: 'lib' } },
                  { element: { type: 'i18n' } },
                ],
              },
            },
            {
              from: { element: { type: 'layouts' } },
              allow: {
                to: [
                  { element: { type: 'layouts' } },
                  { element: { type: 'design-system' } },
                  { element: { type: 'hooks' } },
                  { element: { type: 'stores' } },
                  { element: { type: 'i18n' } },
                  { element: { type: 'utils' } },
                  // Carve-out CM-46: ver el comentario de "app-routes" arriba.
                  // AppShell enlaza su wordmark a ROUTES.inicio.
                  { element: { type: 'app-routes' } },
                ],
              },
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: [
                  { element: { type: 'design-system' } },
                  { element: { type: 'layouts' } },
                  { element: { type: 'services' } },
                  { element: { type: 'stores' } },
                  { element: { type: 'hooks' } },
                  { element: { type: 'lib' } },
                  { element: { type: 'utils' } },
                  { element: { type: 'i18n' } },
                  { element: { type: 'config' } },
                  // Carve-out CM-46: ver el comentario de "app-routes" arriba.
                  { element: { type: 'app-routes' } },
                  {
                    element: {
                      type: 'features',
                      captured: { feature: '{{ from.element.captured.feature }}' },
                    },
                  },
                ],
              },
            },
            {
              from: { element: { type: 'services' } },
              allow: {
                to: [
                  { element: { type: 'services' } },
                  { element: { type: 'config' } },
                  { element: { type: 'lib' } },
                  { element: { type: 'utils' } },
                ],
              },
            },
            {
              // "mocks" es la única capa nueva desde ADR-0001: sin esta
              // política, default: 'disallow' la deja ciega incluso a
              // "services" (mismo tropiezo que documenta el ADR con
              // "hooks → config"). La necesita la prueba de humo de
              // profiles.handlers.ts, que usa httpClient/ApiError reales.
              from: { element: { type: 'mocks' } },
              allow: {
                to: [{ element: { type: 'mocks' } }, { element: { type: 'services' } }],
              },
            },
            {
              // "app" es la capa de arranque/cableado global: puede importar
              // de cualquier otra (CLAUDE.md §4).
              from: { element: { type: 'app' } },
              allow: {
                to: { element: { type: '*' } },
              },
            },
          ],
        },
      ],
    },
  },

  jsxA11y.flatConfigs.recommended,
  ...queryPlugin.configs['flat/recommended'],

  {
    // Única excepción a no-restricted-imports: el punto de entrada de iconos.
    files: ['src/design-system/icons/registry.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
