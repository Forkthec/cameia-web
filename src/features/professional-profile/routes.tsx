import type { RouteObject } from 'react-router';
import { EditProfilePage } from './pages/EditProfilePage';
import { NewProfilePage } from './pages/NewProfilePage';
import { ProfileRolesPage } from './pages/ProfileRolesPage';

/**
 * Paths duplicados de `app/router/routes.ts` — ver nota en
 * `features/landing/routes.tsx`. Cada página envuelve su propio `WizardLayout`
 * (ver `pages/`); este archivo solo mapea rutas.
 */
export const professionalProfileWizardRoutes: RouteObject[] = [
  { path: '/perfiles/nuevo', element: <NewProfilePage /> },
  { path: '/perfiles/:id/editar', element: <EditProfilePage /> },
];

/** Sin layout propio: se anida bajo `AppShell` en `app/router/index.tsx`. */
export const professionalProfileShellRoutes: RouteObject[] = [
  { path: '/perfiles/:id/roles', element: <ProfileRolesPage /> },
];
