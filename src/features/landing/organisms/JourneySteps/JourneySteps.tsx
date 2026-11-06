/**
 * «Cómo funciona» en tres pasos: Practica. Mejora. Avanza. (CM-329,
 * `SPEC.md` §3.7). Es la única sección nueva respecto a Figma: convierte el
 * lema del logo en el hilo del recorrido y prepara el amanecer del cierre.
 * Los textos de cada paso salen del copy ya existente de la landing (modos,
 * retroalimentación, «con confianza»); no promete nada que la app no haga.
 *
 * Cuando la sección entra en pantalla, el sol recorre la curva de la joroba
 * de izquierda a derecha y cada paso se ilumina a su paso. El sol se mueve con
 * `transform` (una capa del ancho del riel que se desliza), no con `left`,
 * para no forzar layout en cada fotograma.
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { SectionHeader } from '../SectionHeader';

const STEPS = ['practica', 'mejora', 'avanza'] as const;
const TRAVEL_MS = 1800;

interface JourneyStepsProps {
  /** Posición de la sección en el recorrido de la página, para su índice. */
  index: number;
  /** `id` del título, para el `aria-labelledby` de la sección. */
  titleId: string;
  /** Si la sección ya entró en pantalla. */
  inView: boolean;
}

export function JourneySteps({ index, titleId, inView }: JourneyStepsProps) {
  const { t } = useTranslation('landing');

  return (
    <>
      <SectionHeader
        index={index}
        label={t('pasos.etiqueta')}
        title={t('pasos.titulo')}
        titleId={titleId}
        inView={inView}
      />

      <div aria-hidden="true" className="mb-space-6 relative hidden h-14 lg:block">
        <svg
          viewBox="0 0 1200 56"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <path
            d="M0 46 C 300 6, 900 6, 1200 46"
            className="stroke-brand-soft fill-none [stroke-width:3] [stroke-dasharray:2_10] [stroke-linecap:round]"
          />
        </svg>
        <div
          className={cn(
            'absolute inset-0 transition-[translate] ease-[var(--token-ease-inout)]',
            inView ? 'translate-x-0' : '-translate-x-full',
          )}
          style={{ transitionDuration: `${TRAVEL_MS}ms`, transitionDelay: '300ms' }}
        >
          <span className="bg-brand-accent absolute top-1/2 -right-3.5 size-7 -translate-y-1/2 rounded-full shadow-[0_0_0_8px_color-mix(in_srgb,var(--brand-accent)_18%,transparent),0_0_40px_10px_color-mix(in_srgb,var(--brand-accent)_35%,transparent)]" />
        </div>
      </div>

      <ol className="gap-space-6 grid md:grid-cols-3">
        {STEPS.map((step, stepIndex) => (
          <li
            key={step}
            className={cn(
              'transition-[opacity,translate] duration-[var(--duration-cinematic)] ease-[var(--token-ease-expo)]',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-25',
            )}
            style={{ transitionDelay: `${300 + (stepIndex * TRAVEL_MS) / STEPS.length}ms` }}
          >
            <p className="text-small text-brand-muted mb-space-3 font-semibold tracking-[0.14em] uppercase">
              {t('pasos.numero', { numero: stepIndex + 1 })}
            </p>
            <h3 className="text-h1 lg:text-display font-display text-brand-deep mb-space-4 gap-space-1 flex items-end">
              {t(`pasos.${step}.titulo`)}
              <span
                aria-hidden="true"
                className="bg-brand-accent-strong mb-[0.18em] size-[0.16em] shrink-0 rounded-full"
              />
            </h3>
            <p className="text-body lg:text-h3 text-text-muted max-w-[22em] lg:font-normal">
              {t(`pasos.${step}.descripcion`)}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
