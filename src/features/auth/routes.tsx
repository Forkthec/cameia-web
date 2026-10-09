/**
 * Rutas públicas de autenticación. `LoginPage` y `RegisterPage` (CM-34)
 * componen cada una su propio `AuthLayout` — ninguna vive envuelta aquí.
 *
 * `VerifyEmailPage` (CM-180, HU-1.2) es pública y vive fuera de
 * `RedirectIfAuthenticated`: un usuario autenticado que abre el enlace de
 * verificación debe poder completar el flujo sin ser redirigido a `/inicio`.
 * Se exporta aparte en `verifyEmailRoutes` para montarla al nivel correcto
 * del árbol de rutas.
 */
import type { RouteObject } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export const authRoutes: RouteObject[] = [
  {
    path: ROUTES.registro,
    element: <RegisterPage />,
  },
  {
    path: ROUTES.ingresar,
    element: <LoginPage />,
  },
];

export const verifyEmailRoutes: RouteObject[] = [
  {
    path: ROUTES.verificarCorreo,
    element: <VerifyEmailPage />,
  },
];
