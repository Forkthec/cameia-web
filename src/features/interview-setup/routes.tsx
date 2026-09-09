import type { RouteObject } from 'react-router';
import { NewInterviewWizardPage } from './pages/NewInterviewWizardPage';
import { StartingSessionPage } from './pages/StartingSessionPage';

/**
 * Paths duplicados de `app/router/routes.ts` — ver nota en
 * `features/landing/routes.tsx`. Cada página envuelve su propio layout (ver
 * `pages/`); este archivo solo mapea rutas.
 */
export const interviewSetupRoutes: RouteObject[] = [
  { path: '/entrenar/nueva', element: <NewInterviewWizardPage /> },
  { path: '/entrenar/nueva/iniciando', element: <StartingSessionPage /> },
];
