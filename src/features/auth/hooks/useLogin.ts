/**
 * Orquesta el envío del formulario de Login: llama a `signIn()`, mapea el
 * error de Firebase a una llave de i18n, y redirige tras éxito.
 *
 * No valida los campos — eso ya lo hizo `LoginForm` con `loginSchema` antes
 * de llamar a `login()` (CA-1.3.1).
 *
 * **Verificación de correo (CA-1.3.7, CM-180):** si `emailVerified === false`,
 * se cierra la sesión de Firebase inmediatamente y se guarda el correo no
 * verificado en `useAuthStore.unverifiedEmail`. El estado vive en el store
 * global (no en estado local del hook) porque el ciclo `signIn` →
 * `onAuthStateChanged` → `signOut` → `onAuthStateChanged` causa remounts que
 * destruyen cualquier `useState`.
 *
 * Para reenviar el correo de verificación necesitamos el `User` de Firebase,
 * que se invalida tras `signOut`. Por eso `resendVerification` hace un
 * `signIn` efímero: inicia sesión de nuevo, envía el correo y cierra sesión
 * inmediatamente. El resultado (`verificationResent`) también vive en el store
 * por la misma razón.
 */
import { useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import {
  AuthError,
  sendEmailVerification,
  signIn,
  signOut,
} from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { getAuthErrorMessageKey } from '../model/authErrorMessage';

interface LoginLocationState {
  from?: Location;
}

interface UseLoginResult {
  isSubmitting: boolean;
  errorMessageKey: string | null;
  unverifiedEmail: string | null;
  isResending: boolean;
  resendSuccess: boolean;
  resendErrorKey: string | null;
  resendVerification: () => Promise<void>;
  dismissUnverified: () => void;
  login: (correo: string, contrasena: string) => Promise<void>;
}

function resolveRedirectTarget(from: Location | undefined): string {
  if (!from) return ROUTES.inicio;
  return `${from.pathname}${from.search}${from.hash}`;
}

// Credenciales del último intento con correo no verificado. Vive a nivel de
// módulo (no en useRef ni en el store) para sobrevivir al remount que causa el
// ciclo signIn→signOut→redirect, sin exponer contraseñas en estado global
// observable.
let pendingCredentials: { correo: string; contrasena: string } | null = null;

export function useLogin(): UseLoginResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessageKey, setErrorMessageKey] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendErrorKey, setResendErrorKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const unverifiedEmail = useAuthStore((s) => s.unverifiedEmail);
  const resendSuccess = useAuthStore((s) => s.verificationResent);

  async function login(correo: string, contrasena: string) {
    setIsSubmitting(true);
    setErrorMessageKey(null);
    useAuthStore.getState().setUnverifiedEmail(null);

    try {
      const user = await signIn(correo, contrasena);

      if (!user.emailVerified) {
        pendingCredentials = { correo, contrasena };
        useAuthStore.getState().setUnverifiedEmail(user.email);
        await signOut();
        setIsSubmitting(false);
        return;
      }

      useAuthStore.getState().setUser(
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        useAuthStore.getState().plan,
      );

      const state = location.state as LoginLocationState | null;
      void navigate(resolveRedirectTarget(state?.from), { replace: true });
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'AUTH_UNKNOWN_ERROR';
      setErrorMessageKey(getAuthErrorMessageKey(code));
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!pendingCredentials) return;
    setIsResending(true);
    useAuthStore.getState().setVerificationResent(false);
    setResendErrorKey(null);

    try {
      const user = await signIn(
        pendingCredentials.correo,
        pendingCredentials.contrasena,
      );
      await sendEmailVerification(user);
      await signOut();
      useAuthStore.getState().setVerificationResent(true);
    } catch (error) {
      const code = error instanceof AuthError ? error.code : '';
      if (code === 'AUTH_TOO_MANY_REQUESTS') {
        setResendErrorKey('auth:verificacion.correoNoVerificado.limiteReenvios');
      } else {
        setResendErrorKey('auth:verificacion.correoNoVerificado.errorReenvio');
      }
    } finally {
      setIsResending(false);
    }
  }

  function dismissUnverified() {
    useAuthStore.getState().setUnverifiedEmail(null);
    pendingCredentials = null;
    setResendErrorKey(null);
  }

  return {
    isSubmitting,
    errorMessageKey,
    unverifiedEmail,
    isResending,
    resendSuccess,
    resendErrorKey,
    resendVerification,
    dismissUnverified,
    login,
  };
}
