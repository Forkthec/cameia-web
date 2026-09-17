/**
 * Sin esta referencia, TypeScript no reconoce `import.meta.env` (las
 * variables de entorno de Vite) ni los imports especiales de Vite
 * (`?url`, `?raw`, `*.svg`, etc.).
 */
/// <reference types="vite/client" />
/**
 * Tipa `import Algo from './archivo.svg?react'` como componente de React
 * (`vite-plugin-svgr`, ya habilitado en `vite.config.ts`). Sin esta
 * referencia, ese import se sigue viendo como `string` (la URL que da
 * `vite/client` para un `*.svg` normal).
 */
/// <reference types="vite-plugin-svgr/client" />
