import type { RouteObject } from 'react-router';
import { EditProfilePage } from './pages/EditProfilePage';
import { NewProfilePage } from './pages/NewProfilePage';
import { ProfileRolesPage } from './pages/ProfileRolesPage';

/**
 * Paths duplicados de `app/router/routes.ts` — ver nota en
 * `features/landing/routes.tsx`. Sin layout propio: se anidan bajo
 * `AppShell` en `app/router/index.tsx`.
 *
 * `/perfiles/:id/editar` (CM-61) se mudó aquí desde
 * `professionalProfileWizardRoutes`: el frame real de Figma en `lg` monta
 * el `nav-header` normal de la app (nodo `189:1114`, verificado en vivo,
 * CLAUDE.md §13) — `EditProfilePage` ya no envuelve `WizardLayout` (SPEC.md
 * §9, decisión D-E). `/perfiles/nuevo` (CM-46, PRT-02.02) se mudó aquí por
 * la misma razón: ninguna de las dos pantallas tiene stepper ni botón
 * primario de asistente, así que ninguna encaja en `WizardLayout`.
 */
export const professionalProfileShellRoutes: RouteObject[] = [
  { path: '/perfiles/nuevo', element: <NewProfilePage /> },
  { path: '/perfiles/:id/editar', element: <EditProfilePage /> },
  { path: '/perfiles/:id/roles', element: <ProfileRolesPage /> },
];
