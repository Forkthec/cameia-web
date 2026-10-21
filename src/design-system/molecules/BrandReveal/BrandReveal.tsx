/**
 * La firma animada de CAMEIA: el logo se arma —joroba, cuello y el sol que
 * sale detrás de la cabeza—, entra el wordmark letra por letra y aparece el
 * lema. Dura ~1,3 s. Nació en la intro de la landing (CM-329) y sube al
 * design system al tener un segundo uso: la pantalla «Iniciando sesión de
 * entrevista» (CM-213).
 *
 * Es decorativa (`aria-hidden`): quien la use anuncia lo que haga falta con
 * su propio texto. No conoce el dominio ni llama a `useTranslation`: el
 * wordmark y el lema entran por props (CLAUDE.md §14.7). Con
 * `prefers-reduced-motion` la regla global deja el logo armado y fijo.
 */
import { cn } from '@/utils/cn';
import { BrandMark } from '../../atoms/Logo';

interface BrandRevealProps {
  /** Nombre de la marca («cameia»), ya traducido. */
  wordmark: string;
  /** Lema de la marca, ya traducido. */
  tagline: string;
  /** Color de la unión del cuello: debe ser el del fondo sobre el que se pinta. */
  seamClassName?: string;
  className?: string;
}

export function BrandReveal({ wordmark, tagline, seamClassName, className }: BrandRevealProps) {
  const letters = wordmark.split('');
  return (
    <div aria-hidden="true" className={cn('gap-space-5 flex flex-col items-center', className)}>
      <BrandMark
        tone="inverse"
        className={cn('w-[min(12.5rem,42vw)]', seamClassName ?? '[--logo-seam:var(--brand-deep)]')}
        partClassNames={{
          hump: 'animate-rise-in [transform-box:fill-box] [transform-origin:bottom_left] [animation-delay:50ms]',
          neck: 'animate-rise-in [transform-box:fill-box] [transform-origin:bottom_center] [animation-delay:250ms]',
          sun: 'animate-sun-rise [transform-box:fill-box] [animation-delay:550ms]',
        }}
      />
      <span className="font-brand text-text-on-inverse text-display-sm lg:text-h1 flex font-bold tracking-[0.06em] uppercase">
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
      <span className="font-brand text-brand-accent-light animate-fade-in text-small tracking-[0.3em] uppercase [animation-delay:1050ms]">
        {tagline}
      </span>
    </div>
  );
}
