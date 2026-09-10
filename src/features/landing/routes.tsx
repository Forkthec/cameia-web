import type { RouteObject } from 'react-router';
import { LandingPage } from './pages/LandingPage';

/**
 * Pública, sin AppShell: trae su propio chrome cuando exista el PRT-00.01 real.
 *
 * El path está duplicado a propósito respecto a `app/router/routes.ts`
 * (`ROUTES.landing`): `features` no puede importar `app`
 * (docs/ARCHITECTURE.md §4), mismo patrón ya usado en `layouts/AppShell.tsx`.
 */
export const landingRoutes: RouteObject[] = [{ path: '/', element: <LandingPage /> }];
