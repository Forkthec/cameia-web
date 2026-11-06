/**
 * Marca de Cameia: glifo + wordmark (componente "logo" de Figma, nodo
 * `14:102`). Construye las dos variantes que la app consume hoy —`lockup`
 * (glifo + wordmark) y `mark-only` (glifo aislado, marca de agua del panel de
 * marca de `AuthLayout`)—; las demás se agregan cuando otra pantalla las
 * necesite (CLAUDE.md §4).
 *
 * **Logo «Amanecer» (CM-329).** El glifo es {@link BrandMark} (camello
 * abstracto con sol) y el wordmark va en Montserrat, en mayúsculas por CSS,
 * tal como la hoja de marca aprobada. Montserrat es tipografía *del logo*
 * (`--font-brand`), no de la interfaz: el resto de la app sigue en
 * Bricolage Grotesque + Source Sans 3. El texto del wordmark sigue llegando
 * en minúsculas por `wordmarkLabel` (`common:marca.nombre`); las mayúsculas
 * son presentación, así que el nombre accesible no cambia.
 *
 * Los tamaños del glifo y del wordmark son una excepción documentada a
 * CLAUDE.md §6: son la proporción intrínseca del lockup, no un paso de la
 * escala tipográfica general (mismo criterio que los 52/34px de `Button`,
 * §17). El lockup anterior medía 9.2px de wordmark, ilegible en el header;
 * con la nueva marca se agranda a una proporción legible.
 *
 * `size="sm"` es la variante del pie de página, un escalón más chica que la
 * del header (CM-186, `features/landing/SPEC.md` §3.6).
 */
import { cn } from '@/utils/cn';
import { BrandMark } from './BrandMark';

interface LogoProps {
  /** `mark-only` es solo el glifo, sin wordmark — pensado para la marca de agua a tamaño grande. */
  variant?: 'lockup' | 'mark-only';
  /** `inverse` para fondos de marca oscuros; `default` para fondos claros. */
  tone?: 'default' | 'inverse';
  /** `default` = tamaño de header. `sm` = tamaño de pie de página. */
  size?: 'default' | 'sm';
  /** Texto del wordmark ("cameia"). Obligatorio, sin valor por defecto: el design system nunca llama a `useTranslation` (CLAUDE.md §14.7), ni siquiera para el nombre de la marca. Ignorado cuando `variant="mark-only"`. */
  wordmarkLabel: string;
  className?: string;
}

export function Logo({
  variant = 'lockup',
  tone = 'default',
  size = 'default',
  wordmarkLabel,
  className,
}: LogoProps) {
  if (variant === 'mark-only') {
    return <BrandMark tone={tone} withSun={false} className={cn('h-auto w-full', className)} />;
  }

  return (
    <div className={cn('group/logo gap-space-2 flex items-center', className)}>
      <BrandMark
        tone={tone}
        partClassNames={{
          sun: 'transition-[translate] duration-[var(--duration-deliberate)] ease-[var(--token-ease-expo)] [transform-box:fill-box] group-hover/logo:-translate-y-[6%]',
        }}
        className={cn('w-auto shrink-0', size === 'sm' ? 'h-6' : 'h-8')}
      />
      <span
        className={cn(
          'font-brand font-bold tracking-[0.02em] uppercase',
          size === 'sm' ? 'text-[0.9375rem]' : 'text-[1.1875rem]',
          tone === 'inverse' ? 'text-text-on-inverse' : 'text-brand-base',
        )}
      >
        {wordmarkLabel}
      </span>
    </div>
  );
}
