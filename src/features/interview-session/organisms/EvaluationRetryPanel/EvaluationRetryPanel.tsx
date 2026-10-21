/**
 * Fallo de la IA al evaluar una respuesta ya guardada (CA-5.2.19,
 * CA-5.2.20): el mensaje sin detalles técnicos, «Reintentar» (vuelve a
 * evaluar sin pedir texto nuevo) y, cuando se agotaron los 2 reintentos,
 * «Ir al inicio» (HU-10.4).
 *
 * Organismo de la feature: `AlertInline`, `Button` y `ButtonLink`.
 */
import { Button, ButtonLink } from '@/design-system/atoms/Button';
import { AlertInline } from '@/design-system/molecules/AlertInline';

interface EvaluationRetryPanelProps {
  /** Mensaje ya traducido (genérico o de reintentos agotados). */
  message: string;
  /** «Reintentar», ya traducido. */
  retryLabel: string;
  /** Texto del botón en carga, ya traducido. */
  retryingLabel: string;
  isRetrying: boolean;
  onRetry: () => void;
  /** «Ir al inicio» y su destino; solo cuando se agotaron los reintentos. */
  homeLink?: { label: string; to: string };
}

export function EvaluationRetryPanel({
  message,
  retryLabel,
  retryingLabel,
  isRetrying,
  onRetry,
  homeLink,
}: EvaluationRetryPanelProps) {
  return (
    <div className="gap-space-3 flex flex-col">
      <AlertInline variant="error">{message}</AlertInline>
      <div className="gap-space-3 flex flex-wrap justify-center">
        <Button
          variant="primary"
          {...(isRetrying
            ? { loading: true as const, loadingLabel: retryingLabel }
            : { loading: false as const })}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
        {homeLink ? (
          <ButtonLink
            to={homeLink.to}
            variant="secondary"
            className="border-text-on-inverse/30 text-text-on-inverse bg-transparent"
          >
            {homeLink.label}
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
