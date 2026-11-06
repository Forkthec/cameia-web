/**
 * Envuelve `AppShell` para poder inyectarle `useLogout()` (`CM-194`,
 * `CA-1.8.1`) desde `app/router/index.tsx`. Existe porque `routeConfig` de
 * ese archivo es un array evaluado una sola vez al importar el módulo,
 * fuera de cualquier render de componente — no se puede llamar un hook de
 * React ahí. Vive en `app/router/`, hermano de `guards/`, con el mismo
 * criterio que ya usan `RequireAuth`/`RedirectIfAuthenticated`: un
 * componente usado como `element` de una ruta, no una función invocada a
 * mano.
 *
 * `AppShell` (capa `layouts`) no puede importar `features/auth` —
 * `boundaries/dependencies` no lo permite—, así que `onLogout`/
 * `isLoggingOut` son los únicos datos que cruzan esa frontera; todo lo
 * demás (avatar, idioma, copy de confirmación) lo resuelve `AppShell` por
 * su cuenta (ver su TSDoc de cabecera).
 */
import { useLogout } from '@/features/auth/hooks/useLogout';
import { AppShell } from '@/layouts/AppShell';

interface AuthenticatedAppShellProps {
  progressEnabled?: boolean;
}

export function AuthenticatedAppShell({ progressEnabled }: AuthenticatedAppShellProps) {
  const { logout, isLoggingOut } = useLogout();

  return (
    <AppShell
      progressEnabled={progressEnabled}
      onLogout={() => void logout()}
      isLoggingOut={isLoggingOut}
    />
  );
}
