/**
 * Tarjeta visual del hero, «Sesión de práctica» (Figma `tarjeta-sesion-visual`,
 * `SPEC.md` §3.1), en su versión «Amanecer» (CM-329, §3.7): en vez de un
 * rectángulo estático, *muestra* lo que el copy promete —el entrevistador
 * escucha y responde en tiempo real— con una onda de voz que late, un
 * indicador «Tiempo real» y las dos formas de responder.
 *
 * Todo lo animado es decorativo (`aria-hidden`): el contenido accesible es
 * el mismo título y la misma descripción de siempre. Los chips no son
 * controles y no seleccionan nada; «Texto» va resaltado porque es la forma
 * de respuesta preseleccionada en la app (decisiones/11092026 D-04). Con
 * `prefers-reduced-motion`, la regla global de `index.css` deja la onda
 * quieta en una forma estática, como pide CLAUDE.md §10.
 *
 * Detrás de la tarjeta sale el «sol» del logo (con parallax donde el
 * navegador soporta animaciones ligadas al scroll), y sobre su esquina flota
 * un chip de «Retroalimentación estructurada», el otro beneficio clave.
 */
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/design-system/atoms/Logo';
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

/** Alturas relativas de la onda: una silueta de voz, no un dato. */
const WAVE_HEIGHTS = [
  38, 62, 48, 80, 55, 92, 70, 44, 66, 100, 74, 52, 86, 60, 40, 72, 95, 58, 46, 82, 64, 50, 90, 68,
  42, 76, 56, 34,
];

interface PracticeSessionCardProps {
  /** Milisegundos a esperar antes de entrar: coordina la tarjeta con la intro y el título del hero. */
  entranceDelayMs: number;
}

export function PracticeSessionCard({ entranceDelayMs }: PracticeSessionCardProps) {
  const { t } = useTranslation('landing');
  const delay = (offsetMs: number) => ({ animationDelay: `${entranceDelayMs + offsetMs}ms` });

  return (
    <div className="relative">
      <div aria-hidden="true" className="scroll-parallax pointer-events-none absolute inset-0">
        <div
          className="animate-sun-rise absolute -top-[30%] -right-[20%] aspect-square w-[80%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--brand-accent)_28%,transparent),transparent_65%)]"
          style={delay(450)}
        />
        <div
          className="animate-sun-rise absolute -top-[14%] -right-[6%] aspect-square w-[38%] rounded-full bg-[radial-gradient(circle_at_40%_40%,var(--brand-accent-light),var(--brand-accent)_60%,var(--brand-accent-strong))] lg:w-[46%]"
          style={delay(450)}
        />
      </div>

      <article
        className="animate-card-in p-space-5 pb-space-8 lg:p-space-6 lg:pb-space-8 shadow-elevation-3 relative overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_85%_0%,var(--brand-raised)_0%,var(--brand-deep)_55%,var(--brand-deepest)_100%)] transition-[translate,rotate] duration-[var(--duration-deliberate)] ease-[var(--token-ease-expo)] hover:-translate-y-1 hover:-rotate-[0.4deg]"
        style={delay(200)}
      >
        <div className="gap-space-3 flex items-center justify-between">
          <div className="gap-space-3 flex items-center">
            <span
              aria-hidden="true"
              className="text-brand-accent relative grid size-13 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)]"
            >
              <Icon name="microphone" size={28} />
              <span
                className="border-brand-accent animate-pulse-ring absolute inset-0 rounded-lg border-[1.5px]"
                style={delay(1000)}
              />
            </span>
            <h2 className="text-h3 font-body text-text-on-inverse">{t('hero.tarjeta.titulo')}</h2>
          </div>
          <span
            aria-hidden="true"
            className="text-label text-text-accent-on-inverse gap-space-2 px-space-3 py-space-2 hidden shrink-0 items-center rounded-full bg-[color-mix(in_srgb,var(--text-on-inverse)_8%,transparent)] whitespace-nowrap uppercase md:inline-flex"
          >
            <span className="bg-brand-accent animate-blink size-[7px] rounded-full" />
            {t('hero.tarjeta.tiempoReal')}
          </span>
        </div>

        <div aria-hidden="true" className="my-space-6 gap-space-1 flex h-21 items-center">
          {WAVE_HEIGHTS.map((height, index) => (
            <span
              // La posición de cada barra es su identidad: la lista es fija.
              key={`${height}-${index}`}
              className={cn(
                'animate-wave min-w-[3px] flex-1 rounded-full',
                index % 3 === 2 ? 'bg-brand-soft' : 'bg-brand-accent',
              )}
              style={{
                height: `${height}%`,
                animationDelay: `${entranceDelayMs - ((index * 90) % 1250)}ms`,
              }}
            />
          ))}
        </div>

        <div aria-hidden="true" className="mb-space-4 gap-space-2 flex">
          <span className="text-small text-brand-deep bg-text-on-inverse px-space-3 py-space-2 rounded-full font-semibold">
            {t('hero.tarjeta.texto')}
          </span>
          <span className="text-small text-text-on-inverse/80 px-space-3 py-space-2 rounded-full border border-current/25 font-semibold">
            {t('hero.tarjeta.voz')}
          </span>
        </div>

        <p className="text-body text-text-on-inverse/85 max-w-[30em]">
          {t('hero.tarjeta.descripcion')}
        </p>

        <BrandMark
          tone="inverse"
          withSun={false}
          className="pointer-events-none absolute -right-8 -bottom-10 w-52 opacity-[0.07]"
        />
      </article>

      <div
        aria-hidden="true"
        className="animate-enter-up -bottom-space-5 left-space-3 md:-left-space-6 absolute z-10"
        style={delay(900)}
      >
        <div
          className="animate-float bg-bg-surface gap-space-3 py-space-3 pr-space-4 pl-space-3 shadow-elevation-3 flex items-center rounded-lg"
          style={delay(1800)}
        >
          <span className="bg-brand-accent text-action-on-primary grid size-10 shrink-0 place-items-center rounded-md">
            <Icon name="chart" size={20} />
          </span>
          <span className="flex flex-col">
            <span className="text-small text-text-primary font-bold">
              {t('modulos.retroalimentacion.titulo')}
            </span>
            <span className="text-small text-text-muted">{t('hero.detalleRetroalimentacion')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
