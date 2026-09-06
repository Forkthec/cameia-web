/**
 * Se carga antes de cada archivo de prueba (ver `test.setupFiles` en
 * vite.config.ts). Registra los matchers de jest-dom (`toBeInTheDocument`,
 * `toHaveAttribute`, etc.) para que estén disponibles sin importarlos en
 * cada test.
 */
import '@testing-library/jest-dom/vitest';
