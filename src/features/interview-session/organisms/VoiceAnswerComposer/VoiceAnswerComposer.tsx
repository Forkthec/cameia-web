/**
 * Respuesta por voz del chat de Simulación (HU-5.8): «Grabar», «Detener»,
 * «Enviar» y «Responder por texto», con el aviso de tratamiento del audio
 * antes de la primera grabación (CA-5.8.24) y, si el envío pasa de 20 s,
 * el aviso de que puede tardar hasta 2 minutos (CA-5.8.5).
 *
 * Mientras se envía, «Enviar» queda deshabilitado con un spinner visible y
 * conserva su nombre accesible (CA-5.8.6, CM-316 D7): no usa el modo de
 * carga de `Button`, que cambia la etiqueta. «Procesando tu respuesta…» lo
 * anuncia solo la región `aria-live` de `SessionStage`, como en el texto
 * (CA-5.2.4).
 *
 * Solo pinta: el estado de la grabación y el envío vienen de
 * `useVoiceRecorder` y `useInterviewTurn` a través de la página. Mismo
 * vidrio que `TextAnswerComposer`; usa los átomos `Button` e `Icon` y la
 * molécula `AlertInline`.
 */
import { Button } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { cn } from '@/utils/cn';

export type VoiceComposerStep = 'ready' | 'requesting' | 'recording' | 'stopped';

interface VoiceAnswerComposerProps {
  /** En qué punto está la respuesta por voz. */
  step: VoiceComposerStep;
  /** Tiempo grabado sobre el máximo, ya formateado (p. ej. «0:42 / 3:00»). */
  elapsedLabel: string;
  isSubmitting: boolean;
  /** `true` cuando el envío ya pasó de 20 s (CA-5.8.5). */
  showLongWait: boolean;
  /** `true` hasta que la primera grabación empieza de verdad (CA-5.8.24, CM-316 D8). */
  showPrivacyNotice: boolean;
  /** `false` cuando el campo de texto ya se muestra junto a la voz (CA-5.8.25). */
  showSwitchToText: boolean;
  /** Aviso sobre los controles (p. ej. «No detectamos tu voz…»), ya traducido. */
  notice?: string;
  labels: {
    record: string;
    stop: string;
    send: string;
    switchToText: string;
    privacy: string;
    longWait: string;
  };
  onRecord: () => void;
  onStop: () => void;
  onSend: () => void;
  onSwitchToText: () => void;
  className?: string;
}

export function VoiceAnswerComposer({
  step,
  elapsedLabel,
  isSubmitting,
  showLongWait,
  showPrivacyNotice,
  showSwitchToText,
  notice,
  labels,
  onRecord,
  onStop,
  onSend,
  onSwitchToText,
  className,
}: VoiceAnswerComposerProps) {
  return (
    <div
      className={cn(
        'border-text-on-inverse/15 bg-text-on-inverse/[0.07] p-space-4 gap-space-3 flex flex-col items-center rounded-xl border backdrop-blur-md',
        className,
      )}
    >
      {notice ? (
        <AlertInline variant="warning" className="w-full">
          {notice}
        </AlertInline>
      ) : null}

      {step === 'recording' || step === 'stopped' ? (
        <span className="text-body text-text-on-inverse font-semibold tabular-nums">
          {elapsedLabel}
        </span>
      ) : null}

      <div className="gap-space-4 flex flex-wrap items-center justify-center">
        {step === 'recording' ? (
          <Button variant="primary" size="lg" icon={<Icon name="stop" />} onClick={onStop}>
            {labels.stop}
          </Button>
        ) : step === 'stopped' ? (
          <Button
            variant="primary"
            size="lg"
            icon={isSubmitting ? <Icon name="loading-arc" className="animate-spin" /> : undefined}
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
            onClick={onSend}
          >
            {labels.send}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            icon={<Icon name="microphone" />}
            disabled={step === 'requesting'}
            onClick={onRecord}
          >
            {labels.record}
          </Button>
        )}

        {isSubmitting || !showSwitchToText ? null : (
          <button
            type="button"
            onClick={onSwitchToText}
            className="text-body text-text-on-inverse min-h-touch-target px-space-2 focus-visible:shadow-focus-ring cursor-pointer rounded-md font-semibold underline underline-offset-4 focus-visible:outline-none"
          >
            {labels.switchToText}
          </button>
        )}
      </div>

      {isSubmitting && showLongWait ? (
        <p role="status" className="text-small text-brand-accent-light text-center">
          {labels.longWait}
        </p>
      ) : null}

      {showPrivacyNotice ? (
        <p className="text-small text-text-on-inverse/70 gap-space-2 flex items-center text-center">
          <Icon name="lock" size={16} />
          {labels.privacy}
        </p>
      ) : null}
    </div>
  );
}
