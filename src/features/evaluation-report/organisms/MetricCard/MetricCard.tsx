/**
 * Una métrica del reporte (CA-6.4.1, CA-6.4.2, CA-6.4.7): nombre con su «?», valor con su unidad
 * y, donde hay escala, la barra (`ProgressBar` del design system, que se lee con valor y unidad,
 * no solo la barra). Sin resultado: «Sin resultado» y su explicación visible, sin barra. Recibe
 * los textos ya traducidos y formateados; la página decide qué ayuda está abierta.
 */
import { ProgressBar } from '@/design-system/atoms/ProgressBar';
import { HelpTip } from '@/design-system/molecules/HelpTip';

interface MetricCardProps {
  /** Nombre de la métrica. */
  name: string;
  /** Texto de su «?». */
  help: string;
  /** Nombre accesible del «?» («Qué mide …»). */
  helpLabel: string;
  helpOpen: boolean;
  onHelpOpenChange: (open: boolean) => void;
  /** Número ya formateado (p. ej. «3,5») o `null` si no hay resultado. */
  value: string | null;
  /** Unidad tras el número (p. ej. «de 5»); vacía si el número ya la lleva («12,0 %»). */
  unit: string;
  /** Lectura completa para lectores de pantalla (p. ej. «3,5 de 5»). */
  valueText: string;
  /** Barra: escala y valor sin redondear; ausente si la métrica no tiene escala. */
  bar?: { value: number; min: number; max: number; startLabel: string; endLabel: string };
  /** «Sin resultado» y su explicación (CA-6.4.7). */
  noResultLabel: string;
  noResultHelp: string;
}

export function MetricCard({
  name,
  help,
  helpLabel,
  helpOpen,
  onHelpOpenChange,
  value,
  unit,
  valueText,
  bar,
  noResultLabel,
  noResultHelp,
}: MetricCardProps) {
  return (
    // Sin resultado la explicación va al lado de «Sin resultado»: la página pone estas tarjetas a
    // lo ancho, debajo de las que tienen valor.
    <article className="gap-space-3 border-border-subtle border-t-brand-accent bg-bg-surface p-space-5 shadow-elevation-1 flex flex-col rounded-xl border border-t-4">
      <div className="gap-space-2 flex items-start justify-between">
        <h3 className="text-body text-text-primary font-bold">{name}</h3>
        <HelpTip label={helpLabel} open={helpOpen} onOpenChange={onHelpOpenChange}>
          {help}
        </HelpTip>
      </div>

      {value === null ? (
        <div className="gap-x-space-6 gap-y-space-2 flex flex-col md:flex-row md:items-baseline">
          <p className="text-h3 text-text-muted font-display shrink-0 font-bold">{noResultLabel}</p>
          <p className="text-small text-text-muted max-w-[70ch]">{noResultHelp}</p>
        </div>
      ) : (
        <>
          <p className="gap-space-2 flex flex-wrap items-baseline" aria-label={valueText}>
            <span
              aria-hidden="true"
              className="text-h1 font-display text-text-primary font-extrabold tabular-nums"
            >
              {value}
            </span>
            {unit ? (
              <span aria-hidden="true" className="text-small text-text-muted">
                {unit}
              </span>
            ) : null}
          </p>
          {bar ? (
            <div className="gap-space-1 flex flex-col">
              <ProgressBar
                context="report-metric"
                tone="accent"
                value={bar.value}
                min={bar.min}
                max={bar.max}
                label={name}
                valueText={valueText}
              />
              <div aria-hidden="true" className="text-small text-text-muted flex justify-between">
                <span>{bar.startLabel}</span>
                <span>{bar.endLabel}</span>
              </div>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
