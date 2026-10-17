/**
 * Encabezado de sección de la landing (CM-329, `SPEC.md` §3.7): un índice
 * numerado (`01 · Módulos`) sobre el título. El índice da ritmo de lectura y
 * deja claro que la página es un recorrido con orden, no una lista de
 * bloques sueltos. El título usa `h2-sm`/`h2` como en Figma, un escalón más
 * grande en `lg` para que cada sección tenga protagonismo propio.
 */
import { cn } from '@/utils/cn';

interface SectionHeaderProps {
  /** Posición de la sección en el recorrido (1, 2, 3…). Se muestra con dos dígitos. */
  index: number;
  /** Nombre corto de la sección (`landing:modulos.etiqueta`). */
  label: string;
  /** Título de la sección. */
  title: string;
  /** `id` del título, para el `aria-labelledby` de la sección. */
  titleId: string;
  /** Si la sección ya entró en pantalla: dispara la entrada del encabezado. */
  inView: boolean;
}

export function SectionHeader({ index, label, title, titleId, inView }: SectionHeaderProps) {
  return (
    <div className={cn('mb-space-6 lg:mb-space-8', inView ? 'animate-enter-up' : 'opacity-0')}>
      <p className="text-small text-brand-muted mb-space-4 gap-space-3 flex items-center font-bold tracking-[0.16em] uppercase">
        <span className="text-brand-accent-strong">{String(index).padStart(2, '0')}</span>
        {label}
      </p>
      <h2 id={titleId} className="text-h2-sm lg:text-h1 font-display text-brand-deep max-w-[18em]">
        {title}
      </h2>
    </div>
  );
}
