/** Reutiliza el ícono "loading-arc" del registro (CLAUDE.md §3.3) en vez de dibujar otro glifo de carga. */
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

interface SpinnerProps {
  size?: number;
  /** Anunciado a lectores de pantalla mientras carga. Sin texto por defecto. */
  label: string;
  className?: string;
}

export function Spinner({ size = 20, label, className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <Icon name="loading-arc" size={size} className="text-brand-base animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
