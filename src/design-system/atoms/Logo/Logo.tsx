/**
 * Marca de Cameia (Figma, componente "logo", nodo `14:102`). Ese componente
 * define 6 variantes (`lockup/*`, `mark/only`, `avatar/square`); este átomo
 * solo construye las dos que `AuthLayout`/Login necesitan hoy — `lockup`
 * (glifo + wordmark "cameia") y `mark-only` (glifo aislado, para la marca de
 * agua del panel de marca). Las demás se agregan cuando otra pantalla las
 * necesite (CLAUDE.md §4, regla de crecimiento: no se construye por
 * adelantado lo que nadie consume todavía).
 *
 * El glifo cambia de asset según `tone`, no de color en tiempo real: Figma
 * exporta una versión blanca (`inverse`, para el panel oscuro) y una navy
 * (`default`, para fondos claros) ya resueltas — el propio componente de
 * Figma "se rebinda al color del fondo" en el archivo de diseño, no vía
 * `currentColor` en el SVG exportado, así que aquí son dos assets, no uno
 * recoloreado.
 *
 * El tamaño del wordmark (`text-[9.2px]`) es una excepción documentada a
 * CLAUDE.md §6: no existe (ni debe existir) un token de la escala tipográfica
 * general para el tamaño del texto de un lockup de marca — es una proporción
 * intrínseca del propio componente "logo" de Figma, del mismo tipo que los
 * 52/34px de `Button` ya trackeados como excepción en CLAUDE.md §17, no un
 * valor inventado para esta pantalla.
 */
import GlyphDefault from './glyph-default.svg?react';
import GlyphInverse from './glyph-inverse.svg?react';
import { cn } from '@/utils/cn';

interface LogoProps {
  /** `mark-only` es solo el glifo, sin wordmark — pensado para la marca de agua a tamaño grande. */
  variant?: 'lockup' | 'mark-only';
  /** `inverse` para fondos oscuros (panel de marca); `default` para fondos claros. */
  tone?: 'default' | 'inverse';
  /** Texto del wordmark ("cameia"). Obligatorio, sin valor por defecto: el design system nunca llama a `useTranslation` (CLAUDE.md §14.7), ni siquiera para el nombre de la marca. Ignorado cuando `variant="mark-only"`. */
  wordmarkLabel: string;
  className?: string;
}

export function Logo({
  variant = 'lockup',
  tone = 'default',
  wordmarkLabel,
  className,
}: LogoProps) {
  const Glyph = tone === 'inverse' ? GlyphInverse : GlyphDefault;

  if (variant === 'mark-only') {
    return <Glyph aria-hidden="true" className={cn('h-auto w-full', className)} />;
  }

  return (
    <div className={cn('gap-space-2 flex items-center', className)}>
      <Glyph aria-hidden="true" className="h-5 w-auto shrink-0" />
      <span
        className={cn(
          'font-display text-[9.2px] font-extrabold tracking-tight',
          tone === 'inverse' ? 'text-text-on-inverse' : 'text-text-primary',
        )}
      >
        {wordmarkLabel}
      </span>
    </div>
  );
}
