/**
 * Guards de sesión, aplicados como layout-route en `app/router/index.tsx`
 * (no como wrapper por ruta): cada uno es un elemento con `<Outlet/>` cuando
 * la condición se cumple, o una redirección cuando no.
 *
 * `RequireCompletedProfile` (HU-2.1 · Sprint 2) y `RequirePlan`
 * (HE-06/07/08 · posterior) todavía no existen — se agregan cuando su HU
 * entre al sprint, no antes (CLAUDE.md §4).
 */
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/design-system/atoms/Spinner';
import { useAuthStore } from '@/stores';
import { ROUTES } from '../routes';

/**
 * Protege las rutas autenticadas. Redirige a `/ingresar` preservando el
 * destino en `location.state.from`, para que el login pueda volver ahí.
 */
export function RequireAuth() {
  const { t } = useTranslation('common');
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={32} label={t('estados.cargando')} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ingresar} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * Cubre `/`, `/registro` e `/ingresar`: si ya hay sesión, no vuelve a mostrar
 * la landing ni el formulario, redirige directo a `/inicio`.
 */
export function RedirectIfAuthenticated() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={ROUTES.inicio} replace />;
  }

  return <Outlet />;
}
