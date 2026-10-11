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
import { Navigate, Outlet, useLocation, type Location } from 'react-router';
import { Spinner } from '@/design-system/atoms/Spinner';
import { useAuthStore } from '@/stores/auth.store';
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

interface RedirectLocationState {
  from?: Location;
}

/**
 * Cubre `/`, `/registro` e `/ingresar`: si ya hay sesión, no vuelve a mostrar
 * la landing ni el formulario, redirige directo a `/inicio`.
 *
 * Si la navegación trae `location.state.from` (lo pone `RequireAuth` al mandar
 * a `/ingresar`), redirige ahí: quien inicia sesión vuelve a la pantalla
 * privada que quería abrir (`features/auth/SPEC.md`, «Decisiones de CM-40»,
 * punto 1). `/` y `/registro` nunca reciben `from`, así que siguen yendo a
 * `/inicio`. Sin esto, `useLogin` marca la sesión antes de navegar y este
 * guard le ganaba, mandando siempre a `/inicio`.
 */
export function RedirectIfAuthenticated() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isLoading && isAuthenticated) {
    const from = (location.state as RedirectLocationState | null)?.from;
    const destination = from
      ? { pathname: from.pathname, search: from.search, hash: from.hash }
      : ROUTES.inicio;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
