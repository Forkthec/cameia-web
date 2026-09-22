/**
 * Orquesta el envío del formulario de Login: llama a `signIn()`, mapea el
 * error de Firebase a una llave de i18n, y redirige tras éxito.
 *
 * No valida los campos — eso ya lo hizo `LoginForm` con `loginSchema` antes
 * de llamar a `login()` (CA-1.3.1).
 *
 * Actualiza `useAuthStore` con `isAuthenticated: true` en cuanto Firebase
 * confirma la sesión, **sin esperar** a `AuthProvider` (que solo reacciona a
 * `onAuthStateChanged` de forma asíncrona, con su propio `getIdTokenResult`
 * para el plan). Si se navegara al destino protegido antes de que el store
 * reflejara la sesión, `RequireAuth` podría alcanzar a evaluar
 * `isAuthenticated: false` primero y rebotar de vuelta a `/ingresar`. El
 * `plan` real llega segundos después, cuando `AuthProvider` sí resuelve el
 * custom claim — esta llamada solo se adelanta a marcar la sesión como
 * activa, no duplica esa lectura.
 */
import { useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { AuthError, signIn } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { activateAccount } from '../api/verification.api';
import { getAuthErrorMessageKey } from '../model/authErrorMessage';

interface LoginLocationState {
  from?: Location;
}

interface UseLoginResult {
  /** `true` desde que se envía el formulario hasta que Firebase resuelve (éxito o error). */
  isSubmitting: boolean;
  /** Llave de i18n del error genérico a mostrar en `AlertInline`, o `null` si no hay error pendiente. */
  errorMessageKey: string | null;
  login: (correo: string, contrasena: string) => Promise<void>;
}

function resolveRedirectTarget(from: Location | undefined): string {
  if (!from) return ROUTES.inicio;
  return `${from.pathname}${from.search}${from.hash}`;
}

export function useLogin(): UseLoginResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessageKey, setErrorMessageKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  async function login(correo: string, contrasena: string) {
    setIsSubmitting(true);
    setErrorMessageKey(null);

    try {
      const user = await signIn(correo, contrasena);
      useAuthStore.getState().setUser(
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        useAuthStore.getState().plan,
      );

      // Activación de rezagados (`CM-14`): si el correo ya está verificado, la
      // Cuenta puede seguir en `PENDING_VERIFICATION` porque la activación de
      // su momento falló. No hay forma de preguntarlo (`SPEC.md` B-24) y
      // `REQ-CU-13` la declara idempotente, así que se repite sin bloquear la
      // navegación y sin que un fallo impida entrar a una cuenta ya verificada.
      if (user.emailVerified) {
        void activateAccount().catch(() => undefined);
      }

      const state = location.state as LoginLocationState | null;
      void navigate(resolveRedirectTarget(state?.from), { replace: true });
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'AUTH_UNKNOWN_ERROR';
      setErrorMessageKey(getAuthErrorMessageKey(code));
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, errorMessageKey, login };
}
