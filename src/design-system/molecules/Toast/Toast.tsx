/**
 * A diferencia de AlertInline (fondo teñido, para vivir dentro de un
 * formulario), Toast es una tarjeta elevada (`shadow-elevation-2`) sobre
 * `bg-surface`, pensada para flotar sobre el resto de la interfaz.
 */
import { cn } from '@/utils/cn';
import { Button } from '../../atoms/Button';
import { Icon } from '../../icons/Icon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_ICON = {
  success: { name: 'check-circle', accent: 'text-success-base' },
  error: { name: 'alert-circle', accent: 'text-danger-base' },
  warning: { name: 'alert-triangle', accent: 'text-warning-base' },
  info: { name: 'info', accent: 'text-info-base' },
} as const;

interface ToastBaseProps {
  variant?: ToastVariant;
  children: string;
  className?: string;
}

type ToastProps = ToastBaseProps &
  (
    | { onDismiss?: undefined; dismissLabel?: never }
    // Sin texto por defecto: quien use Toast decide cómo se lee "cerrar".
    | { onDismiss: () => void; dismissLabel: string }
  );

export function Toast({
  variant = 'info',
  children,
  onDismiss,
  dismissLabel,
  className,
}: ToastProps) {
  const config = VARIANT_ICON[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'gap-space-2 bg-bg-surface p-space-4 shadow-elevation-2 flex items-start rounded-lg',
        className,
      )}
    >
      <Icon name={config.name} size={20} className={cn('shrink-0', config.accent)} />
      <p className="text-small text-text-primary flex-1">{children}</p>
      {onDismiss ? (
        <Button
          variant="icon"
          size="sm"
          className="shrink-0"
          onClick={onDismiss}
          icon={<Icon name="close" />}
        >
          {dismissLabel}
        </Button>
      ) : null}
    </div>
  );
}
