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
 * esta marca.
 *
 * **Modal de correo no verificado (CA-1.3.7, CM-180):** cuando `useLogin`
 * detecta que el usuario no tiene correo verificado, expone `unverifiedEmail`
 * y esta página muestra un `Modal` con las opciones de reenviar el correo
 * o usar otra cuenta.
 *
 * **RT-02-CA06 (CM-180):** cuando `httpClient` recibe `403 EMAIL_NOT_VERIFIED`
 * del Gateway, cierra sesión y redirige aquí con `?correoNoVerificado=1`.
 * Esta página detecta el query param y muestra un aviso de warning.
 *
 * **CA-1.3.11 (CM-180):** cuando `activateAccount()` en `useLogin` recibe
 * `403 ACCOUNT_DISABLED`, cierra sesión y redirige aquí con
 * `?cuentaDeshabilitada=1`. Se muestra un aviso de error.
 *
 * **CM-255 (opción 1b):** Firebase aplica el código de verificación en su
 * propia página y redirige al `continueUrl` sin `oobCode`. El `continueUrl`
 * apunta a `/ingresar?correoVerificado=1` y esta página muestra un aviso de
 * éxito: «Tu correo fue verificado. Ya puedes iniciar sesión.»
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { Modal } from '@/design-system/organisms/Modal';
import { AuthLayout } from '@/layouts/AuthLayout';
import { SIGN_IN_AFTER_REGISTER_FAILED } from '../hooks/useRegister';
import { useLogin } from '../hooks/useLogin';
import { LoginForm } from '../organisms/LoginForm';

interface LoginLocationState {
  registerInfo?: string;
  logoutError?: true;
}

export function LoginPage() {
  const { t } = useTranslation(['auth', 'errors', 'common']);
  const {
    isSubmitting,
    errorMessageKey,
    unverifiedEmail,
    isResending,
    resendSuccess,
    resendErrorKey,
    resendVerification,
    dismissUnverified,
    login,
  } = useLogin();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [formResetKey, setFormResetKey] = useState(0);

  const redirectedForUnverifiedEmail = searchParams.get('correoNoVerificado') === '1';
  const redirectedForDisabledAccount = searchParams.get('cuentaDeshabilitada') === '1';
  const redirectedForVerifiedEmail = searchParams.get('correoVerificado') === '1';

  const loadingProps = isResending
    ? ({
        primaryActionLoading: true,
        primaryActionLoadingLabel: t('common:estados.cargando'),
      } as const)
    : ({} as const);

  const state = location.state as LoginLocationState | null;
  const infoMessage =
    state?.registerInfo === SIGN_IN_AFTER_REGISTER_FAILED
      ? t('ingreso.infoRegistroPendiente')
      : undefined;
  const logoutErrorMessage = state?.logoutError ? t('errors:generico') : undefined;

  return (
    <AuthLayout headline={t('ingreso.marca.titular')}>
      {redirectedForVerifiedEmail ? (
        <AlertInline variant="success">{t('verificacion.correoVerificado.mensaje')}</AlertInline>
      ) : null}
      {redirectedForUnverifiedEmail ? (
        <AlertInline variant="warning">{t('verificacion.correoNoVerificado.mensaje')}</AlertInline>
      ) : null}
      {redirectedForDisabledAccount ? (
        <AlertInline variant="error">{t('verificacion.cuentaDeshabilitada.mensaje')}</AlertInline>
      ) : null}
      {logoutErrorMessage ? <AlertInline variant="error">{logoutErrorMessage}</AlertInline> : null}
      <LoginForm
        key={formResetKey}
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
        correoErrorMuyLargo={t('ingreso.errores.correoMuyLargo')}
        contrasenaLabel={t('ingreso.campos.contrasena')}
        contrasenaPlaceholder={t('ingreso.contrasenaPlaceholder')}
        contrasenaErrorRequired={t('ingreso.errores.contrasenaRequerida')}
        showPasswordLabel={t('ingreso.mostrarContrasena')}
        hidePasswordLabel={t('ingreso.ocultarContrasena')}
        forgotPasswordLabel={t('ingreso.olvideContrasena')}
        forgotPasswordBadgeLabel={t('ingreso.olvideContrasenaProximamente')}
        submitLabel={t('ingreso.cta')}
        submitLoadingLabel={t('ingreso.cargando')}
        footerQuestion={t('ingreso.noTengoCuenta')}
        footerCta={t('ingreso.irARegistro')}
      />

      {unverifiedEmail ? (
        <Modal
          title={t('verificacion.correoNoVerificado.titulo')}
          closeLabel={t('common:acciones.cerrar')}
          onClose={dismissUnverified}
          primaryActionLabel={t('verificacion.correoNoVerificado.reenviar')}
          onPrimaryAction={() => void resendVerification()}
          {...loadingProps}
          secondaryActionLabel={t('verificacion.correoNoVerificado.otraCuenta')}
          onSecondaryAction={() => {
            dismissUnverified();
            setFormResetKey((k) => k + 1);
          }}
          className="[&>div:last-child]:flex-col-reverse [&>div:last-child]:items-stretch"
        >
          <p className="text-body text-text-secondary">
            {t('verificacion.correoNoVerificado.mensaje')}
          </p>
          {resendSuccess ? (
            <AlertInline variant="success">
              {t('verificacion.correoNoVerificado.reenviado')}
            </AlertInline>
          ) : null}
          {resendErrorKey ? <AlertInline variant="error">{t(resendErrorKey)}</AlertInline> : null}
        </Modal>
      ) : null}
    </AuthLayout>
  );
}
