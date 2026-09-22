/**
 * Orquesta la pantalla `/verificar-correo` (`HU-1.2` / `CM-14`): detecta que
 * el correo quedó verificado, activa la Cuenta en el backend y gobierna el
 * reenvío del enlace.
 *
 * **Por qué sondea:** Firebase no avisa a esta pestaña cuando alguien hace
 * clic en el enlace del correo —el clic ocurre en otra pestaña, o en otro
 * dispositivo—, así que la única forma de enterarse sin tocar la consola de
 * Firebase es volver a preguntar (`SPEC.md` §2, decisión del 21-sep-2026).
 * Con la pestaña oculta no se sondea: nadie la está mirando y el temporizador
 * solo gastaría batería y cuota.
 *
 * **Por qué refresca el token antes de activar:** `reload()` actualiza el
 * objeto `User`, no el ID Token en caché, que sigue diciendo
 * `email_verified: false`. Sin `refreshIdToken()` el backend responde `403`
 * siempre (`REQ-CU-13`; ver TSDoc de `verification.api.ts`).
 *
 * **Por qué el reintento automático es exactamente uno:** el claim puede
 * tardar en propagarse, y un reintento silencioso es más honesto que pedir un
 * clic por un detalle interno de Firebase. Más de uno sería un bucle: a partir
 * del segundo fallo manda la persona, con «Reintentar».
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { ApiError } from '@/services/http/ApiError';
import {
  AuthError,
  refreshIdToken,
  reloadCurrentUser,
  sendEmailVerification,
} from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { activateAccount } from '../api/verification.api';

const POLL_INTERVAL_MS = 5_000;
const RESEND_COOLDOWN_SECONDS = 60;
const FIREBASE_THROTTLED_CODE = 'AUTH_TOO_MANY_REQUESTS';

/** Cada valor tiene su propio mensaje en `auth:verificacion.errores.*` o en `errors:*` (`SPEC.md` §4). */
export type VerificationError =
  | 'resend-throttled'
  | 'resend-failed'
  | 'activation-rejected'
  | 'activation-network'
  | 'activation-failed';

interface UseEmailVerificationResult {
  /** Correo al que se envió el enlace; `null` solo si la sesión se perdió mientras la pantalla estaba montada. */
  email: string | null;
  /** `true` mientras corre el `POST` de activación: único momento en que no hay nada que tocar. */
  isActivating: boolean;
  isResending: boolean;
  /** `true` tras un reenvío exitoso, hasta que el siguiente intento lo reemplace. */
  hasResent: boolean;
  /** Segundos que faltan para poder reenviar; `0` cuando el botón está libre. */
  resendCooldownSeconds: number;
  error: VerificationError | null;
  resend: () => Promise<void>;
  retryActivation: () => Promise<void>;
}

export function useEmailVerification(): UseEmailVerificationResult {
  const navigate = useNavigate();
  const email = useAuthStore((state) => state.user?.email ?? null);

  const [isActivating, setIsActivating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasResent, setHasResent] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [error, setError] = useState<VerificationError | null>(null);

  // Evita que el sondeo vuelva a disparar la activación cada 5 s cuando ya
  // falló una vez: a partir de ahí el control es de "Reintentar".
  const activationAttemptedRef = useRef(false);

  const activate = useCallback(async () => {
    setIsActivating(true);
    setError(null);

    try {
      await refreshIdToken();
      try {
        await activateAccount();
      } catch (firstAttemptError) {
        if (!(firstAttemptError instanceof ApiError) || !firstAttemptError.isForbidden()) {
          throw firstAttemptError;
        }
        await refreshIdToken();
        await activateAccount();
      }

      const { user, plan, setUser } = useAuthStore.getState();
      if (user) setUser({ ...user, emailVerified: true }, plan);
      void navigate(ROUTES.inicio, { replace: true });
    } catch (activationError) {
      // Un fallo de red no llega como `ApiError`: `httpClient` solo la
      // construye a partir de una respuesta real (ver `errorMap.ts`), así que
      // lo que no es `ApiError` es que la petición ni siquiera respondió.
      setError(
        activationError instanceof ApiError
          ? activationError.isForbidden()
            ? 'activation-rejected'
            : 'activation-failed'
          : 'activation-network',
      );
      setIsActivating(false);
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.hidden || activationAttemptedRef.current) return;

      let user;
      try {
        user = await reloadCurrentUser();
      } catch {
        // Un fallo al refrescar (red intermitente) no es un error de esta
        // pantalla: el siguiente ciclo lo vuelve a intentar.
        return;
      }

      if (cancelled || !user?.emailVerified || activationAttemptedRef.current) return;
      activationAttemptedRef.current = true;
      await activate();
    }

    function checkOnVisibilityChange() {
      void check();
    }

    void check();
    const intervalId = setInterval(() => void check(), POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', checkOnVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', checkOnVisibilityChange);
    };
  }, [activate]);

  useEffect(() => {
    if (resendCooldownSeconds === 0) return;
    const timeoutId = setTimeout(() => setResendCooldownSeconds((value) => value - 1), 1_000);
    return () => clearTimeout(timeoutId);
  }, [resendCooldownSeconds]);

  const resend = useCallback(async () => {
    setIsResending(true);
    setHasResent(false);
    setError(null);

    try {
      const user = await reloadCurrentUser();
      if (!user) throw new AuthError('AUTH_UNKNOWN_ERROR');
      await sendEmailVerification(user);
      setHasResent(true);
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (resendError) {
      setError(
        resendError instanceof AuthError && resendError.code === FIREBASE_THROTTLED_CODE
          ? 'resend-throttled'
          : 'resend-failed',
      );
    } finally {
      setIsResending(false);
    }
  }, []);

  const retryActivation = useCallback(async () => {
    await activate();
  }, [activate]);

  return {
    email,
    isActivating,
    isResending,
    hasResent,
    resendCooldownSeconds,
    error,
    resend,
    retryActivation,
  };
}
