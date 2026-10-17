/**
 * Banner de cierre de la landing (Figma, banner oscuro, `SPEC.md` §3.1) en su
 * versión «Amanecer» (CM-329, §3.7): el final del recorrido. Mismo título y
 * mismo CTA «Crear cuenta»; cambia el escenario:
 *
 * - Fondo `brand-deep` (índigo de marca) en vez del neutro `bg-inverse`.
 * - Borde superior con la curva de la joroba, que funde con la sección
 *   anterior en lugar de cortarla en recto.
 * - Un resplandor de sol que sube detrás del CTA y el logo blanco cuyo sol se
 *   eleva cuando el banner entra en pantalla: la firma visual de la página.
 * - El lema de marca debajo del CTA.
 */
import { useTranslation } from 'react-i18next';
import { Button } from '@/design-system/atoms/Button';
import { BrandMark } from '@/design-system/atoms/Logo';
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';
import { useInView } from '../../hooks/useInView';

interface ClosingBannerProps {
  /** Navega al registro. */
  onCreateAccount: () => void;
}

export function ClosingBanner({ onCreateAccount }: ClosingBannerProps) {
  const { t } = useTranslation(['landing', 'common']);
  const { ref, inView } = useInView<HTMLElement>(0.3);
  const enter = (delayMs: number) => ({
    className: inView ? 'animate-enter-up' : 'opacity-0',
    style: { animationDelay: `${delayMs}ms` },
  });

  return (
    <section
      ref={ref}
      aria-labelledby="landing-cierre-titulo"
      className="bg-brand-deep pt-space-9 pb-space-8 lg:pb-space-9 relative flex snap-start flex-col justify-center overflow-hidden lg:min-h-[calc(100svh-4.5rem)]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="absolute -top-px left-0 h-[clamp(2.5rem,6vw,5.625rem)] w-full"
      >
        <path d="M0 0 H1440 V40 C 1100 6, 760 96, 0 64 Z" className="fill-bg-canvas" />
      </svg>

      <div
        aria-hidden="true"
        className={cn(
          'absolute -bottom-[38%] left-1/2 aspect-square w-[min(45rem,90vw)] -translate-x-1/2 rounded-full transition-[opacity,translate] duration-[1600ms] ease-[var(--token-ease-expo)]',
          'bg-[radial-gradient(circle,color-mix(in_srgb,var(--brand-accent)_55%,transparent),color-mix(in_srgb,var(--brand-accent)_12%,transparent)_45%,transparent_68%)]',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-[30%] opacity-0',
        )}
      />

      <div className="px-space-4 gap-space-6 relative mx-auto flex w-full max-w-[80rem] flex-col items-center text-center">
        <BrandMark
          tone="inverse"
          className={cn('w-24 [--logo-seam:var(--brand-deep)]', enter(0).className)}
          partClassNames={{
            sun: cn(
              '[transform-box:fill-box] transition-[translate,opacity] duration-[1400ms] ease-[var(--token-ease-expo)] delay-300',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-[160%] opacity-0',
            ),
          }}
        />
        <h2
          id="landing-cierre-titulo"
          className={cn(
            'text-display font-display text-text-on-inverse max-w-[14em]',
            enter(150).className,
          )}
          style={enter(150).style}
        >
          {t('cierre.titulo')}
        </h2>
        <div className={enter(300).className} style={enter(300).style}>
          <Button
            variant="primary"
            size="lg"
            icon={<Icon name="arrow-right" />}
            className="hover:shadow-elevation-3 w-full flex-row-reverse transition-[background-color,translate,scale,box-shadow] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] lg:w-auto [&>svg]:transition-[translate] [&>svg]:duration-[var(--duration-smooth)] hover:[&>svg]:translate-x-1"
            onClick={onCreateAccount}
          >
            {t('cta.crearCuenta')}
          </Button>
        </div>
        <p
          className={cn(
            'font-brand text-small text-brand-accent-light font-semibold tracking-[0.32em] uppercase',
            enter(450).className,
          )}
          style={enter(450).style}
        >
          {t('common:marca.lema')}
        </p>
      </div>
    </section>
  );
}
