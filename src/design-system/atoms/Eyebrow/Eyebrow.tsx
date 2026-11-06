/**
 * Rótulo corto en mayúsculas que va encima de un título (CM-329, dirección
 * «Amanecer»). Antes vivía copiado en el hero, en el encabezado de sección de
 * la landing y en el panel de `AuthLayout`; como átomo, cambiar su tipografía,
 * espaciado o color es editar un solo archivo (ADR-0001).
 *
 * Dos variantes:
 * - `tagline`: el lema de marca, en la tipografía del logo (`font-brand`), con
 *   el punto del sol delante.
 * - `section`: el índice de una sección (`01 · Módulos`), en la tipografía de
 *   la interfaz, con el número en mostaza.
 *
 * Sin texto propio (CLAUDE.md §14.7): la etiqueta y el número llegan por props.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EyebrowProps {
  /** `tagline` (lema con punto del sol) o `section` (índice numerado de sección). */
  variant?: 'tagline' | 'section';
  /** `default` sobre fondos claros; `inverse` sobre fondos de marca oscuros. */
  tone?: 'default' | 'inverse';
  /** Número de la sección, solo para `variant="section"`. Se muestra con dos dígitos. */
  index?: number;
  /** Texto del rótulo, ya traducido. */
  children: ReactNode;
  className?: string;
  /** Para escalonar su animación de entrada desde el organismo que lo usa. */
  style?: CSSProperties;
}

export function Eyebrow({
  variant = 'tagline',
  tone = 'default',
  index,
  children,
  className,
  style,
}: EyebrowProps) {
  const isTagline = variant === 'tagline';

  return (
    <p
      style={style}
      className={cn(
        'gap-space-3 flex items-center uppercase',
        isTagline
          ? 'font-brand text-small font-semibold tracking-[0.18em]'
          : 'text-small font-body font-bold tracking-[0.16em]',
        tone === 'inverse'
          ? 'text-text-accent-on-inverse'
          : isTagline
            ? 'text-brand-base'
            : 'text-brand-muted',
        className,
      )}
    >
      {isTagline ? (
        <span
          aria-hidden="true"
          className="bg-brand-accent size-2 shrink-0 rounded-full shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand-accent)_18%,transparent)]"
        />
      ) : index !== undefined ? (
        <span className="text-brand-accent-strong">{String(index).padStart(2, '0')}</span>
      ) : null}
      {children}
    </p>
  );
}
