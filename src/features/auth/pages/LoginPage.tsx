/**
 * `/ingresar` · HU-1.3 / CM-40 / `PRT-01.03`. Compone `AuthLayout` +
 * `LoginForm`: esta página es la única pieza de la feature que llama
 * `useTranslation` y `useLogin` — `LoginForm` es puramente presentacional
 * (ver su TSDoc de cabecera).
 *
 * `location.state.registerInfo` (CM-34, `useRegister.ts`): cuando Registro
 * completó el `POST` pero `signIn()`/`sendEmailVerification()` fallaron
 * después, redirige aquí con esa marca — se muestra como mensaje
 * informativo, nunca como error de Login (la cuenta ya existe).
 *
 * `location.state.logoutError` (`CM-194`, `useLogout.ts`): cuando `signOut()`
 * de Firebase falla (raro), el cierre local ocurre igual y se llega aquí con
 * esta marca. Se muestra fuera de `LoginForm` —no es un error de este
 * formulario, no debe poner los campos en borde rojo— reutilizando el mismo
 * mecanismo de `location.state` que ya usa `registerInfo`, en vez de la
 * infraestructura de `Toast` que pedía el primer borrador de la SPEC:
 * `Toast.tsx` no tiene ningún consumidor real ni host montado en la app
 * todavía, y para este caso raro no vale la pena construirlo (decisión
 * explícita del usuario).
 */
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { AuthLayout } from '@/layouts/AuthLayout';
import { SIGN_IN_AFTER_REGISTER_FAILED } from '../hooks/useRegister';
import { useLogin } from '../hooks/useLogin';
import { LoginForm } from '../organisms/LoginForm';

interface LoginLocationState {
  registerInfo?: string;
  logoutError?: true;
}

export function LoginPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const { isSubmitting, errorMessageKey, login } = useLogin();
  const location = useLocation();

  const state = location.state as LoginLocationState | null;
  const infoMessage =
    state?.registerInfo === SIGN_IN_AFTER_REGISTER_FAILED
      ? t('ingreso.infoRegistroPendiente')
      : undefined;
  const logoutErrorMessage = state?.logoutError ? t('errors:generico') : undefined;

  return (
    <AuthLayout headline={t('ingreso.marca.titular')}>
      {logoutErrorMessage ? <AlertInline variant="error">{logoutErrorMessage}</AlertInline> : null}
      <LoginForm
        isSubmitting={isSubmitting}
        genericErrorMessage={errorMessageKey ? t(errorMessageKey) : undefined}
        infoMessage={infoMessage}
        onSubmit={(values) => void login(values.correo, values.contrasena)}
        titleText={t('ingreso.titulo')}
        googleButtonLabel={t('ingreso.google')}
        dividerLabel={t('ingreso.o')}
        correoLabel={t('ingreso.campos.correo')}
        correoPlaceholder={t('ingreso.correoPlaceholder')}
        correoErrorRequired={t('ingreso.errores.correoRequerido')}
        correoErrorInvalid={t('ingreso.errores.correoInvalido')}
        contrasenaLabel={t('ingreso.campos.contrasena')}
        contrasenaPlaceholder={t('ingreso.contrasenaPlaceholder')}
        contrasenaErrorRequired={t('ingreso.errores.contrasenaRequerida')}
        showPasswordLabel={t('ingreso.mostrarContrasena')}
        hidePasswordLabel={t('ingreso.ocultarContrasena')}
        forgotPasswordLabel={t('ingreso.olvideContrasena')}
        submitLabel={t('ingreso.cta')}
        submitLoadingLabel={t('ingreso.cargando')}
        footerQuestion={t('ingreso.noTengoCuenta')}
        footerCta={t('ingreso.irARegistro')}
      />
    </AuthLayout>
  );
}
