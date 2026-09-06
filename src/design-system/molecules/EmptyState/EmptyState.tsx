/**
 * Para "sin resultados" y placeholders similares. El ícono ya es decorativo
 * por defecto (Icon se marca aria-hidden solo cuando no recibe `title`, y
 * aquí no se le pasa ninguno), así que no hace falta forzar nada.
 */
import { cloneElement, type ReactElement } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '../../atoms/Button';

interface EmptyStateProps {
  icon?: ReactElement<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('gap-space-3 p-space-6 flex flex-col items-center text-center', className)}>
      {icon ? cloneElement(icon, { size: 48, className: 'text-text-muted' }) : null}
      <div className="gap-space-1 flex flex-col">
        <p className="text-body text-text-primary font-semibold">{title}</p>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
