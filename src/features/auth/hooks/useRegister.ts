/**
 * Orquesta el envío del formulario de Registro (`ADR-0006`): `POST
 * /api/v1/users` (sin sesión) → si `201`, reutiliza `signIn()` (mismo que
 * Login) → `sendEmailVerification()` (nueva) → guarda la sesión → abre el
 * `Modal` de confirmación de Plan Gratis. Al cerrar el modal (con
 * "Entendido", Esc o clic en el velo — no hay nada que cancelar, así que
 * las tres rutas hacen lo mismo), redirige a `/inicio`.
 *
 * No valida los campos — eso ya lo hizo `RegisterForm` con `registerSchema`.
 *
 * **Caso de borde (`SPEC.md` §3, decisión de Frontend, no dibujado en
 * Figma):** si el `POST` tiene éxito pero `signIn()`/`sendEmailVerification()`
 * fallan después, la cuenta ya existe en el backend — no se trata como
 * fallo de registro. Se redirige a `/ingresar` con `location.state.registerInfo`
 * (mismo mecanismo que `RequireAuth`/`useLogin` usan para `from`), para que
 * `LoginPage` muestre un mensaje informativo en vez de dejar a la persona
 * varada en un formulario que ya cumplió su propósito.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { ApiError } from '@/services/http/ApiError';
import { sendEmailVerification, signIn } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { registerUser } from '../api/register.api';
import type { RegisterFormValues } from '../schemas/register.schema';

/** Valor de `location.state.registerInfo` que `LoginPage` reconoce para mostrar el mensaje informativo del caso de borde. */
export const SIGN_IN_AFTER_REGISTER_FAILED = 'SIGN_IN_AFTER_REGISTER_FAILED';

interface UseRegisterResult {
  /** `true` desde que se envía el formulario hasta que el backend/Firebase resuelven (éxito o error). */
  isSubmitting: boolean;
  /** `true` mientras se muestra el `Modal` de confirmación de Plan Gratis. */
  isSuccessModalOpen: boolean;
  /**
   * `error.code` de `ApiError` si el `POST` respondió `4xx`, o
   * `'NETWORK_ERROR'` si la petición ni siquiera llegó a responder.
   * `RegisterPage` decide, con `i18n.exists`, qué llave de `errors:codigos`
   * le corresponde (mismo patrón que `EditProfilePage`).
   */
  errorCode: string | null;
  register: (values: RegisterFormValues) => Promise<void>;
  /** Cierra el modal y redirige a `/inicio` — misma acción sin importar cómo se cerró. */
  closeSuccessModal: () => void;
}

export function useRegister(): UseRegisterResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const navigate = useNavigate();

  async function register(values: RegisterFormValues) {
    setIsSubmitting(true);
    setErrorCode(null);

    try {
      await registerUser(values);
    } catch (error) {
      setErrorCode(error instanceof ApiError ? error.code : 'NETWORK_ERROR');
      setIsSubmitting(false);
      return;
    }

    try {
      const user = await signIn(values.correo, values.contrasena);
      await sendEmailVerification(user);
      useAuthStore.getState().setUser(
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        useAuthStore.getState().plan,
      );
      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    } catch {
      setIsSubmitting(false);
      void navigate(ROUTES.ingresar, { state: { registerInfo: SIGN_IN_AFTER_REGISTER_FAILED } });
    }
  }

  function closeSuccessModal() {
    setIsSuccessModalOpen(false);
    void navigate(ROUTES.inicio, { replace: true });
  }

  return { isSubmitting, isSuccessModalOpen, errorCode, register, closeSuccessModal };
}
