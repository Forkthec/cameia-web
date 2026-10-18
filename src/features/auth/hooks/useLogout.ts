/**
 * Orquesta el cierre de sesión (`CM-194`, `CA-1.8.1`, `CA-1.8.2`), simétrico
 * a `useLogin.ts`: llama a `POST /api/v1/auth/logout-all` para revocar las
 * sesiones en todos los dispositivos (CM-331), luego `signOut()`, limpia
 * `useAuthStore` y borra `lastUsedProfileId` (`CA-1.8.3`, CM-243) de forma
 * explícita —sin esperar al listener asíncrono de `AuthProvider`, mismo
 * criterio de determinismo que ya usa `useLogin` en sentido inverso— y
 * navega a `/ingresar`.
 *
 * Si `logoutAll()` falla (red, 5xx), el cierre local ocurre igual: no tiene
 * sentido dejar a alguien atrapado en una pantalla autenticada porque falló
 * la revocación remota. Si `signOut()` falla (raro: problema interno del
 * SDK), el cierre local ocurre igual. Se navega con
 * `location.state.logoutError` para que `LoginPage` muestre el aviso.
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
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { logoutAll } from '../api/session.api';

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
      await logoutAll().catch(() => {});
      await signOut();
    } catch {
      failed = true;
    }

    setIsLoggingOut(false);
    useAuthStore.getState().clear();
    // CA-1.8.3: sin esperar al listener de `AuthProvider`, para que "tras
    // signOut" ya se cumpla al navegar. El idioma de la interfaz no se toca:
    // es del dispositivo, no del usuario.
    useUiPreferencesStore.getState().setLastUsedProfileId(null);

    const state: LogoutLocationState | undefined = failed ? { logoutError: true } : undefined;
    void navigate(ROUTES.ingresar, { replace: true, state });
  }

  return { isLoggingOut, logout };
}
