/**
 * Hero de la Landing pública (Figma `hero`, `SPEC.md` §3.1) en su versión
 * «Amanecer» (CM-329, §3.7). Conserva el copy, el CTA «Crear cuenta», «Es
 * gratis» y la tarjeta «Sesión de práctica» en dos columnas (`lg`) o una
 * (`sm`); lo que cambia es la jerarquía y la entrada:
 *
 * - El lema de marca como eyebrow, con el punto del sol.
 * - El título a `display-xl` en `lg`, palabra por palabra: cada una sube
 *   desde detrás de una máscara, escalonada 90 ms. Se parte por palabras y no
 *   por líneas fijas para que funcione igual en cualquier idioma y ancho.
 * - La última palabra («listo» / «ready») en índigo con un subrayado mostaza
 *   que sigue la curva de la joroba y se dibuja al final.
 * - Fondo con la forma de la joroba del logo en `brand-tint`.
 *
 * `entranceDelayMs` desplaza toda la secuencia para encadenarla con la intro
 * de marca: el hero ya está en el DOM (no hay espera para el LCP), solo
 * retrasa su animación.
 */
import { useTranslation } from 'react-i18next';
import { Button } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';
import { PracticeSessionCard } from '../PracticeSessionCard';

interface HeroSectionProps {
  /** Milisegundos a esperar antes de empezar la entrada (más largo si la intro está en pantalla). */
  entranceDelayMs: number;
  /** Navega al registro: el mismo destino que el CTA del header y del cierre. */
  onCreateAccount: () => void;
}

export function HeroSection({ entranceDelayMs, onCreateAccount }: HeroSectionProps) {
  const { t } = useTranslation('landing');
  const words = t('hero.titulo').split(' ');
  const delay = (offsetMs: number) => ({ animationDelay: `${entranceDelayMs + offsetMs}ms` });

  return (
    <section className="py-space-8 lg:py-space-9 relative flex snap-start items-center overflow-x-clip lg:min-h-[calc(100svh-4.5rem)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 800 520"
        className="animate-fade-in pointer-events-none absolute -top-[2%] -right-[40%] w-[120%] opacity-60 lg:-top-[6%] lg:-right-[8%] lg:w-[68%] lg:max-w-[56rem] lg:opacity-100"
        style={delay(100)}
      >
        <path
          d="M40 520 C -10 300, 200 40, 470 30 C 640 24, 740 150, 760 300 C 600 230, 300 290, 40 520 Z"
          className="fill-brand-tint"
        />
      </svg>

      <div className="gap-space-8 px-space-4 md:px-space-6 lg:px-space-8 relative mx-auto grid w-full max-w-[80rem] items-center lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="flex flex-col items-start">
          <p
            className="animate-enter-up font-brand text-small text-brand-base mb-space-5 gap-space-3 inline-flex items-center font-semibold tracking-[0.18em] uppercase"
            style={delay(0)}
          >
            <span
              aria-hidden="true"
              className="bg-brand-accent size-[9px] rounded-full shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-accent)_18%,transparent)]"
            />
            {t('marca.lema')}
          </p>

          {/* `aria-label` con la frase completa: partida en palabras animadas, el
              cálculo del nombre accesible pierde los espacios entre ellas
              («Entraalaentrevistalisto»). */}
          <h1
            aria-label={t('hero.titulo')}
            className="text-display lg:text-display-xl font-display text-brand-deep"
          >
            {words.map((word, index) => {
              const isLast = index === words.length - 1;
              return (
                <span key={`${word}-${index}`} aria-hidden="true">
                  <span className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <span
                      className={
                        isLast
                          ? 'animate-mask-rise text-brand-base relative inline-block'
                          : 'animate-mask-rise inline-block'
                      }
                      style={delay(50 + index * 90)}
                    >
                      {word}
                      {isLast ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 200 18"
                          preserveAspectRatio="none"
                          className="absolute -bottom-[0.1em] -left-[2%] h-[0.3em] w-[104%] overflow-visible"
                        >
                          <path
                            d="M4 14 C 50 2, 130 0, 196 10"
                            pathLength={1}
                            strokeDasharray="1"
                            className="stroke-brand-accent animate-draw-line fill-none [stroke-width:9] [stroke-linecap:round]"
                            style={delay(words.length * 90 + 450)}
                          />
                        </svg>
                      ) : null}
                    </span>
                  </span>
                  {isLast ? null : ' '}
                </span>
              );
            })}
          </h1>

          <p
            className="animate-enter-up text-body lg:text-h3 text-text-muted mt-space-5 mb-space-6 max-w-[34em] lg:font-normal"
            style={delay(380)}
          >
            {t('hero.subtitulo')}
          </p>

          <div
            className="animate-enter-up gap-space-4 flex flex-wrap items-center"
            style={delay(480)}
          >
            <Button
              variant="primary"
              size="lg"
              icon={<Icon name="arrow-right" />}
              className="hover:shadow-elevation-2 flex-row-reverse transition-[background-color,translate,scale,box-shadow] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] [&>svg]:transition-[translate] [&>svg]:duration-[var(--duration-smooth)] hover:[&>svg]:translate-x-1"
              onClick={onCreateAccount}
            >
              {t('cta.crearCuenta')}
            </Button>
            <span className="text-small text-text-muted gap-space-2 inline-flex items-center">
              <Icon name="check-circle" size={18} className="text-success-base" />
              {t('hero.esGratis')}
            </span>
          </div>
        </div>

        <PracticeSessionCard entranceDelayMs={entranceDelayMs} />
      </div>
    </section>
  );
}
