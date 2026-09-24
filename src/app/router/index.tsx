/**
 * Composición del árbol de rutas. Cada feature exporta su propio
 * `RouteObject[]` ya envuelto en el layout que le corresponde (`AuthLayout`,
 * `WizardLayout`, `SessionLayout` — ver cada `features/<x>/routes.tsx`); este
 * archivo solo decide qué grupo va detrás de qué guard y cuáles rutas se
 * anidan bajo `AppShell`.
 *
 * Nota sobre carga diferida: las páginas de hoy son un único `EmptyState`
 * (ninguna HU real entra todavía), así que dividirlas con `React.lazy()`
 * ahora no ahorra peso real. El punto natural para agregarlo es cuando cada
 * feature tenga contenido de verdad: cambiar `element: <Page/>` por
 * `lazy: () => import('./Page').then(m => ({ Component: m.Page }))` dentro
 * del propio `routes.tsx` de esa feature, sin tocar este archivo.
 */
import { createBrowserRouter, type RouteObject } from 'react-router';
import { featureFlags } from '@/config/features';
import { authRoutes } from '@/features/auth';
import { homeRoutes } from '@/features/home';
import { interviewSessionRoutes } from '@/features/interview-session';
import { interviewSetupRoutes } from '@/features/interview-setup';
import { landingRoutes } from '@/features/landing';
import { professionalProfileShellRoutes } from '@/features/professional-profile';
import { AuthenticatedAppShell } from './AuthenticatedAppShell';
import { NotFoundPage } from './NotFoundPage';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RedirectIfAuthenticated, RequireAuth } from './guards/RequireAuth';

// Exportado aparte de `router` para que las pruebas puedan montar el mismo
// árbol sobre `createMemoryRouter` en vez de depender del historial real del
// navegador que usa `createBrowserRouter` (ver `index.test.tsx`).
export const routeConfig: RouteObject[] = [
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <RedirectIfAuthenticated />,
        children: [...landingRoutes, ...authRoutes],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AuthenticatedAppShell progressEnabled={featureFlags.PROGRESS} />,
            children: [...homeRoutes, ...professionalProfileShellRoutes],
          },
          ...interviewSetupRoutes,
          ...interviewSessionRoutes,
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routeConfig);
