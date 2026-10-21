/**
 * Orbe de marca: el sol del logo con el camello dentro, que cambia según lo
 * que esté pasando. Es decorativo (`aria-hidden`): quien lo use debe anunciar
 * el estado con texto propio (CLAUDE.md §10), porque el orbe no lleva texto.
 *
 * Estados:
 * - `idle`: dos anillos que se expanden despacio.
 * - `processing`: un arco que gira alrededor del sol.
 * - `recording`: el sol pasa a rojo y unas barras laten debajo.
 * - `error`: el sol se apaga (sin movimiento).
 * - `complete`: el sol crece y brilla más.
 *
 * No conoce el dominio: no sabe qué es una entrevista. Con
 * `prefers-reduced-motion` la regla global de `index.css` detiene las
 * animaciones y el orbe queda como una imagen fija.
 */
import { cn } from '@/utils/cn';
import { BrandMark } from '../../atoms/Logo';

export type BrandOrbState = 'idle' | 'processing' | 'recording' | 'error' | 'complete';

interface BrandOrbProps {
  /** Qué está pasando. */
  state: BrandOrbState;
  /** `sm` para pantallas compactas; `md` por defecto. */
  size?: 'sm' | 'md';
  className?: string;
}

const WAVE_DELAYS_MS = [0, 150, 300, 450, 600];

export function BrandOrb({ state, size = 'md', className }: BrandOrbProps) {
  const isRecording = state === 'recording';
  return (
    <div
      aria-hidden="true"
      data-state={state}
      className={cn(
        'relative grid shrink-0 place-items-center transition-[scale] duration-[var(--duration-cinematic)] ease-[var(--token-ease-expo)]',
        size === 'md' ? 'size-40' : 'size-28',
        state === 'complete' && 'scale-125',
        className,
      )}
    >
      {state === 'idle' || state === 'complete' ? (
        <>
          <span className="border-brand-accent/45 animate-pulse-ring absolute inset-[18%] rounded-full border-[1.5px]" />
          <span className="border-brand-accent/45 animate-pulse-ring absolute inset-[18%] rounded-full border-[1.5px] [animation-delay:1.2s]" />
        </>
      ) : null}
      {state === 'processing' ? (
        <span className="border-t-brand-accent-light absolute inset-[10%] animate-spin rounded-full border-[2.5px] border-transparent" />
      ) : null}
      <span
        className={cn(
          'grid place-items-center rounded-full transition-[filter,box-shadow] duration-[var(--duration-smooth)]',
          size === 'md' ? 'size-[6.5rem]' : 'size-[4.5rem]',
          isRecording
            ? 'bg-danger-base shadow-[0_0_48px_8px_color-mix(in_srgb,var(--danger-base)_45%,transparent)]'
            : 'bg-brand-sun shadow-[0_0_64px_10px_color-mix(in_srgb,var(--brand-accent)_40%,transparent)]',
          state === 'complete' &&
            'shadow-[0_0_96px_28px_color-mix(in_srgb,var(--brand-accent)_55%,transparent)]',
          state === 'error' && 'shadow-none brightness-75 saturate-[.35]',
        )}
      >
        <BrandMark
          withSun={false}
          className={cn(
            size === 'md' ? 'w-14' : 'w-10',
            isRecording ? '[--logo-seam:var(--danger-base)]' : '[--logo-seam:var(--brand-accent)]',
          )}
          partClassNames={{
            hump: isRecording ? 'fill-text-on-inverse' : 'fill-brand-deepest',
            neck: isRecording ? 'fill-text-on-inverse' : 'fill-brand-deepest',
          }}
        />
      </span>
      {isRecording ? (
        <span className="absolute -bottom-1 left-1/2 flex h-5 -translate-x-1/2 items-end gap-[3px]">
          {WAVE_DELAYS_MS.map((delay) => (
            <i
              key={delay}
              className="bg-danger-base animate-wave h-full w-1 origin-bottom rounded-full"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}
