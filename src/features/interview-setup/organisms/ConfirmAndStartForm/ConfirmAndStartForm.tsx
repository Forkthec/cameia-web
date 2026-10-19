/**
 * Paso final del wizard: resumen de configuracion y boton "Iniciar entrevista"
 * (PRT-04.11, HU-4.4). Muestra un resumen de las selecciones del usuario,
 * el boton con estado de carga (CA-4.4.17) y maneja el error generico
 * (CA-4.4.5) y el de perfil sincronizando (CA-4.4.19).
 */
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

interface SummaryRow {
  label: string;
  value: string;
}

interface ConfirmAndStartFormProps {
  title: string;
  subtitle: string;
  rows: SummaryRow[];
  startLabel: string;
  onStart: () => void;
  isLoading: boolean;
  loadingLabel: string;
  isDisabled: boolean;
  disabledMessage?: string | null;
  errorMessage?: string | null;
  backLabel: string;
  onBack: () => void;
}

export function ConfirmAndStartForm({
  title,
  subtitle,
  rows,
  startLabel,
  onStart,
  isLoading,
  loadingLabel,
  isDisabled,
  disabledMessage,
  errorMessage,
  backLabel,
  onBack,
}: ConfirmAndStartFormProps) {
  return (
    <div className="gap-space-6 flex flex-col">
      <div>
        <h2 className="text-h3 text-text-primary font-semibold">{title}</h2>
        <p className="text-body text-text-muted mt-space-1">{subtitle}</p>
      </div>

      <div className="border-border-subtle bg-bg-surface rounded-radius-md divide-border-subtle divide-y border">
        {rows.map((row) => (
          <div key={row.label} className="p-space-4 flex items-center justify-between">
            <span className="text-small text-text-muted">{row.label}</span>
            <span className="text-body text-text-primary font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      {disabledMessage ? (
        <div
          className="bg-status-warning-subtle rounded-radius-sm p-space-3 gap-space-2 flex items-center"
          role="alert"
        >
          <Icon name="alert-triangle" size={16} className="text-status-warning shrink-0" />
          <p className="text-small text-text-primary">{disabledMessage}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="bg-status-error-subtle rounded-radius-sm p-space-3 gap-space-2 flex items-center"
          role="alert"
        >
          <Icon name="alert-circle" size={16} className="text-status-error shrink-0" />
          <p className="text-small text-text-primary">{errorMessage}</p>
        </div>
      ) : null}

      <div className="gap-space-3 flex flex-col sm:flex-row-reverse">
        <button
          type="button"
          onClick={onStart}
          disabled={isDisabled || isLoading}
          className={cn(
            'min-h-touch-target rounded-radius-md px-space-6 py-space-3 text-body flex-1 font-semibold transition-colors',
            'focus-visible:shadow-focus-ring focus-visible:outline-none',
            isDisabled || isLoading
              ? 'bg-bg-disabled text-text-disabled cursor-not-allowed'
              : 'bg-action-primary text-brand-deepest hover:bg-action-primary-hover active:bg-action-primary-press cursor-pointer',
          )}
        >
          {isLoading ? (
            <span className="gap-space-2 inline-flex items-center justify-center">
              <Icon name="loading-arc" size={18} className="animate-spin" />
              {loadingLabel}
            </span>
          ) : (
            startLabel
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'min-h-touch-target rounded-radius-md border-border-strong px-space-6 py-space-3 text-body text-text-primary border font-semibold transition-colors',
            'hover:bg-bg-surface-sunken focus-visible:shadow-focus-ring focus-visible:outline-none',
          )}
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
