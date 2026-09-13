import type { RouteObject } from 'react-router';
import { EditProfilePage } from './pages/EditProfilePage';
import { NewProfilePage } from './pages/NewProfilePage';
import { ProfileRolesPage } from './pages/ProfileRolesPage';

/**
 * Paths duplicados de `app/router/routes.ts` — ver nota en
 * `features/landing/routes.tsx`. `EditProfilePage` envuelve su propio
 * `WizardLayout` (ver `pages/`); este archivo solo mapea rutas.
 */
export const professionalProfileWizardRoutes: RouteObject[] = [
  { path: '/perfiles/:id/editar', element: <EditProfilePage /> },
];

/**
 * Sin layout propio: se anidan bajo `AppShell` en `app/router/index.tsx`.
 * `/perfiles/nuevo` (CM-46, PRT-02.02) se mudó aquí desde
 * `professionalProfileWizardRoutes`: la pantalla de selección de método no
 * tiene stepper ni botón primario, así que no encaja en `WizardLayout`; el
 * frame de Figma (nav-header lg / tab-bar sm) sí coincide con `AppShell`.
 */
export const professionalProfileShellRoutes: RouteObject[] = [
  { path: '/perfiles/nuevo', element: <NewProfilePage /> },
  { path: '/perfiles/:id/roles', element: <ProfileRolesPage /> },
];
