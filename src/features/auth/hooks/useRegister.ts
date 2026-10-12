/**
 * Orquesta el envío del formulario de Registro (`ADR-0006`): `POST
 * /api/v1/users` (sin sesión) → si `201`, reutiliza `signIn()` (mismo que
 * Login) → `sendEmailVerification()` → cierra la sesión transitoria →
 * muestra la pantalla de «Verifica tu correo» con el botón «Ir a iniciar
 * sesión». Al pulsarlo, redirige a `/ingresar`.
 *
 * No valida los campos — eso ya lo hizo `RegisterForm` con `registerSchema`.
 *
 * **CA-1.1.1 (CM-180):** la sesión transitoria de Firebase se cierra siempre
 * después de `sendEmailVerification` (también si falla), para que la persona
 * no entre al área privada con el correo sin verificar — todo Gateway
 * respondería `403 EMAIL_NOT_VERIFIED`.
 *
 * **Caso de borde (`SPEC.md` §3, decisión de Frontend, no dibujado en
 * Figma):** si el `POST` tiene éxito pero `signIn()`/`sendEmailVerification()`
 * fallan después, la cuenta ya existe en el backend — no se trata como
 * fallo de registro. Se redirige a `/ingresar` con `location.state.registerInfo`
 * (mismo mecanismo que `RequireAuth`/`useLogin` usan para `from`), para que
 * `LoginPage` muestre un mensaje informativo en vez de dejar a la persona
 * varada en un formulario que ya cumplió su propósito.
 *
 * **CM-250:** si el `POST` falla por red/timeout (no `ApiError`), la cuenta
 * pudo haberse creado en el backend antes de que la respuesta llegara. Se
 * intenta `signIn()` con las mismas credenciales: si funciona, se continúa
 * el flujo normal; si no, se muestra el error de red.
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
import { sendEmailVerification, signIn, signOut } from '@/services/firebase/auth.service';
import { registerUser } from '../api/register.api';
import type { RegisterFormValues } from '../schemas/register.schema';

/** Valor de `location.state.registerInfo` que `LoginPage` reconoce para mostrar el mensaje informativo del caso de borde. */
export const SIGN_IN_AFTER_REGISTER_FAILED = 'SIGN_IN_AFTER_REGISTER_FAILED';

export interface RegisterErrorInfo {
  httpStatus: number;
  field?: string;
}

/** Resultado de la etapa de verificación tras el registro exitoso. */
export interface VerificationResult {
  email: string;
  emailSent: boolean;
}

interface UseRegisterResult {
  /** `true` desde que se envía el formulario hasta que el backend/Firebase resuelven (éxito o error). */
  isSubmitting: boolean;
  /** Presente cuando el registro fue exitoso y se debe mostrar la pantalla de verificación. */
  verificationResult: VerificationResult | null;
  errorInfo: RegisterErrorInfo | null;
  register: (values: RegisterFormValues) => Promise<void>;
  /** Cierra la pantalla de verificación y redirige a `/ingresar`. */
  goToLogin: () => void;
}

export function useRegister(): UseRegisterResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [errorInfo, setErrorInfo] = useState<RegisterErrorInfo | null>(null);
  const navigate = useNavigate();

  async function signInSendVerificationAndSignOut(
    email: string,
    password: string,
  ): Promise<VerificationResult> {
    const user = await signIn(email, password);
    let emailSent = false;
    try {
      await sendEmailVerification(user);
      emailSent = true;
    } catch {
      // CA-1.1.36: si el envío falla, se sigue cerrando la sesión y se
      // muestra el mensaje de fallo — no se trata como error de registro.
    }
    await signOut();
    return { email: user.email ?? email, emailSent };
  }

  async function register(values: RegisterFormValues) {
    setIsSubmitting(true);
    setErrorInfo(null);

    try {
      await registerUser(values);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorInfo({ httpStatus: error.httpStatus, field: error.errors[0]?.field });
        setIsSubmitting(false);
        return;
      }

      // CM-250: el POST pudo haber tenido éxito en el backend aunque la
      // respuesta no llegara (timeout, corte de red). Antes de mostrar "No
      // hay conexión", se intenta iniciar sesión: si funciona, la cuenta
      // existe y se continúa el flujo normal.
      try {
        const result = await signInSendVerificationAndSignOut(values.correo, values.contrasena);
        setIsSubmitting(false);
        setVerificationResult(result);
        return;
      } catch {
        setErrorInfo({ httpStatus: 0 });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const result = await signInSendVerificationAndSignOut(values.correo, values.contrasena);
      setIsSubmitting(false);
      setVerificationResult(result);
    } catch {
      setIsSubmitting(false);
      void navigate(ROUTES.ingresar, { state: { registerInfo: SIGN_IN_AFTER_REGISTER_FAILED } });
    }
  }

  function goToLogin() {
    setVerificationResult(null);
    void navigate(ROUTES.ingresar, { replace: true });
  }

  return { isSubmitting, verificationResult, errorInfo, register, goToLogin };
}
