/**
 * Figma no define variantes formales de tamaño para Avatar (a diferencia de
 * Button o Input), así que `size` es un número libre en vez de un enum
 * inventado. Sin `src`, cae a las iniciales de `fallback` — nunca a un
 * ícono de persona por defecto que sustituya contenido real.
 */
import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string;
  /** Nombre de la persona; siempre requerido como texto alternativo/accesible. */
  alt: string;
  /** Iniciales u otro texto corto para cuando no hay `src`. */
  fallback: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 40, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'bg-brand-tint text-brand-base inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={alt} className="text-small font-semibold">
          {fallback}
        </span>
      )}
    </span>
  );
}
