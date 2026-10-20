/**
 * Paths duplicados de `app/router/routes.ts` — ver nota en
 * `features/landing/routes.tsx`. Cada página envuelve su propio layout (ver
 * `pages/`); este archivo solo mapea rutas.
 *
 * El asistente (`/entrenar/nueva`) se monta dentro de `AppShell`
 * (`interviewSetupShellRoutes`, CM-208): es una pantalla autenticada más y
 * lleva la misma navegación que el resto (NavHeader en escritorio, TabBar en
 * móvil, menú de usuario), mismo patrón que `professionalProfileShellRoutes`.
 * La pantalla de transición «iniciando» sigue fuera del shell: es un paso
 * hacia la sesión de entrevista, que tampoco lo lleva.
 */
import type { RouteObject } from 'react-router';
import { NewInterviewWizardPage } from './pages/NewInterviewWizardPage';
import { StartingSessionPage } from './pages/StartingSessionPage';

export const interviewSetupShellRoutes: RouteObject[] = [
  { path: '/entrenar/nueva', element: <NewInterviewWizardPage /> },
];

export const interviewSetupRoutes: RouteObject[] = [
  { path: '/entrenar/nueva/iniciando', element: <StartingSessionPage /> },
];
