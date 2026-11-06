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
 *
 * **Activación de cuenta (CA-1.2.14, CM-180):** al iniciar sesión con
 * `emailVerified === true`, se llama a `POST /api/v1/users/me/verification`
 * fire-and-forget. Si responde `ACCOUNT_DISABLED`, se cierra la sesión y se
 * muestra el error. Si falla por red o 5xx, el ingreso continúa y se
 * reintenta en el siguiente inicio de sesión.
 *
 * **DF-003 (10-oct-2026):** si `sendEmailVerification` falla (p. ej. Firebase
 * responde 400 al segundo reenvío), la sesión efímera debe cerrarse en el
 * `catch`; de lo contrario la app queda con `isAuthenticated=true` y
 * `emailVerified=false`, dando acceso al área privada.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { ApiError } from '@/services/http/ApiError';
import {
  AuthError,
  sendEmailVerification,
  signIn,
  signOut,
} from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { activateAccount } from '../api/verification.api';
import { getAuthErrorMessageKey } from '../model/authErrorMessage';

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

      // CA-1.2.14: activar la cuenta en el backend. Fire-and-forget: si falla
      // por red o 5xx, se reintenta en el siguiente inicio de sesión.
      void activateAccount().catch((error) => {
        if (error instanceof ApiError && error.hasCode('ACCOUNT_DISABLED')) {
          void signOut().then(() => {
            window.location.href = '/ingresar?cuentaDeshabilitada=1';
          });
        }
      });

      void navigate(ROUTES.inicio, { replace: true });
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

    let signedIn = false;
    try {
      const user = await signIn(pendingCredentials.correo, pendingCredentials.contrasena);
      signedIn = true;
      await sendEmailVerification(user);
      await signOut();
      signedIn = false;
      useAuthStore.getState().setVerificationResent(true);
    } catch (error) {
      if (signedIn) {
        await signOut().catch(() => {});
      }
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
