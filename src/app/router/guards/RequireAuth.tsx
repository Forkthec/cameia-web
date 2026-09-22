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

/**
 * Exige que el correo de la sesión esté verificado (`CM-14`). Cubre todo lo
 * que cuelga de `RequireAuth` menos `/verificar-correo`, que es la pantalla a
 * la que redirige: bloquearla sería dejar a la persona sin salida.
 *
 * Es la traducción al frontend de una regla de negocio de `cameia-cuentas`
 * («una cuenta `PENDING_VERIFICATION` existe, pero el resto de la plataforma
 * no debe tratarla como utilizable», su spec §5), **no** un control de
 * seguridad: quien lo saltara en su propio navegador se encontraría con que
 * cada endpoint sigue exigiendo su ID Token y el backend sigue decidiendo por
 * el claim `email_verified`.
 */
export function RequireVerifiedEmail() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isEmailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);

  if (!isLoading && !isEmailVerified) {
    return <Navigate to={ROUTES.verificarCorreo} replace />;
  }

  return <Outlet />;
}

/**
 * Cubre `/`, `/registro` e `/ingresar`: si ya hay sesión, no vuelve a mostrar
 * la landing ni el formulario. El destino depende de si el correo está
 * verificado (`CM-14`): sin verificar no tiene sentido mandar a `/inicio`,
 * porque `RequireVerifiedEmail` rebotaría de inmediato.
 */
export function RedirectIfAuthenticated() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isEmailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={isEmailVerified ? ROUTES.inicio : ROUTES.verificarCorreo} replace />;
  }

  return <Outlet />;
}
