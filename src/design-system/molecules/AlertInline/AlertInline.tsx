/**
 * El color vive en el ícono, el fondo y el borde; el texto del mensaje se
 * queda en `text-primary` (neutral) por legibilidad — no todo el bloque se
 * tiñe del color del estado.
 */
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_CONFIG = {
  success: {
    icon: 'check-circle',
    bg: 'bg-success-tint',
    border: 'border-success-base',
    accent: 'text-success-base',
  },
  error: {
    icon: 'alert-circle',
    bg: 'bg-danger-tint',
    border: 'border-danger-base',
    accent: 'text-danger-base',
  },
  warning: {
    icon: 'alert-triangle',
    bg: 'bg-warning-tint',
    border: 'border-warning-base',
    accent: 'text-warning-base',
  },
  info: { icon: 'info', bg: 'bg-info-tint', border: 'border-info-base', accent: 'text-info-base' },
} as const;

interface AlertInlineProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}

export function AlertInline({ variant, children, className }: AlertInlineProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'gap-space-2 p-space-3 flex items-start rounded-md border',
        config.bg,
        config.border,
        className,
      )}
    >
      <Icon name={config.icon} size={20} className={cn('shrink-0', config.accent)} />
      <p className="text-small text-text-primary">{children}</p>
    </div>
  );
}
