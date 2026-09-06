/**
 * Marcador de posición mientras carga contenido. Puramente decorativo
 * (`aria-hidden`): el anuncio de "cargando" para lectores de pantalla lo da
 * un {@link ../Spinner} o un `aria-busy` en el contenedor, no cada Skeleton.
 * Tamaño y forma los define quien lo usa vía `className` (ancho/alto varían
 * demasiado según qué esté reemplazando como para tener un default único).
 */
import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-bg-surface-sunken animate-pulse rounded-md', className)}
    />
  );
}
