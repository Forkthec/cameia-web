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
 * es interactivo. La secuencia del logo es la molécula `BrandReveal`, que
 * también usa la pantalla «Iniciando sesión de entrevista» (CM-213).
 */
import { useTranslation } from 'react-i18next';
import { BrandReveal } from '@/design-system/molecules/BrandReveal';

interface BrandIntroProps {
  /** Retira la intro de inmediato. */
  onSkip: () => void;
}

export function BrandIntro({ onSkip }: BrandIntroProps) {
  const { t } = useTranslation(['landing', 'common']);
  return (
    <div
      data-testid="brand-intro"
      className="bg-brand-deep animate-curtain-up fixed inset-0 z-50 flex flex-col items-center justify-center [animation-delay:1450ms]"
    >
      <BrandReveal wordmark={t('common:marca.nombre')} tagline={t('common:marca.lema')} />
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
