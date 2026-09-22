/**
 * `/verificar-correo` · HU-1.2 / CM-14 / `PRT-01.02`. Compone `AuthLayout`
 * (mismo `headline` que Login y Registro) + `VerifyEmailPanel`, y es la única
 * pieza de esta pantalla que llama `useTranslation` y `useEmailVerification`.
 *
 * Traduce el error del hook a su llave: los de reenvío se muestran sin acción
 * (el propio botón sigue ahí) y los de activación con «Reintentar», porque
 * ahí sí hay algo que volver a intentar (`SPEC.md` §3/§4).
 *
 * El `Toast` de «¡Registro exitoso!» solo aparece al llegar desde Registro
 * (`location.state.registroExitoso`): quien llega redirigido por
 * `RequireVerifiedEmail` tras iniciar sesión no acaba de registrarse. Se
 * renderiza aquí, sin store ni host global — mismo criterio ya decidido para
 * `AlertInline` en `LoginPage` (`CM-194`).
 */
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Toast } from '@/design-system/molecules/Toast';
import { useAuthStore } from '@/stores/auth.store';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { resolveWebmailUrl } from '../model/webmailProviders';
import { VerifyEmailPanel } from '../organisms/VerifyEmailPanel';

interface VerifyEmailLocationState {
  registroExitoso?: true;
}

export function VerifyEmailPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const location = useLocation();
  const isEmailVerified = useAuthStore((state) => state.user?.emailVerified ?? false);
  const {
    email,
    isActivating,
    isResending,
    hasResent,
    resendCooldownSeconds,
    error,
    resend,
    retryActivation,
  } = useEmailVerification();

  const comesFromRegister = (location.state as VerifyEmailLocationState | null)?.registroExitoso;
  const [isToastVisible, setIsToastVisible] = useState(Boolean(comesFromRegister));

  const isActivationError =
    error === 'activation-rejected' ||
    error === 'activation-network' ||
    error === 'activation-failed';

  const feedbackMessage =
    error === 'resend-throttled'
      ? t('verificacion.errores.demasiadosIntentos')
      : error === 'resend-failed'
        ? t('errors:generico')
        : error === 'activation-rejected'
          ? t('verificacion.errores.noConfirmada')
          : error === 'activation-network'
            ? t('errors:red')
            : error === 'activation-failed'
              ? t('errors:generico')
              : hasResent
                ? t('verificacion.reenviado')
                : undefined;

  const feedbackVariant =
    error === 'resend-throttled' ? 'warning' : error ? 'error' : ('success' as const);

  // Alguien con el correo ya verificado no tiene nada que hacer aquí: llegó
  // escribiendo la URL, o acaba de completarse la activación.
  if (isEmailVerified) {
    return <Navigate to={ROUTES.inicio} replace />;
  }

  return (
    <AuthLayout headline={t('ingreso.marca.titular')}>
      {isToastVisible ? (
        <Toast
          variant="success"
          className="right-space-4 top-space-4 fixed z-50 max-w-[26rem]"
          onDismiss={() => setIsToastVisible(false)}
          dismissLabel={t('verificacion.toastCerrar')}
        >
          {t('verificacion.toastRegistro')}
        </Toast>
      ) : null}

      <VerifyEmailPanel
        titleText={t('verificacion.titulo')}
        sentToMessage={
          <Trans
            i18nKey="auth:verificacion.enviadoA"
            values={{ correo: email ?? '' }}
            components={{ destacado: <strong className="text-text-primary font-semibold" /> }}
          />
        }
        instructionText={t('verificacion.instruccion')}
        noteText={comesFromRegister ? t('verificacion.planGratis') : undefined}
        webmailUrl={resolveWebmailUrl(email)}
        openMailLabel={t('verificacion.abrirCorreo')}
        resendLabel={t('verificacion.reenviar')}
        resendWaitingLabel={t('verificacion.reenviarEspera', { segundos: resendCooldownSeconds })}
        resendLoadingLabel={t('verificacion.reenviando')}
        resendCooldownSeconds={resendCooldownSeconds}
        isResending={isResending}
        onResend={() => void resend()}
        isActivating={isActivating}
        activatingLabel={t('verificacion.activando')}
        feedbackMessage={feedbackMessage}
        feedbackVariant={feedbackVariant}
        retryLabel={isActivationError ? t('verificacion.reintentar') : undefined}
        onRetry={isActivationError ? () => void retryActivation() : undefined}
      />
    </AuthLayout>
  );
}
