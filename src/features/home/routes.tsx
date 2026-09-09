import type { RouteObject } from 'react-router';
import { HomePage } from './pages/HomePage';

/**
 * Sin layout propio: se anida bajo `AppShell` en `app/router/index.tsx`.
 * Path duplicado de `app/router/routes.ts` — ver nota en `features/landing/routes.tsx`.
 */
export const homeRoutes: RouteObject[] = [{ path: '/inicio', element: <HomePage /> }];
