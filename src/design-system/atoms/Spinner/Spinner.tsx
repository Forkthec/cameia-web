/** Reutiliza el ícono "loading-arc" del registro (CLAUDE.md §3.3) en vez de dibujar otro glifo de carga. */
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

interface SpinnerProps {
  size?: number;
  /** Anunciado a lectores de pantalla mientras carga. Sin texto por defecto. */
  label: string;
  /**
   * Por defecto `label` es solo para lectores de pantalla (`sr-only`): así
   * se usaba hasta ahora, cuando el spinner es la única pista de carga en
   * pantalla (p. ej. `RequireAuth`, a pantalla completa). En `false`,
   * `label` también se muestra como texto visible junto al ícono, para un
   * spinner que convive con más contenido y necesita explicarse a un
   * usuario vidente, no solo anunciarse.
   */
  hideLabel?: boolean;
  className?: string;
}

export function Spinner({ size = 20, label, hideLabel = true, className }: SpinnerProps) {
  return (
    <span role="status" className={cn('gap-space-2 inline-flex items-center', className)}>
      <Icon name="loading-arc" size={size} className="text-brand-base animate-spin" />
      <span className={hideLabel ? 'sr-only' : 'text-small text-text-muted'}>{label}</span>
    </span>
  );
}
