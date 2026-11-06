/**
 * Tarjeta de modo de la landing, Entreno o Simulación (CM-329, `SPEC.md`
 * §3.7). Reemplaza a las dos `FeatureCard` idénticas de esa sección: con el
 * mismo ícono y la misma forma, la diferencia entre modos solo se leía en el
 * texto. Ahora cada una lleva una etiqueta corta y una línea de tiempo que
 * dibuja el comportamiento que ya describe su copy:
 *
 * - `ENTRENO`: cuatro respuestas, cada una seguida de un rombo mostaza
 *   (retroalimentación después de cada respuesta).
 * - `SIMULACION`: una barra continua que se llena sin cortes y termina en la
 *   evaluación (sin pausas, evaluación completa al final).
 *
 * La línea de tiempo es ilustrativa (`aria-hidden`): no representa un número
 * real de preguntas (CLAUDE.md §3.7), y el contenido accesible es el título,
 * la etiqueta y la descripción. Sigue sin `role` interactivo, como
 * `FeatureCard`. `mode` usa los códigos del glosario (`GLOSSARY` §5).
 */
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

const PRACTICE_SEGMENTS = 4;

interface ModeCardProps {
  /** Modo que ilustra: decide la forma de la línea de tiempo. */
  mode: 'ENTRENO' | 'SIMULACION';
  title: string;
  /** Etiqueta corta del modo («A tu ritmo» / «Como la real»). */
  tag: string;
  description: string;
  /** Texto bajo el inicio de la línea de tiempo. */
  timelineStart: string;
  /** Texto bajo el final de la línea de tiempo (en mostaza). */
  timelineEnd: string;
  /** Si su sección ya entró en pantalla: dispara la entrada y el llenado de la línea. */
  inView: boolean;
  /** Retraso de la entrada, para escalonar las dos tarjetas. */
  entranceDelayMs?: number;
}

export function ModeCard({
  mode,
  title,
  tag,
  description,
  timelineStart,
  timelineEnd,
  inView,
  entranceDelayMs = 0,
}: ModeCardProps) {
  const fillDelay = { transitionDelay: `${entranceDelayMs + 350}ms` };

  return (
    <div
      className={cn(
        'border-border-subtle bg-bg-canvas gap-space-4 p-space-5 lg:p-space-7 flex flex-col rounded-xl border',
        'hover:shadow-elevation-2 transition-[translate,box-shadow] duration-[var(--duration-deliberate)] ease-[var(--token-ease-expo)] hover:-translate-y-1',
        inView ? 'animate-enter-up' : 'opacity-0',
      )}
      style={{ animationDelay: `${entranceDelayMs}ms` }}
    >
      <div className="gap-space-3 flex flex-wrap items-center">
        <Icon name="check-circle" size={30} className="text-brand-base" />
        <h3 className="text-h2 font-display text-brand-deep">{title}</h3>
        <span
          className={cn(
            'text-label px-space-3 py-space-2 ml-auto rounded-full uppercase',
            mode === 'ENTRENO'
              ? 'bg-brand-tint text-brand-base'
              : 'bg-bg-inverse text-text-on-inverse',
          )}
        >
          {tag}
        </span>
      </div>
      <p className="text-body text-text-muted lg:text-h3 lg:font-normal">{description}</p>

      <div
        aria-hidden="true"
        className="mt-space-3 bg-bg-surface border-border-subtle px-space-5 pt-space-5 pb-space-4 rounded-lg border"
      >
        {mode === 'ENTRENO' ? (
          <div className="gap-space-1 flex items-center">
            {Array.from({ length: PRACTICE_SEGMENTS }, (_, segment) => (
              <div key={segment} className="gap-space-1 flex flex-1 items-center">
                <div className="bg-brand-base h-2.5 flex-1 rounded-full" />
                <div
                  className={cn(
                    'bg-brand-accent mx-space-2 size-3.5 shrink-0 rotate-45 rounded-[4px] transition-[scale] duration-[var(--duration-deliberate)] ease-[var(--token-ease-expo)]',
                    inView ? 'scale-100' : 'scale-0',
                  )}
                  style={{ transitionDelay: `${entranceDelayMs + 400 + segment * 160}ms` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center">
            <div className="bg-brand-soft relative h-2.5 flex-1 overflow-hidden rounded-full">
              <div
                className={cn(
                  'bg-brand-base absolute inset-0 origin-left rounded-full transition-[scale] duration-[1400ms] ease-[var(--token-ease-out)]',
                  inView ? 'scale-x-100' : 'scale-x-0',
                )}
                style={fillDelay}
              />
            </div>
            <span className="bg-brand-accent text-action-on-primary ml-space-2 grid size-6.5 shrink-0 place-items-center rounded-full">
              <Icon name="check-circle" size={14} />
            </span>
          </div>
        )}
        <div className="mt-space-3 gap-space-3 text-small text-text-muted flex justify-between">
          <span>{timelineStart}</span>
          <span className="text-brand-base font-semibold">{timelineEnd}</span>
        </div>
      </div>
    </div>
  );
}
