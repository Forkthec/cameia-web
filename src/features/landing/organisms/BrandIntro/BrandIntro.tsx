/**
 * Intro de marca de la landing (CM-329, `SPEC.md` §3.7): sobre índigo
 * profundo, el logo se arma —joroba, cuello y el sol que sale detrás de la
 * cabeza—, aparecen el wordmark y el lema, y un telón se recoge hacia arriba
 * para descubrir el hero, que ya está pintado debajo.
 *
 * Dura ~2.1 s y nunca bloquea: el contenido real se renderiza detrás desde el
 * primer instante, el botón «Saltar intro» la retira de inmediato y
 * `useBrandIntro` decide si se muestra (una vez por sesión, nunca con
 * `prefers-reduced-motion`). Este componente solo dibuja la secuencia.
 *
 * Es decorativa para tecnologías de asistencia: el logo y el lema se marcan
 * `aria-hidden` porque el header ya anuncia la marca; solo el botón de saltar
 * es interactivo.
 */
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/design-system/atoms/Logo';

interface BrandIntroProps {
  /** Retira la intro de inmediato. */
  onSkip: () => void;
}

export function BrandIntro({ onSkip }: BrandIntroProps) {
  const { t } = useTranslation(['landing', 'common']);
  const letters = t('common:marca.nombre').split('');

  return (
    <div
      data-testid="brand-intro"
      className="bg-brand-deep gap-space-5 animate-curtain-up fixed inset-0 z-50 flex flex-col items-center justify-center [animation-delay:1450ms]"
    >
      <BrandMark
        tone="inverse"
        className="w-[min(12.5rem,42vw)] [--logo-seam:var(--brand-deep)]"
        partClassNames={{
          hump: 'animate-rise-in [transform-box:fill-box] [transform-origin:bottom_left] [animation-delay:50ms]',
          neck: 'animate-rise-in [transform-box:fill-box] [transform-origin:bottom_center] [animation-delay:250ms]',
          sun: 'animate-sun-rise [transform-box:fill-box] [animation-delay:550ms]',
        }}
      />
      <span
        aria-hidden="true"
        className="font-brand text-text-on-inverse flex text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-[0.06em] uppercase"
      >
        {letters.map((letter, index) => (
          <span
            // Las letras del wordmark pueden repetirse; la posición las distingue.
            key={`${letter}-${index}`}
            className="animate-enter-up inline-block"
            style={{ animationDelay: `${800 + index * 50}ms` }}
          >
            {letter}
          </span>
        ))}
      </span>
      <span
        aria-hidden="true"
        className="font-brand text-brand-accent-light animate-fade-in text-small tracking-[0.3em] uppercase [animation-delay:1050ms]"
      >
        {t('common:marca.lema')}
      </span>
      <button
        type="button"
        onClick={onSkip}
        className="right-space-5 bottom-space-5 text-small text-text-on-inverse/80 hover:text-text-on-inverse min-h-touch-target px-space-4 focus-visible:shadow-focus-ring absolute cursor-pointer rounded-full border border-current/30 font-semibold transition-colors hover:border-current focus-visible:outline-none"
      >
        {t('landing:intro.saltar')}
      </button>
    </div>
  );
}
