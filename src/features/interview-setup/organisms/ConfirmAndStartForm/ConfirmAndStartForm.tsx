/**
 * Paso final del wizard: resumen de configuracion y boton "Iniciar entrevista"
 * (PRT-04.11, HU-4.4). Muestra un resumen de las selecciones del usuario,
 * el boton con estado de carga (CA-4.4.17) y maneja el error generico
 * (CA-4.4.5) y el de perfil sincronizando (CA-4.4.19).
 *
 * **Presentación «Amanecer» y Atomic Design (CM-208).** Solo diseño, mismo
 * comportamiento:
 * - Los botones son el átomo `Button` (antes eran `<button>` escritos a
 *   mano): «Iniciar entrevista» `primary` con flecha y estado `loading` del
 *   átomo; «Atrás» `secondary`.
 * - Los avisos usan la molécula `AlertInline` (antes cajas a mano con clases
 *   que no existían en el tema, `bg-status-*`/`rounded-radius-*`).
 * - Cada fila del resumen lleva su ícono y, si se pasa `onEdit`, un botón
 *   «Cambiar» (`Button` `tertiary`) que vuelve al paso de ese dato.
 * - `title`/`subtitle` son opcionales: el asistente ya muestra el
 *   encabezado del paso con `WizardStepHeader`.
 */
import { Button } from '@/design-system/atoms/Button';
import { Icon, type IconName } from '@/design-system/icons/Icon';
import { AlertInline } from '@/design-system/molecules/AlertInline';

interface SummaryRow {
  label: string;
  value: string;
  /** Ícono del dato (decorativo). */
  icon?: IconName;
  /** Vuelve al paso donde se elige este dato. */
  onEdit?: () => void;
}

interface ConfirmAndStartFormProps {
  /** Título propio del bloque. Opcional: el asistente muestra su propio encabezado. */
  title?: string;
  /** Bajada propia del bloque. Opcional, igual que `title`. */
  subtitle?: string;
  rows: SummaryRow[];
  /** Texto del botón «Cambiar» de cada fila con `onEdit`. */
  editLabel?: string;
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
  editLabel,
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
      {title || subtitle ? (
        <div>
          {title ? <h2 className="text-h3 text-text-primary font-semibold">{title}</h2> : null}
          {subtitle ? <p className="text-body text-text-muted mt-space-1">{subtitle}</p> : null}
        </div>
      ) : null}

      <ul className="gap-space-3 grid md:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="border-border-subtle bg-bg-surface gap-space-3 p-space-4 flex items-center rounded-lg border"
          >
            {row.icon ? (
              <span
                aria-hidden="true"
                className="bg-brand-tint text-brand-base grid size-10 shrink-0 place-items-center rounded-md"
              >
                <Icon name={row.icon} size={20} />
              </span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-label text-text-muted uppercase">{row.label}</span>
              <span className="text-body text-text-primary font-semibold break-words">
                {row.value}
              </span>
            </span>
            {row.onEdit && editLabel ? (
              <Button
                variant="tertiary"
                size="md"
                onClick={row.onEdit}
                aria-label={`${editLabel}: ${row.label}`}
              >
                {editLabel}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {disabledMessage ? <AlertInline variant="warning">{disabledMessage}</AlertInline> : null}
      {errorMessage ? <AlertInline variant="error">{errorMessage}</AlertInline> : null}

      <div className="gap-space-3 flex flex-col sm:flex-row-reverse sm:justify-between">
        {isLoading ? (
          <Button size="lg" loading loadingLabel={loadingLabel} className="w-full sm:w-auto">
            {startLabel}
          </Button>
        ) : (
          <Button
            size="lg"
            icon={<Icon name="arrow-right" />}
            iconPosition="end"
            onClick={onStart}
            disabled={isDisabled}
            className="w-full sm:w-auto"
          >
            {startLabel}
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          icon={<Icon name="chevron-left" />}
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
