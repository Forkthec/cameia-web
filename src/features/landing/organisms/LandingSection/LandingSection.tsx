/**
 * Contenedor de cada sección de contenido de la landing (CM-329, `SPEC.md`
 * §3.7). Le da a cada sección su propio «momento»: en `lg` ocupa al menos
 * una pantalla, con el contenido centrado en vertical y como punto de encaje
 * del scroll (`snap-start`, activo solo mientras la landing está montada, ver
 * `useDocumentClass`). En `sm` la altura la da el contenido —las secciones
 * son más altas que la pantalla del teléfono— y el protagonismo lo dan los
 * revelados al hacer scroll.
 *
 * Expone `inView` a sus hijos (render prop) para que cada sección escalone
 * su propia entrada a partir de un solo `IntersectionObserver`.
 */
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useInView } from '../../hooks/useInView';

interface LandingSectionProps {
  /** `id` del título de la sección, para `aria-labelledby`. */
  labelledBy: string;
  /** `canvas` (por defecto) o `surface` para alternar el fondo entre secciones. */
  background?: 'canvas' | 'surface';
  /** Contenido; recibe `inView` para escalonar sus revelados. */
  children: (inView: boolean) => ReactNode;
}

export function LandingSection({
  labelledBy,
  background = 'canvas',
  children,
}: LandingSectionProps) {
  const { ref, inView } = useInView<HTMLElement>(0.15);

  return (
    <section
      ref={ref}
      aria-labelledby={labelledBy}
      className={cn(
        'py-space-8 lg:py-space-9 flex snap-start flex-col justify-center lg:min-h-svh',
        background === 'surface' && 'bg-bg-surface border-border-subtle border-y',
      )}
    >
      <div className="px-space-4 md:px-space-6 lg:px-space-8 mx-auto w-full max-w-[80rem]">
        {children(inView)}
      </div>
    </section>
  );
}
