/**
 * Fallo de la IA al evaluar una respuesta ya guardada (CA-5.2.19,
 * CA-5.2.20): el mensaje sin detalles técnicos, «Reintentar» (vuelve a
 * evaluar sin pedir texto nuevo) y, cuando se agotaron los 2 reintentos del
 * primer tramo, «Ir al inicio» (HU-10.4). Al agotar el segundo tramo la
 * página lo muestra sin «Reintentar» (SPEC v11.3 D2). También lo usa el
 * cierre de HU-5.5, que siempre muestra «Reintentar».
 *
 * Organismo de la feature: `AlertInline`, `Button` y `ButtonLink`. No decide
 * cuándo ocultar «Reintentar»: lo recibe de la página.
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
  /** Si se muestra «Reintentar»; `true` por defecto. `false` deja solo el mensaje y `homeLink`. */
  showRetry?: boolean;
  /** «Ir al inicio» y su destino; solo cuando se agotaron los reintentos. */
  homeLink?: { label: string; to: string };
}

export function EvaluationRetryPanel({
  message,
  retryLabel,
  retryingLabel,
  isRetrying,
  onRetry,
  showRetry = true,
  homeLink,
}: EvaluationRetryPanelProps) {
  return (
    <div className="gap-space-3 flex flex-col">
      <AlertInline variant="error">{message}</AlertInline>
      <div className="gap-space-3 flex flex-wrap justify-center">
        {showRetry ? (
          <Button
            variant="primary"
            {...(isRetrying
              ? { loading: true as const, loadingLabel: retryingLabel }
              : { loading: false as const })}
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        ) : null}
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
