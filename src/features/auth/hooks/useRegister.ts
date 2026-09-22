/**
 * Orquesta el envío del formulario de Registro (`ADR-0006`): `POST
 * /api/v1/users` (sin sesión) → si `201`, reutiliza `signIn()` (mismo que
 * Login) → `sendEmailVerification()` → guarda la sesión → redirige a
 * `/verificar-correo` con `registroExitoso`, la marca que enciende el `Toast`
 * de esa pantalla.
 *
 * **Hasta `CM-14` abría aquí un `Modal` de Plan Gratis que nunca llegó a
 * verse** (defecto D-01, `SPEC.md` §9): `/registro` cuelga de
 * `RedirectIfAuthenticated`, que desmonta la página en cuanto el store marca
 * la sesión. El mensaje del plan vive ahora en la pantalla de verificación.
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
 *
 * `errorInfo` (`ADR-0007`, ya no hay `code` propio del backend): expone
 * `httpStatus` + el primer `field` que `BusinessExceptionHandler.java` haya
 * etiquetado (`birthDate`/`password` — `phoneNumber` nunca llega etiquetado,
 * `valorInvalido()` no llama `campo()`). `httpStatus: 0` marca un fallo que
 * ni siquiera llegó a responder (red). `RegisterPage` traduce cada
 * combinación a su propia llave de `auth:registro.errores.*`.
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

export interface RegisterErrorInfo {
  httpStatus: number;
  field?: string;
}

interface UseRegisterResult {
  /** `true` desde que se envía el formulario hasta que el backend/Firebase resuelven (éxito o error). */
  isSubmitting: boolean;
  errorInfo: RegisterErrorInfo | null;
  register: (values: RegisterFormValues) => Promise<void>;
}

export function useRegister(): UseRegisterResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<RegisterErrorInfo | null>(null);
  const navigate = useNavigate();

  async function register(values: RegisterFormValues) {
    setIsSubmitting(true);
    setErrorInfo(null);

    try {
      await registerUser(values);
    } catch (error) {
      setErrorInfo(
        error instanceof ApiError
          ? { httpStatus: error.httpStatus, field: error.errors[0]?.field }
          : { httpStatus: 0 },
      );
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
      void navigate(ROUTES.verificarCorreo, { state: { registroExitoso: true } });
    } catch {
      setIsSubmitting(false);
      void navigate(ROUTES.ingresar, { state: { registerInfo: SIGN_IN_AFTER_REGISTER_FAILED } });
    }
  }

  return { isSubmitting, errorInfo, register };
}
