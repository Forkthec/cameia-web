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

// Capas de docs/ARCHITECTURE.md §4. Solo estas cinco se restringen con
// boundaries/dependencies; el resto se registra únicamente como destino
// válido de import (utils, lib, i18n, hooks, stores, config, ...).
// Los patrones usan "**" porque los archivos reales viven anidados
// (p. ej. src/design-system/atoms/Button.tsx), no como hijos directos.
const boundariesElements = [
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
  { ignores: ['dist', 'coverage'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    // Este propio archivo (.js) no pertenece a ningún tsconfig del proyecto:
    // sin esto, projectService fallaría al buscarle un programa de TS.
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
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
