/**
 * Contenido de la pantalla `/verificar-correo` (`PRT-01.02`, `CM-14`).
 *
 * Presentacional puro, igual que `LoginForm`/`RegisterForm`: no llama
 * `useTranslation` ni conoce Firebase — toda la copia y todas las acciones
 * entran por props. `sentToMessage` llega como nodo, no como texto, porque la
 * frase lleva el correo destacado en medio y quien la arma es la página, con
 * `<Trans>` (`SPEC.md` §3).
 *
 * «Abrir correo» abre el webmail con `window.open` en vez de un `<a>`: el
 * design system no tiene una variante de `Button` que renderice un enlace, y
 * el atajo no merece agregarla. El navegador lo permite porque la apertura
 * ocurre dentro del gesto del clic.
 */
import type { ReactNode } from 'react';
import { AlertInline, type AlertVariant } from '@/design-system/molecules/AlertInline';
import { Button } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';
import { Spinner } from '@/design-system/atoms/Spinner';

interface VerifyEmailPanelProps {
  /** Titular de la pantalla. */
  titleText: string;
  /** Frase con el correo de destino, ya compuesta por la página. */
  sentToMessage: ReactNode;
  /** Instrucción bajo la ilustración. */
  instructionText: string;
  /** Nota secundaria opcional (hoy, el aviso de Plan Gratis tras registrarse). */
  noteText?: string;
  /** Webmail del dominio del correo; sin él, el botón «Abrir correo» no se renderiza (`SPEC.md` B-27). */
  webmailUrl: string | null;
  openMailLabel: string;
  resendLabel: string;
  /** Etiqueta con la cuenta regresiva ya interpolada; se usa mientras `resendCooldownSeconds` sea mayor que cero. */
  resendWaitingLabel: string;
  resendLoadingLabel: string;
  resendCooldownSeconds: number;
  isResending: boolean;
  onResend: () => void;
  /** `true` mientras corre la activación en el backend: reemplaza las acciones. */
  isActivating: boolean;
  activatingLabel: string;
  /** Mensaje de error o de confirmación del reenvío; sin él no se renderiza ningún aviso. */
  feedbackMessage?: string;
  feedbackVariant?: AlertVariant;
  /** Acción de reintento, solo cuando el aviso es un fallo de activación. */
  retryLabel?: string;
  onRetry?: () => void;
}

export function VerifyEmailPanel({
  titleText,
  sentToMessage,
  instructionText,
  noteText,
  webmailUrl,
  openMailLabel,
  resendLabel,
  resendWaitingLabel,
  resendLoadingLabel,
  resendCooldownSeconds,
  isResending,
  onResend,
  isActivating,
  activatingLabel,
  feedbackMessage,
  feedbackVariant = 'error',
  retryLabel,
  onRetry,
}: VerifyEmailPanelProps) {
  const isWaitingToResend = resendCooldownSeconds > 0;

  return (
    <section className="gap-space-5 flex flex-col items-center text-center">
      <h1 className="text-h1 font-display text-text-primary">{titleText}</h1>
      <p className="text-body text-text-muted">{sentToMessage}</p>

      <div
        aria-hidden="true"
        className="bg-brand-tint flex h-[120px] w-[120px] items-center justify-center rounded-full"
      >
        <Icon name="mail" size={56} className="text-brand-base" />
      </div>

      <p className="text-body text-text-muted">{instructionText}</p>
      {noteText ? <p className="text-small text-text-muted">{noteText}</p> : null}

      {feedbackMessage ? (
        <AlertInline variant={feedbackVariant} className="w-full text-left">
          {feedbackMessage}
        </AlertInline>
      ) : null}

      {isActivating ? (
        <Spinner size={24} label={activatingLabel} hideLabel={false} />
      ) : (
        <div className="gap-space-3 flex w-full flex-col items-center">
          {webmailUrl ? (
            <Button
              size="lg"
              className="w-full"
              onClick={() => window.open(webmailUrl, '_blank', 'noopener,noreferrer')}
            >
              {openMailLabel}
            </Button>
          ) : null}

          {retryLabel && onRetry ? (
            <Button variant="secondary" size="lg" className="w-full" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}

          {isResending ? (
            <Button variant="tertiary" loading loadingLabel={resendLoadingLabel}>
              {resendLabel}
            </Button>
          ) : (
            <Button variant="tertiary" disabled={isWaitingToResend} onClick={onResend}>
              {isWaitingToResend ? resendWaitingLabel : resendLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
