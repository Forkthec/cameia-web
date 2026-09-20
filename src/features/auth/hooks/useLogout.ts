/**
 * Orquesta el cierre de sesión (`CM-194`, `CA-1.8.1`), simétrico a
 * `useLogin.ts`: llama a `signOut()`, limpia `useAuthStore` de forma
 * explícita —sin esperar al listener asíncrono de `AuthProvider`, mismo
 * criterio de determinismo que ya usa `useLogin` en sentido inverso— y
 * navega a `/ingresar`.
 *
 * Si `signOut()` falla (raro: problema interno del SDK), el cierre local
 * ocurre igual — por alcance, `CA-1.8.1` es local a este dispositivo (ver
 * `SPEC.md` §3 "Seguridad"); no tiene sentido dejar a alguien atrapado en
 * una pantalla autenticada porque falló la llamada remota. Se navega con
 * `location.state.logoutError` para que `LoginPage` muestre el aviso
 * (`AlertInline variant="error"`, el mismo mecanismo que ya usa esa página
 * para `registerInfo` — `Toast` no tiene infraestructura en la app,
 * decisión explícita del usuario en vez de construirla en esta iteración).
 *
 * No decide el copy de la confirmación previa ni lee
 * `stores/unsavedChanges.store.ts`: eso lo resuelve `AppShell`, que es quien
 * abre `Modal`/`BottomSheet` antes de llamar a `logout()`.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { signOut } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';

interface LogoutLocationState {
  logoutError: true;
}

interface UseLogoutResult {
  /** `true` desde que se confirma el cierre hasta que `signOut()` resuelve (éxito o error). */
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  async function logout() {
    setIsLoggingOut(true);

    let failed = false;
    try {
      await signOut();
    } catch {
      failed = true;
    }

    setIsLoggingOut(false);
    useAuthStore.getState().clear();

    const state: LogoutLocationState | undefined = failed ? { logoutError: true } : undefined;
    void navigate(ROUTES.ingresar, { replace: true, state });
  }

  return { isLoggingOut, logout };
}
